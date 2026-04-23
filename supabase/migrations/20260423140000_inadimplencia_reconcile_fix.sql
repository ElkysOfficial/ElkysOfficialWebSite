-- Hotfix v2.89.1: deteccao de inadimplencia via view, nao via UPDATE em snapshot legado.
--
-- Contexto:
--   clients.contract_status virou snapshot protegido pelo guard
--   fn_guard_clients_legacy_snapshots (adicionado em 2026-04-17, ref migration
--   20260417120000_clients_snapshot_write_guard.sql). Qualquer UPDATE direto
--   e rejeitado com P0001, sem bypass mesmo em SECURITY DEFINER.
--
--   Consequencias no release v2.89.0:
--   - O cron mark_overdue_clients_inadimplente() (funcao de 2026-03-26 agendada
--     em 20260423120100) falha todo dia 07h UTC porque tenta UPDATE direto.
--   - O trigger track_client_inadimplencia_transitions (20260423120100) nao
--     dispara porque ninguem atualiza a coluna legada.
--
-- Solucao:
--   Reconciliar client_inadimplencia_warnings contra
--   client_financial_summary.contract_status_calculated, que eh a fonte de
--   verdade computada em tempo real a partir de charges + project_contracts.
--
-- Idempotencia: toda DDL usa DROP/CREATE OR REPLACE; cron eh desagendado antes
-- de reagendar.

-- -------------------------------------------------------------------------
-- 1) Remover mecanismo morto introduzido em v2.89.0
-- -------------------------------------------------------------------------

-- Desagendar cron quebrado que tentaria UPDATE em clients.contract_status.
DO $$
BEGIN
  PERFORM cron.unschedule('mark-overdue-clients-inadimplente')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mark-overdue-clients-inadimplente');
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Trigger + funcao de tracking viraram no-op por desenho (nao recebem eventos).
DROP TRIGGER IF EXISTS trg_track_client_inadimplencia_transitions ON public.clients;
DROP FUNCTION IF EXISTS public.track_client_inadimplencia_transitions();

-- Nota: a funcao legada mark_overdue_clients_inadimplente() nao eh dropada aqui
-- porque ela foi criada em migration anterior (20260326220000) e pode ser
-- referenciada por outros lugares ainda desconhecidos. Fica orfa mas inativa.

-- -------------------------------------------------------------------------
-- 2) Nova funcao: reconcilia abertos/fechados contra a view.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reconcile_inadimplencia_warnings()
RETURNS TABLE (opened INT, closed INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_opened INT := 0;
  v_closed INT := 0;
BEGIN
  -- Abre warning para cada cliente calculado como inadimplente sem row aberta.
  -- ON CONFLICT cobre corrida concorrente via unique partial index
  -- idx_client_inadimplencia_warnings_open (client_id) WHERE exited_at IS NULL.
  WITH ins AS (
    INSERT INTO public.client_inadimplencia_warnings (client_id)
    SELECT cfs.client_id
    FROM public.client_financial_summary cfs
    WHERE cfs.contract_status_calculated = 'inadimplente'
      AND cfs.client_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.client_inadimplencia_warnings w
        WHERE w.client_id = cfs.client_id
          AND w.exited_at IS NULL
      )
    ON CONFLICT (client_id) WHERE exited_at IS NULL DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_opened FROM ins;

  -- Fecha warning aberto para clientes que deixaram de ser inadimplentes
  -- segundo a view.
  WITH upd AS (
    UPDATE public.client_inadimplencia_warnings w
    SET exited_at = now()
    WHERE w.exited_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.client_financial_summary cfs
        WHERE cfs.client_id = w.client_id
          AND cfs.contract_status_calculated = 'inadimplente'
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_closed FROM upd;

  RAISE NOTICE '[reconcile_inadimplencia_warnings] opened=% closed=%', v_opened, v_closed;

  RETURN QUERY SELECT v_opened, v_closed;
END;
$func$;

-- -------------------------------------------------------------------------
-- 3) Cron diario: reconciliar 07h UTC, antes do send-inadimplencia-warning
--    (07h30 UTC) que le a fila de pendentes.
-- -------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('reconcile-inadimplencia-warnings')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reconcile-inadimplencia-warnings');
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

SELECT cron.schedule(
  'reconcile-inadimplencia-warnings',
  '0 7 * * *',
  $$SELECT public.reconcile_inadimplencia_warnings();$$
);
