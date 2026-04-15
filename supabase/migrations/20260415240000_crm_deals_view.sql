-- R7 / P-011 — entidade "deal" / oportunidade comercial primeira-classe.
--
-- Antes: nao existia tabela `deals` ou `crm_opportunities`. O Pipeline.tsx
-- improvisava a cada renderizacao cruzando leads + projetos em negociacao
-- + propostas enviadas, deduzindo o estagio. Sem ID estavel de
-- "oportunidade", sem rastreio cronologico do estagio, dificil calcular
-- conversao/win-rate.
--
-- Decisao incremental (nao-quebra): em vez de criar uma TABELA nova com
-- triggers de sync (overhead alto, risco de divergencia), criar uma
-- VIEW `crm_deals_view` que materializa em tempo real a oportunidade
-- a partir de:
--   - leads (deal de origem comercial)
--   - proposals (deal com proposta enviada/aprovada)
--   - projects em status negociacao (deal pos-aprovacao)
--
-- Cada deal carrega:
--   - id estavel: prefixo + UUID da fonte (lead-..., proposal-..., project-...)
--   - source_kind: 'lead' | 'proposal' | 'project'
--   - source_id, client_id, lead_id, proposal_id, project_id (quando aplicavel)
--   - title, expected_value, stage, owner_id, last_activity_at
--
-- Pipeline.tsx pode adotar essa view incrementalmente (proxima release)
-- substituindo o cruzamento client-side. Por agora, a view ja existe
-- como contrato estavel para qualquer consumidor.

CREATE OR REPLACE VIEW public.crm_deals_view AS
-- 1) Deals nascidos de leads (sem proposta ainda)
SELECT
  ('lead-' || l.id::text)             AS deal_id,
  'lead'::text                         AS source_kind,
  l.id                                 AS source_id,
  NULL::uuid                           AS client_id,
  l.id                                 AS lead_id,
  NULL::uuid                           AS proposal_id,
  NULL::uuid                           AS project_id,
  l.name                               AS title,
  COALESCE(l.estimated_value, 0)::numeric(12, 2) AS expected_value,
  l.status::text                       AS stage,
  l.assigned_to                        AS owner_id,
  COALESCE(l.updated_at, l.created_at) AS last_activity_at,
  l.created_at                         AS created_at
FROM public.leads l
WHERE l.status NOT IN ('ganho', 'perdido')
  AND NOT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.lead_id = l.id
      AND p.status NOT IN ('rejeitada', 'expirada')
  )

UNION ALL

-- 2) Deals com proposta ativa (enviada / aprovada nao virada ainda em projeto)
SELECT
  ('proposal-' || p.id::text)          AS deal_id,
  'proposal'::text                     AS source_kind,
  p.id                                 AS source_id,
  p.client_id                          AS client_id,
  p.lead_id                            AS lead_id,
  p.id                                 AS proposal_id,
  NULL::uuid                           AS project_id,
  p.title                              AS title,
  COALESCE(p.total_amount, 0)::numeric(12, 2) AS expected_value,
  p.status::text                       AS stage,
  p.created_by                         AS owner_id,
  COALESCE(p.updated_at, p.sent_at, p.created_at) AS last_activity_at,
  p.created_at                         AS created_at
FROM public.proposals p
WHERE p.status IN ('enviada', 'aprovada')
  AND NOT EXISTS (
    SELECT 1 FROM public.projects pr
    WHERE pr.proposal_id = p.id
  )

UNION ALL

-- 3) Deals que viraram projeto mas ainda em negociacao
SELECT
  ('project-' || pr.id::text)          AS deal_id,
  'project'::text                      AS source_kind,
  pr.id                                AS source_id,
  pr.client_id                         AS client_id,
  NULL::uuid                           AS lead_id,
  pr.proposal_id                       AS proposal_id,
  pr.id                                AS project_id,
  pr.name                              AS title,
  COALESCE(
    (SELECT total_amount FROM public.project_contracts WHERE project_id = pr.id ORDER BY created_at DESC LIMIT 1),
    0
  )::numeric(12, 2)                    AS expected_value,
  pr.status::text                      AS stage,
  NULL::uuid                           AS owner_id,
  COALESCE(pr.updated_at, pr.created_at) AS last_activity_at,
  pr.created_at                        AS created_at
FROM public.projects pr
WHERE pr.status = 'negociacao';

COMMENT ON VIEW public.crm_deals_view IS
  'Visao unificada de oportunidades comerciais (deals) materializada a partir de leads + proposals + projects em negociacao. Pipeline.tsx pode consumir esta view em vez de cruzar tabelas client-side. Cada deal tem deal_id estavel (prefixo + UUID da fonte), source_kind para roteamento, e expected_value para somatorios de pipeline.';
