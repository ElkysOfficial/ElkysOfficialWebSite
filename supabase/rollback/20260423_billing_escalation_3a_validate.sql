-- =========================================================================
-- VALIDACAO POS-PUSH: Fase 3a da regua de paralisacao
-- =========================================================================
-- Executar IMEDIATAMENTE apos `supabase db push`. Se qualquer checagem
-- vier inesperada, rodar o rollback antes de qualquer outro passo.
--
-- Uso:
--   psql $DATABASE_URL -f supabase/rollback/20260423_billing_escalation_3a_validate.sql
--   OU colar no SQL editor do Dashboard (rodar secao por secao)
-- =========================================================================

-- 1) Migrations aplicadas (esperado: 2 linhas, ambas as versoes)
SELECT version
FROM supabase_migrations.schema_migrations
WHERE version IN ('20260423120000', '20260423120100')
ORDER BY version;

-- 2) Tabela nova existe (esperado: nome retornado, nao NULL)
SELECT to_regclass('public.client_inadimplencia_warnings') AS table_oid;

-- 3) RLS habilitada na tabela nova (esperado: relrowsecurity = true)
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'client_inadimplencia_warnings';

-- 4) Unique index aberto + indices de apoio (esperado: 3 indices criados + pkey)
SELECT indexname
FROM pg_indexes
WHERE tablename = 'client_inadimplencia_warnings'
ORDER BY indexname;

-- 5) Trigger anexado em clients (esperado: 1 linha)
SELECT tgname, tgrelid::regclass AS on_table, tgenabled
FROM pg_trigger
WHERE tgname = 'trg_track_client_inadimplencia_transitions'
  AND NOT tgisinternal;

-- 6) Funcoes SQL existem (esperado: 2 linhas)
SELECT proname
FROM pg_proc
WHERE proname IN (
  'track_client_inadimplencia_transitions',
  'mark_overdue_clients_inadimplente'
)
ORDER BY proname;

-- 7) Crons cadastrados sem duplicata (esperado: exatamente 2 linhas)
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'mark-overdue-clients-inadimplente',
  'send-inadimplencia-warning'
)
ORDER BY jobname;

-- 7b) Checar duplicatas do mesmo jobname (esperado: 0 linhas)
SELECT jobname, COUNT(*) AS n
FROM cron.job
WHERE jobname IN (
  'mark-overdue-clients-inadimplente',
  'send-inadimplencia-warning'
)
GROUP BY jobname
HAVING COUNT(*) > 1;

-- 8) billing_rules novas (esperado: 2 linhas, is_active=true)
SELECT name, trigger_days, action_type, is_active, sort_order
FROM public.billing_rules
WHERE name IN ('Lembrete 3 dias em atraso', 'Aviso 15 dias em atraso')
ORDER BY trigger_days;

-- 9) billing_templates novos (esperado: 2 linhas, is_active=true)
SELECT name, type, is_active
FROM public.billing_templates
WHERE name IN ('Lembrete 3 dias em atraso', 'Aviso 15 dias em atraso')
ORDER BY name;

-- 10) billing_rules apontam pro template correto (esperado: 2 linhas, template_id NOT NULL)
SELECT r.name AS rule_name, t.name AS template_name
FROM public.billing_rules r
JOIN public.billing_templates t ON t.id = r.template_id
WHERE r.name IN ('Lembrete 3 dias em atraso', 'Aviso 15 dias em atraso')
ORDER BY r.trigger_days;
