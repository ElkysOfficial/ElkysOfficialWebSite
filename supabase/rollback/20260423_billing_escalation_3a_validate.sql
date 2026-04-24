-- =========================================================================
-- VALIDACAO POS-PUSH (v2.89.1): Fase 3a da regua de paralisacao
-- =========================================================================
-- Executar no Dashboard SQL editor apos o hotfix. Cada bloco tem o
-- resultado esperado comentado em linha.
-- =========================================================================

-- 1) Migrations aplicadas (esperado: 3 linhas)
SELECT version
FROM supabase_migrations.schema_migrations
WHERE version IN ('20260423120000', '20260423120100', '20260423140000')
ORDER BY version;

-- 2) Tabela + indices persistem (esperado: table_oid nao-NULL, 4 indices)
SELECT to_regclass('public.client_inadimplencia_warnings') AS table_oid;

SELECT indexname
FROM pg_indexes
WHERE tablename = 'client_inadimplencia_warnings'
ORDER BY indexname;

-- 3) RLS continua habilitada (esperado: relrowsecurity = true)
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'client_inadimplencia_warnings';

-- 4) Mecanismo morto deve ter sumido
--    Esperado: 0 linhas em cada query
SELECT tgname
FROM pg_trigger
WHERE tgname = 'trg_track_client_inadimplencia_transitions'
  AND NOT tgisinternal;

SELECT proname
FROM pg_proc
WHERE proname = 'track_client_inadimplencia_transitions';

-- 5) Funcao nova de reconciliacao existe (esperado: 1 linha)
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'reconcile_inadimplencia_warnings';

-- 6) Crons ativos (esperado: EXATAMENTE 2 linhas)
--    - reconcile-inadimplencia-warnings (0 7 * * *)
--    - send-inadimplencia-warning (30 7 * * *)
--    NAO deve aparecer: mark-overdue-clients-inadimplente
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'reconcile-inadimplencia-warnings',
  'send-inadimplencia-warning',
  'mark-overdue-clients-inadimplente'
)
ORDER BY jobname;

-- 6b) Sem cron duplicado (esperado: 0 linhas)
SELECT jobname, COUNT(*) AS n
FROM cron.job
WHERE jobname IN (
  'reconcile-inadimplencia-warnings',
  'send-inadimplencia-warning'
)
GROUP BY jobname
HAVING COUNT(*) > 1;

-- 7) billing rules D+3/D+15 intactas (esperado: 2 linhas, is_active=true)
SELECT name, trigger_days, action_type, is_active, sort_order
FROM public.billing_rules
WHERE name IN ('Lembrete 3 dias em atraso', 'Aviso 15 dias em atraso')
ORDER BY trigger_days;

-- 8) Teste manual da reconciliacao (read-only seguro)
--    Esperado: (0, 0) se nada a abrir/fechar, ou (N, 0) na primeira vez
SELECT * FROM reconcile_inadimplencia_warnings();

-- 9) Sincronia pos-reconcile (esperado: linhas iguais)
SELECT
  (SELECT COUNT(*) FROM client_financial_summary
     WHERE contract_status_calculated = 'inadimplente'
       AND client_id IS NOT NULL) AS view_inadimplentes,
  (SELECT COUNT(*) FROM client_inadimplencia_warnings
     WHERE exited_at IS NULL) AS tabela_abertos;
