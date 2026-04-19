-- E2E Cleanup — Etapa 4/5: contracts, projects, lead_interactions, proposals, admin_notifications

BEGIN;

WITH e2e_clients AS (
  SELECT id FROM clients WHERE email ILIKE '%@teste-elkys.com'
), e2e_leads AS (
  SELECT id FROM leads WHERE email ILIKE 'e2e-%@teste-elkys.com'
), e2e_projects AS (
  SELECT id FROM projects WHERE client_id IN (SELECT id FROM e2e_clients)
), e2e_contracts AS (
  SELECT id FROM project_contracts
  WHERE client_id IN (SELECT id FROM e2e_clients)
     OR project_id IN (SELECT id FROM e2e_projects)
),
del_contracts AS (
  DELETE FROM project_contracts
  WHERE id IN (SELECT id FROM e2e_contracts)
  RETURNING 1
),
del_projects AS (
  DELETE FROM projects
  WHERE id IN (SELECT id FROM e2e_projects)
  RETURNING 1
),
del_lead_inter AS (
  DELETE FROM lead_interactions
  WHERE lead_id IN (SELECT id FROM e2e_leads)
  RETURNING 1
),
del_proposals AS (
  DELETE FROM proposals
  WHERE client_id IN (SELECT id FROM e2e_clients)
     OR lead_id   IN (SELECT id FROM e2e_leads)
  RETURNING 1
),
del_notif AS (
  DELETE FROM admin_notifications
  WHERE body  ILIKE '%teste-elkys.com%'
     OR body  ILIKE '%E2E_TEST_%'
     OR title ILIKE '%E2E%'
     OR title ILIKE '%Cliente Teste%'
  RETURNING 1
)
SELECT
  (SELECT count(*) FROM del_contracts)  AS contracts_removed,
  (SELECT count(*) FROM del_projects)   AS projects_removed,
  (SELECT count(*) FROM del_lead_inter) AS lead_interactions_removed,
  (SELECT count(*) FROM del_proposals)  AS proposals_removed,
  (SELECT count(*) FROM del_notif)      AS notifications_removed;

COMMIT;
