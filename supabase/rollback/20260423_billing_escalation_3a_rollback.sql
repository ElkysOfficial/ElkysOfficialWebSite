-- =========================================================================
-- ROLLBACK: Fase 3a da regua de paralisacao (v2.89.0 + v2.89.1)
-- =========================================================================
-- Reverte:
--   - 20260423120000_billing_rules_d3_d15.sql
--   - 20260423120100_inadimplencia_warning_tracking.sql
--   - 20260423140000_inadimplencia_reconcile_fix.sql
--
-- Executa em transacao unica. Safe para rodar mesmo se o hotfix v2.89.1
-- nao tiver sido aplicado (todos os DROPs usam IF EXISTS).
--
-- Uso:
--   psql $DATABASE_URL -f supabase/rollback/20260423_billing_escalation_3a_rollback.sql
--   OU colar no SQL editor do Supabase Dashboard.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1) Desagendar crons
-- -------------------------------------------------------------------------
SELECT cron.unschedule('reconcile-inadimplencia-warnings')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reconcile-inadimplencia-warnings');

SELECT cron.unschedule('send-inadimplencia-warning')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-inadimplencia-warning');

SELECT cron.unschedule('mark-overdue-clients-inadimplente')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mark-overdue-clients-inadimplente');

-- -------------------------------------------------------------------------
-- 2) Remover funcoes + trigger introduzidos por v2.89.0 e v2.89.1
-- -------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.reconcile_inadimplencia_warnings();

DROP TRIGGER IF EXISTS trg_track_client_inadimplencia_transitions
  ON public.clients;
DROP FUNCTION IF EXISTS public.track_client_inadimplencia_transitions();

-- NAO remove public.mark_overdue_clients_inadimplente() — foi criada em
-- 2026-03-26 (pre-escopo desta entrega) e pode ter outras referencias.

-- -------------------------------------------------------------------------
-- 3) Remover policy + tabela de tracking
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins and finance can view inadimplencia warnings"
  ON public.client_inadimplencia_warnings;

-- Tabela nova e sem historico relevante. DROP remove todos os indices.
-- Se quiser preservar eventos ja registrados, fazer backup antes:
--   CREATE TABLE _rollback_client_inadimplencia_warnings AS
--     SELECT * FROM public.client_inadimplencia_warnings;
DROP TABLE IF EXISTS public.client_inadimplencia_warnings;

-- -------------------------------------------------------------------------
-- 4) Remover rows inseridas em billing_rules / billing_templates
-- -------------------------------------------------------------------------
-- A migration usou WHERE NOT EXISTS, entao so inseriu se nao havia. Se existir
-- row com estes nomes agora, foi criado pela migration — seguro deletar.
DELETE FROM public.billing_rules
WHERE name IN ('Lembrete 3 dias em atraso', 'Aviso 15 dias em atraso');

DELETE FROM public.billing_templates
WHERE name IN ('Lembrete 3 dias em atraso', 'Aviso 15 dias em atraso');

-- -------------------------------------------------------------------------
-- 5) Limpar tracker de migrations para permitir re-aplicacao
-- -------------------------------------------------------------------------
DELETE FROM supabase_migrations.schema_migrations
WHERE version IN ('20260423120000', '20260423120100', '20260423140000');

COMMIT;

-- =========================================================================
-- Pos-rollback: conferir que nada sobrou
-- =========================================================================
-- SELECT to_regclass('public.client_inadimplencia_warnings');                 -- NULL
-- SELECT proname FROM pg_proc
-- WHERE proname IN ('reconcile_inadimplencia_warnings',
--                   'track_client_inadimplencia_transitions');                -- 0 rows
-- SELECT 1 FROM cron.job WHERE jobname IN
--   ('reconcile-inadimplencia-warnings',
--    'send-inadimplencia-warning',
--    'mark-overdue-clients-inadimplente');                                    -- 0 rows
-- SELECT 1 FROM billing_rules WHERE name IN
--   ('Lembrete 3 dias em atraso', 'Aviso 15 dias em atraso');                 -- 0 rows
-- =========================================================================
