-- PA3 (PROBLEMA 20) — RPC atomica para registro de aceite de contrato.
--
-- Validacoes:
--   - contrato existe
--   - contrato NAO esta terminal (encerrado/cancelado)
--   - usuario autenticado e o cliente dono do contrato
--     (clients.user_id = auth.uid())
--   - contrato nao foi aceito antes (idempotencia: retorna
--     already_accepted=true sem reescrever)
--
-- Efeitos:
--   - seta accepted_at = now()
--   - seta accepted_by_user_id = auth.uid()
--   - seta acceptance_ip = p_ip (opcional)
--   - transita status rascunho -> ativo automaticamente
--     (se ainda em rascunho) via reaproveitamento da RPC
--     transition_project_contract existente (P14)
--   - registra timeline_event 'contract_accepted_by_client'

CREATE OR REPLACE FUNCTION public.register_contract_acceptance(
  p_contract_id uuid,
  p_ip text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_contract RECORD;
  v_client RECORD;
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_was_rascunho boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'nao autenticado';
  END IF;

  SELECT * INTO v_contract
    FROM public.project_contracts
   WHERE id = p_contract_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'contrato nao encontrado';
  END IF;

  IF v_contract.status IN ('encerrado', 'cancelado') THEN
    RAISE EXCEPTION 'contrato em estado terminal (%) — nao pode ser aceito', v_contract.status;
  END IF;

  SELECT id, user_id, full_name INTO v_client
    FROM public.clients
   WHERE id = v_contract.client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cliente do contrato nao encontrado';
  END IF;

  IF v_client.user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'forbidden: apenas o cliente dono do contrato pode aceita-lo';
  END IF;

  -- Idempotencia.
  IF v_contract.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'contract_id', p_contract_id,
      'accepted_at', v_contract.accepted_at,
      'already_accepted', true
    );
  END IF;

  v_was_rascunho := (v_contract.status = 'rascunho');

  UPDATE public.project_contracts
     SET accepted_at = v_now,
         accepted_by_user_id = v_uid,
         acceptance_ip = NULLIF(trim(COALESCE(p_ip, '')), ''),
         updated_at = v_now
   WHERE id = p_contract_id;

  -- Ativa o contrato automaticamente se ainda em rascunho.
  IF v_was_rascunho THEN
    PERFORM set_config(
      'app.contract_change_reason',
      'Ativacao automatica apos aceite do cliente',
      true
    );
    UPDATE public.project_contracts
       SET status = 'ativo',
           signed_at = COALESCE(signed_at, CURRENT_DATE),
           updated_at = v_now
     WHERE id = p_contract_id;
  END IF;

  -- Timeline event.
  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_contract.client_id,
    v_contract.project_id,
    'contract_accepted_by_client',
    'Contrato aceito pelo cliente',
    format('Cliente %s aceitou o contrato v%s.', v_client.full_name, v_contract.version_no),
    'ambos',
    'project_contracts',
    p_contract_id,
    v_uid,
    jsonb_build_object(
      'accepted_at', v_now,
      'acceptance_ip', NULLIF(trim(COALESCE(p_ip, '')), ''),
      'version_no', v_contract.version_no,
      'was_rascunho', v_was_rascunho,
      'auto_activated', v_was_rascunho
    )
  );

  RETURN jsonb_build_object(
    'contract_id', p_contract_id,
    'accepted_at', v_now,
    'already_accepted', false,
    'auto_activated', v_was_rascunho
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.register_contract_acceptance(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.register_contract_acceptance(uuid, text) IS
  'PA3: registra aceite formal de contrato pelo cliente dono. Atomico: seta accepted_at/accepted_by_user_id/acceptance_ip, ativa o contrato se estiver em rascunho (transicao automatica) e dispara timeline_event. Idempotente — segundo aceite retorna already_accepted=true. Rejeita contratos em estado terminal.';
