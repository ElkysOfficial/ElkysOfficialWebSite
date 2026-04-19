-- E2E Cleanup — Etapa 1/5: netos (versions, ticket_messages, charges)
-- Apaga registros vinculados a clients/leads/projects/contracts E2E.
-- Idempotente: re-rodar em DB limpo não faz nada.

BEGIN;

WITH e2e_clients AS (
  SELECT id FROM clients WHERE email ILIKE '%@teste-elkys.com'
), e2e_projects AS (
  SELECT id FROM projects WHERE client_id IN (SELECT id FROM e2e_clients)
), e2e_contracts AS (
  SELECT id FROM project_contracts
  WHERE client_id IN (SELECT id FROM e2e_clients)
     OR project_id IN (SELECT id FROM e2e_projects)
), e2e_tickets AS (
  SELECT id FROM support_tickets WHERE project_id IN (SELECT id FROM e2e_projects)
),
del_versions AS (
  DELETE FROM project_contract_versions
  WHERE contract_id IN (SELECT id FROM e2e_contracts)
  RETURNING 1
),
del_ticket_msgs AS (
  DELETE FROM ticket_messages
  WHERE ticket_id IN (SELECT id FROM e2e_tickets)
  RETURNING 1
),
del_charges AS (
  DELETE FROM charges
  WHERE client_id   IN (SELECT id FROM e2e_clients)
     OR project_id  IN (SELECT id FROM e2e_projects)
     OR contract_id IN (SELECT id FROM e2e_contracts)
  RETURNING 1
)
SELECT
  (SELECT count(*) FROM del_versions)    AS versions_removed,
  (SELECT count(*) FROM del_ticket_msgs) AS ticket_messages_removed,
  (SELECT count(*) FROM del_charges)     AS charges_removed;

COMMIT;
