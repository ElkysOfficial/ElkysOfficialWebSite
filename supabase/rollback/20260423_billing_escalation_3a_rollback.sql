-- =========================================================================
-- ROLLBACK: Fase 3a da regua de paralisacao
-- =========================================================================
-- Reverte:
--   - 20260423120000_billing_rules_d3_d15.sql
--   - 20260423120100_inadimplencia_warning_tracking.sql
--
-- Quando executar:
--   - Push aplicou mas alguma validacao pos-push falhou
--   - Trigger em clients gerou comportamento inesperado
--   - Cron disparou erro repetido
--
-- Como executar:
--   psql $DATABASE_URL -f supabase/rollback/20260423_billing_escalation_3a_rollback.sql
--   OU colar direto no SQL editor do Supabase Dashboard
--
-- ATENCAO: eh executado em transacao unica. Se qualquer statement falhar,
--          tudo eh revertido e o rollback nao aconteceu. Rever o erro antes
--          de tentar de novo.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1) Desagendar crons (seguros; nao tocam em dados do app)
-- -------------------------------------------------------------------------
SELECT cron.unschedule('send-inadimplencia-warning')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-inadimplencia-warning');

SELECT cron.unschedule('mark-overdue-clients-inadimplente')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mark-overdue-clients-inadimplente');

-- -------------------------------------------------------------------------
-- 2) Remover trigger + funcao de tracking (trigger antes da funcao)
-- -------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_track_client_inadimplencia_transitions
  ON public.clients;

DROP FUNCTION IF EXISTS public.track_client_inadimplencia_transitions();

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
-- CUIDADO: se alguem criou manualmente rows com estes nomes antes da
-- migration rodar, este DELETE remove tambem. A migration tem guards
-- WHERE NOT EXISTS, entao so insere se nao existia. Logo, se houver row
-- com este nome agora, foi inserida pela migration — seguro deletar.

DELETE FROM public.billing_rules
WHERE name IN ('Lembrete 3 dias em atraso', 'Aviso 15 dias em atraso');

DELETE FROM public.billing_templates
WHERE name IN ('Lembrete 3 dias em atraso', 'Aviso 15 dias em atraso');

-- -------------------------------------------------------------------------
-- 5) Limpar tracker de migrations para permitir re-aplicacao futura
-- -------------------------------------------------------------------------
DELETE FROM supabase_migrations.schema_migrations
WHERE version IN ('20260423120000', '20260423120100');

COMMIT;

-- =========================================================================
-- Pos-rollback: conferir que nada sobrou
-- =========================================================================
-- Rodar manualmente apos o rollback:
--
-- SELECT to_regclass('public.client_inadimplencia_warnings');  -- NULL
-- SELECT 1 FROM cron.job WHERE jobname IN
--   ('send-inadimplencia-warning','mark-overdue-clients-inadimplente');  -- 0 rows
-- SELECT 1 FROM billing_rules WHERE name IN
--   ('Lembrete 3 dias em atraso','Aviso 15 dias em atraso');  -- 0 rows
-- =========================================================================
