-- PROBLEMA 14 — RPC atomica para transitar contratos pelo ciclo de
-- vida (rascunho → ativo → encerrado/cancelado). Sem essa RPC,
-- todos os contratos ficavam presos em rascunho — o ciclo de vida
-- juridico nao tinha mecanismo de progressao no sistema.
--
-- Validacoes de transicao:
--   rascunho   → ativo, cancelado     (permitido)
--   ativo      → encerrado, cancelado (permitido)
--   encerrado  → *                    (estado terminal — rejeitado)
--   cancelado  → *                    (estado terminal — rejeitado)
--
-- Efeitos colaterais por transicao:
--   → ativo:    set signed_at = COALESCE(input, today)
--   → encerrado: set ends_at = COALESCE(input, today)
--   → cancelado: nenhum
--
-- O trigger fn_version_project_contract (criado em PROBLEMA 9 ciclo
-- anterior, migration 20260415170000) automaticamente captura a
-- mudanca de status e cria entrada no historico de versoes via
-- app.contract_change_reason setting.

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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  IF p_to_status NOT IN ('ativo', 'encerrado', 'cancelado') THEN
    RAISE EXCEPTION 'status invalido: deve ser ativo, encerrado ou cancelado (rascunho e estado inicial, nao destino)';
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

  -- Validacao de transicao: rascunho nao pode pular direto pra encerrado.
  IF v_contract.status = 'rascunho' AND v_new_status = 'encerrado' THEN
    RAISE EXCEPTION 'contrato em rascunho nao pode ser encerrado direto — ative primeiro';
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
      WHEN 'ativo' THEN 'contract_activated'
      WHEN 'encerrado' THEN 'contract_closed'
      WHEN 'cancelado' THEN 'contract_cancelled'
    END,
    format('Contrato %s',
      CASE v_new_status
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

GRANT EXECUTE ON FUNCTION public.transition_project_contract(uuid, text, date, date, text) TO authenticated;

COMMENT ON FUNCTION public.transition_project_contract(uuid, text, date, date, text) IS
  'Transita um contrato pelo ciclo de vida juridico. Atomico: valida estado de origem, atualiza status, preenche signed_at/ends_at quando aplicavel, registra timeline event, e o trigger de versionamento captura a mudanca para o historico. Idempotente: se contrato ja esta no estado destino, retorna sem reescrever. Estados terminais (encerrado/cancelado) sao bloqueados de novas transicoes.';
