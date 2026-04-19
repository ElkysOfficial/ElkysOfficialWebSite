-- E2E Cleanup — Etapa 3/5: documents, expenses, client_contacts, notification_recipients

BEGIN;

WITH e2e_clients AS (
  SELECT id FROM clients WHERE email ILIKE '%@teste-elkys.com'
), e2e_projects AS (
  SELECT id FROM projects WHERE client_id IN (SELECT id FROM e2e_clients)
), e2e_contracts AS (
  SELECT id FROM project_contracts
  WHERE client_id IN (SELECT id FROM e2e_clients)
     OR project_id IN (SELECT id FROM e2e_projects)
),
del_docs AS (
  DELETE FROM documents
  WHERE client_id   IN (SELECT id FROM e2e_clients)
     OR project_id  IN (SELECT id FROM e2e_projects)
     OR contract_id IN (SELECT id FROM e2e_contracts)
  RETURNING 1
),
del_expenses AS (
  DELETE FROM expenses
  WHERE client_id IN (SELECT id FROM e2e_clients)
  RETURNING 1
),
del_contacts AS (
  DELETE FROM client_contacts
  WHERE client_id IN (SELECT id FROM e2e_clients)
  RETURNING 1
),
del_notif_rec AS (
  DELETE FROM notification_recipients
  WHERE client_id IN (SELECT id FROM e2e_clients)
  RETURNING 1
)
SELECT
  (SELECT count(*) FROM del_docs)      AS documents_removed,
  (SELECT count(*) FROM del_expenses)  AS expenses_removed,
  (SELECT count(*) FROM del_contacts)  AS contacts_removed,
  (SELECT count(*) FROM del_notif_rec) AS notif_recipients_removed;

COMMIT;
