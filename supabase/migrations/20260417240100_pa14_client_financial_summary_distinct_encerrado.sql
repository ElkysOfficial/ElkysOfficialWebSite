-- PA14 — recria client_financial_summary preservando a semantica
-- 'encerrado' != 'cancelado'. Todas as demais colunas inalteradas.
--
-- Prioridade de status (mais forte -> mais fraco):
--   1) inadimplente  (existe charge atrasado)
--   2) ativo         (existe contrato ativo)
--   3) encerrado     (todos os contratos estao encerrados — natural)
--   4) cancelado     (todos os contratos estao cancelados — forcado)
--   5) ativo         (fallback default)
--
-- A diferenca da versao anterior e que encerrado NAO vira cancelado —
-- vira 'encerrado' mesmo.

CREATE OR REPLACE VIEW public.client_financial_summary AS
SELECT
  c.id AS client_id,

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

  -- PA14: encerrado preservado distinto de cancelado.
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
    ) THEN 'encerrado'::contract_status
    WHEN EXISTS (
      SELECT 1 FROM public.project_contracts pc
       WHERE pc.client_id = c.id
         AND pc.status = 'cancelado'
    ) THEN 'cancelado'::contract_status
    ELSE 'ativo'::contract_status
  END AS contract_status_calculated,

  (SELECT MIN(pc.starts_at)
     FROM public.project_contracts pc
    WHERE pc.client_id = c.id
      AND pc.status <> 'cancelado') AS contract_start_calculated,

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

  (SELECT s.due_day
     FROM public.project_subscriptions s
    WHERE s.client_id = c.id
      AND s.status IN ('ativa', 'agendada')
    ORDER BY s.created_at DESC
    LIMIT 1) AS payment_due_day_calculated,

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

  (SELECT pc.scope_summary
     FROM public.project_contracts pc
    WHERE pc.client_id = c.id
      AND pc.status <> 'cancelado'
    ORDER BY pc.created_at DESC
    LIMIT 1) AS scope_summary_calculated

FROM public.clients c;

COMMENT ON VIEW public.client_financial_summary IS
  'PA14: resumo financeiro + contratual por cliente com distincao preservada entre encerrado (natural) e cancelado (forcado). Calculado em tempo real a partir de project_subscriptions, project_contracts e charges.';
