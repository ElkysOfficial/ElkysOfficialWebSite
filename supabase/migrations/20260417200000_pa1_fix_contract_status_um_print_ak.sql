-- PA1 (PROBLEMA 19) — data patch: restaurar status 'ativo' para dois
-- contratos incorretamente marcados como 'encerrado':
--   1) "1 Um Print Comunicacao"
--   2) "AK Producoes" (manutencao tecnica e hospedagem)
--
-- Criterio: contratos em estado 'encerrado' cujo cliente bate por
-- razao_social/nome_fantasia/full_name. Idempotente (so atua em
-- registros ainda 'encerrado'). Match case-insensitive e tolerante
-- a acentos via normalizacao simples ILIKE.
--
-- Seguranca:
--   - transacao unica
--   - set_config define motivo para o trigger fn_version_project_contract
--     capturar no historico
--   - timeline_event registra a correcao para auditoria
--   - UPDATE so se aplica onde pc.status = 'encerrado' AND bate o nome

BEGIN;

-- Motivo registrado no historico de versionamento.
SELECT set_config('app.contract_change_reason',
  'PA1 data fix: contratos marcados como encerrado erroneamente foram restaurados para ativo',
  true);

DO $$
DECLARE
  v_contract RECORD;
  v_total_fixed int := 0;
BEGIN
  FOR v_contract IN
    SELECT pc.id, pc.client_id, pc.project_id, c.full_name
      FROM public.project_contracts pc
      JOIN public.clients c ON c.id = pc.client_id
     WHERE pc.status = 'encerrado'
       AND (
         c.razao_social  ILIKE '%Um Print%'
         OR c.nome_fantasia ILIKE '%Um Print%'
         OR c.full_name     ILIKE '%Um Print%'
         OR c.razao_social  ILIKE '%AK Produ%'
         OR c.nome_fantasia ILIKE '%AK Produ%'
         OR c.full_name     ILIKE '%AK Produ%'
       )
  LOOP
    UPDATE public.project_contracts
       SET status = 'ativo',
           updated_at = now()
     WHERE id = v_contract.id;

    INSERT INTO public.timeline_events (
      client_id, project_id, event_type, title, summary, visibility,
      source_table, source_id, actor_user_id, metadata
    ) VALUES (
      v_contract.client_id,
      v_contract.project_id,
      'contract_status_corrected',
      'Contrato corrigido: encerrado -> ativo',
      format('Correcao PA1: cliente %s teve contrato restaurado para ativo.', v_contract.full_name),
      'interno',
      'project_contracts',
      v_contract.id,
      NULL,
      jsonb_build_object(
        'from_status', 'encerrado',
        'to_status',   'ativo',
        'reason',      'PA1 data fix',
        'migration',   '20260417200000_pa1_fix_contract_status_um_print_ak'
      )
    );

    v_total_fixed := v_total_fixed + 1;
  END LOOP;

  RAISE NOTICE 'PA1: % contrato(s) restaurado(s) para ativo.', v_total_fixed;
END;
$$;

COMMIT;
