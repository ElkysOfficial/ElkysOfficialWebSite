-- Adiciona status 'em_validacao' ao ciclo de vida do contrato e
-- permite que a role 'juridico' execute transicoes de contrato.
--
-- Ciclo de vida atualizado:
--   rascunho → em_validacao → ativo → encerrado/cancelado
--   rascunho → ativo (admin pode pular validacao)
--   em_validacao → cancelado (juridico pode cancelar direto)
--
-- A role juridico pode: rascunho→em_validacao, em_validacao→ativo,
-- além de tudo que admin já faz.

-- 1. Adiciona valor ao enum
ALTER TYPE public.contract_record_status ADD VALUE IF NOT EXISTS 'em_validacao' BEFORE 'ativo';

-- 2. Helper: verifica se user tem role admin OU juridico
CREATE OR REPLACE FUNCTION public.is_admin_or_juridico(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin_super', 'admin', 'juridico')
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_or_juridico(UUID) TO authenticated;

-- 3. Atualiza a RPC de transicao para aceitar juridico e em_validacao
CREATE OR REPLACE FUNCTION public.transition_project_contract(
  p_contract_id uuid,
  p_to_status text,
  p_signed_at date DEFAULT NULL,
  p_ends_at date DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_contract RECORD;
  v_new_status contract_record_status;
  v_today date := CURRENT_DATE;
  v_now timestamptz := now();
BEGIN
  -- Permite admin, admin_super e juridico
  IF NOT public.is_admin_or_juridico(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin or juridico role required';
  END IF;

  IF p_to_status NOT IN ('em_validacao', 'ativo', 'encerrado', 'cancelado') THEN
    RAISE EXCEPTION 'status invalido: deve ser em_validacao, ativo, encerrado ou cancelado';
  END IF;

  v_new_status := p_to_status::contract_record_status;

  SELECT * INTO v_contract FROM public.project_contracts WHERE id = p_contract_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'contrato nao encontrado';
  END IF;

  -- Bloqueio de estados terminais.
  IF v_contract.status IN ('encerrado', 'cancelado') THEN
    RAISE EXCEPTION 'contrato esta em estado terminal (%) — nao pode mais transitar', v_contract.status;
  END IF;

  -- Idempotencia: ja esta no estado destino → retorna sem mudar nada.
  IF v_contract.status = v_new_status THEN
    RETURN jsonb_build_object(
      'contract_id', p_contract_id,
      'status', v_new_status,
      'already_in_state', true
    );
  END IF;

  -- Validacoes de transicao
  -- rascunho pode ir para em_validacao, ativo ou cancelado
  IF v_contract.status = 'rascunho' AND v_new_status = 'encerrado' THEN
    RAISE EXCEPTION 'contrato em rascunho nao pode ser encerrado direto — ative primeiro';
  END IF;

  -- em_validacao pode ir para ativo ou cancelado (não volta pra rascunho)
  IF v_contract.status = 'em_validacao' AND v_new_status = 'rascunho' THEN
    RAISE EXCEPTION 'contrato em validacao nao pode voltar para rascunho';
  END IF;
  IF v_contract.status = 'em_validacao' AND v_new_status = 'encerrado' THEN
    RAISE EXCEPTION 'contrato em validacao nao pode ser encerrado direto — ative primeiro';
  END IF;

  -- ativo nao pode voltar pra rascunho ou em_validacao
  IF v_contract.status = 'ativo' AND v_new_status IN ('rascunho', 'em_validacao') THEN
    RAISE EXCEPTION 'contrato ativo nao pode regredir para %', v_new_status;
  END IF;

  -- Set reason no setting de sessao para o trigger de versionamento captar.
  IF p_reason IS NOT NULL AND length(trim(p_reason)) > 0 THEN
    PERFORM set_config('app.contract_change_reason', trim(p_reason), true);
  END IF;

  -- Aplica transicao com efeitos colaterais.
  UPDATE public.project_contracts
     SET status = v_new_status,
         signed_at = CASE
                       WHEN v_new_status = 'ativo' AND signed_at IS NULL
                         THEN COALESCE(p_signed_at, v_today)
                       ELSE signed_at
                     END,
         ends_at = CASE
                     WHEN v_new_status = 'encerrado' AND ends_at IS NULL
                       THEN COALESCE(p_ends_at, v_today)
                     ELSE ends_at
                   END,
         updated_at = v_now
   WHERE id = p_contract_id;

  -- Timeline event.
  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_contract.client_id, v_contract.project_id,
    CASE v_new_status
      WHEN 'em_validacao' THEN 'contract_sent_for_validation'
      WHEN 'ativo' THEN 'contract_activated'
      WHEN 'encerrado' THEN 'contract_closed'
      WHEN 'cancelado' THEN 'contract_cancelled'
    END,
    format('Contrato %s',
      CASE v_new_status
        WHEN 'em_validacao' THEN 'enviado para validação'
        WHEN 'ativo' THEN 'ativado'
        WHEN 'encerrado' THEN 'encerrado'
        WHEN 'cancelado' THEN 'cancelado'
      END),
    CASE
      WHEN p_reason IS NOT NULL AND length(trim(p_reason)) > 0
        THEN format('Transicao %s → %s. Motivo: %s', v_contract.status, v_new_status, trim(p_reason))
      ELSE format('Transicao %s → %s.', v_contract.status, v_new_status)
    END,
    'interno', 'project_contracts', p_contract_id, auth.uid(),
    jsonb_build_object(
      'from_status', v_contract.status,
      'to_status', v_new_status,
      'reason', NULLIF(trim(COALESCE(p_reason, '')), '')
    )
  );

  RETURN jsonb_build_object(
    'contract_id', p_contract_id,
    'from_status', v_contract.status,
    'to_status', v_new_status,
    'already_in_state', false
  );
END;
$func$;

COMMENT ON FUNCTION public.transition_project_contract(uuid, text, date, date, text) IS
  'Transita contrato pelo ciclo de vida juridico. Aceita roles admin, admin_super e juridico. Ciclo: rascunho → em_validacao → ativo → encerrado/cancelado. Admin pode pular em_validacao indo direto rascunho→ativo.';
