-- PROBLEMA 10 — extender client_financial_summary com 6 campos
-- contratuais que hoje vivem como snapshot drifted em clients.

CREATE OR REPLACE VIEW public.client_financial_summary AS
SELECT
  c.id AS client_id,

  -- P-006 (existentes)
  COALESCE(
    (SELECT SUM(s.amount)
       FROM public.project_subscriptions s
      WHERE s.client_id = c.id
        AND s.status IN ('ativa', 'agendada')),
    0
  )::numeric(12, 2) AS monthly_value,

  COALESCE(
    (SELECT SUM(pc.total_amount)
       FROM public.project_contracts pc
      WHERE pc.client_id = c.id
        AND pc.status <> 'cancelado'),
    0
  )::numeric(12, 2) AS project_total_value,

  COALESCE(
    (SELECT COUNT(*)
       FROM public.project_subscriptions s
      WHERE s.client_id = c.id
        AND s.status IN ('ativa', 'agendada')),
    0
  )::int AS active_subscriptions,

  COALESCE(
    (SELECT COUNT(*)
       FROM public.project_contracts pc
      WHERE pc.client_id = c.id
        AND pc.status <> 'cancelado'),
    0
  )::int AS active_contracts,

  -- P10: contract_status agregado.
  -- Inadimplente tem prioridade sobre ativo (sinal mais forte).
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.charges ch
       WHERE ch.client_id = c.id
         AND ch.status = 'atrasado'
         AND ch.is_historical = false
    ) THEN 'inadimplente'::contract_status
    WHEN EXISTS (
      SELECT 1 FROM public.project_contracts pc
       WHERE pc.client_id = c.id
         AND pc.status = 'ativo'
    ) THEN 'ativo'::contract_status
    WHEN EXISTS (
      SELECT 1 FROM public.project_contracts pc
       WHERE pc.client_id = c.id
         AND pc.status = 'encerrado'
    ) THEN 'cancelado'::contract_status
    ELSE 'ativo'::contract_status
  END AS contract_status_calculated,

  -- P10: contract_start = inicio mais antigo nao cancelado.
  (SELECT MIN(pc.starts_at)
     FROM public.project_contracts pc
    WHERE pc.client_id = c.id
      AND pc.status <> 'cancelado') AS contract_start_calculated,

  -- P10: contract_end = NULL se algum contrato indefinido, senao MAX.
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.project_contracts pc
       WHERE pc.client_id = c.id
         AND pc.status <> 'cancelado'
         AND pc.ends_at IS NULL
    ) THEN NULL
    ELSE (SELECT MAX(pc.ends_at)
            FROM public.project_contracts pc
           WHERE pc.client_id = c.id
             AND pc.status <> 'cancelado')
  END AS contract_end_calculated,

  -- P10: payment_due_day da subscription ativa mais recente.
  (SELECT s.due_day
     FROM public.project_subscriptions s
    WHERE s.client_id = c.id
      AND s.status IN ('ativa', 'agendada')
    ORDER BY s.created_at DESC
    LIMIT 1) AS payment_due_day_calculated,

  -- P10: contract_type derivado de subs + contracts.
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.project_subscriptions s
       WHERE s.client_id = c.id
         AND s.status IN ('ativa', 'agendada')
    )
     AND EXISTS (
      SELECT 1 FROM public.project_contracts pc
       WHERE pc.client_id = c.id
         AND pc.status <> 'cancelado'
         AND EXISTS (
           SELECT 1 FROM public.project_installments i
            WHERE i.contract_id = pc.id
         )
    ) THEN 'hibrido'::contract_type
    WHEN EXISTS (
      SELECT 1 FROM public.project_subscriptions s
       WHERE s.client_id = c.id
         AND s.status IN ('ativa', 'agendada')
    ) THEN 'recorrente'::contract_type
    WHEN EXISTS (
      SELECT 1 FROM public.project_contracts pc
       WHERE pc.client_id = c.id
         AND pc.status <> 'cancelado'
    ) THEN 'projeto'::contract_type
    ELSE NULL
  END AS contract_type_calculated,

  -- P10: scope_summary do contrato vigente mais recente.
  (SELECT pc.scope_summary
     FROM public.project_contracts pc
    WHERE pc.client_id = c.id
      AND pc.status <> 'cancelado'
    ORDER BY pc.created_at DESC
    LIMIT 1) AS scope_summary_calculated

FROM public.clients c;

COMMENT ON VIEW public.client_financial_summary IS
  'Resumo financeiro + contratual por cliente CALCULADO em tempo real a partir de project_subscriptions, project_contracts e charges. Substitui os snapshots clients.monthly_value, project_total_value, contract_status, contract_type, contract_start, contract_end, scope_summary, payment_due_day que tinham drift. Consumir esta view nos cards de cliente — colunas snapshot em clients ficam por compat ate todos os consumidores migrarem.';
