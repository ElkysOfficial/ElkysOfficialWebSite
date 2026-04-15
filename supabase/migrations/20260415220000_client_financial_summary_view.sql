-- R5 / P-006 — substituir snapshots em clients por view calculada.
--
-- Antes: clients.monthly_value e clients.project_total_value eram colunas
-- snapshot atualizadas por ProjectCreate via fire-and-forget. Sem trigger
-- de sync — qualquer edicao de subscription/contract divergia
-- silenciosamente. O Overview e o card de cliente mostravam valores
-- desatualizados.
--
-- Solucao: view client_financial_summary que CALCULA em tempo real:
--   - monthly_value: SUM(amount) das subscriptions ativas/agendadas do cliente
--   - project_total_value: SUM(total_amount) dos project_contracts NAO
--     cancelados do cliente
--   - active_subscriptions: contagem
--   - active_contracts: contagem
--
-- As colunas legadas (clients.monthly_value, clients.project_total_value)
-- ficam por enquanto, ja que sao escritas por ProjectCreate. Em release
-- futura podem ser dropadas. Por ora, a UI deve ler da view; os snapshots
-- viram fallback histórico.

CREATE OR REPLACE VIEW public.client_financial_summary AS
SELECT
  c.id AS client_id,
  COALESCE(
    (
      SELECT SUM(s.amount)
      FROM public.project_subscriptions s
      WHERE s.client_id = c.id
        AND s.status IN ('ativa', 'agendada')
    ),
    0
  )::numeric(12, 2) AS monthly_value,
  COALESCE(
    (
      SELECT SUM(pc.total_amount)
      FROM public.project_contracts pc
      WHERE pc.client_id = c.id
        AND pc.status <> 'cancelado'
    ),
    0
  )::numeric(12, 2) AS project_total_value,
  COALESCE(
    (
      SELECT COUNT(*)
      FROM public.project_subscriptions s
      WHERE s.client_id = c.id
        AND s.status IN ('ativa', 'agendada')
    ),
    0
  )::int AS active_subscriptions,
  COALESCE(
    (
      SELECT COUNT(*)
      FROM public.project_contracts pc
      WHERE pc.client_id = c.id
        AND pc.status <> 'cancelado'
    ),
    0
  )::int AS active_contracts
FROM public.clients c;

COMMENT ON VIEW public.client_financial_summary IS
  'Resumo financeiro por cliente CALCULADO em tempo real a partir de project_subscriptions e project_contracts. Substitui os snapshots clients.monthly_value/project_total_value que tinham drift. Consumir esta view em qualquer card "ticket por cliente" ou "valor recorrente".';
