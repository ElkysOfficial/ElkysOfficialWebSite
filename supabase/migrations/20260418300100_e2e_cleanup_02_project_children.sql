-- E2E Cleanup — Etapa 2/5: filhos diretos de projects e clients
-- (timeline, installments, subscriptions, next_steps, validations, tasks, marketing, tickets)

BEGIN;

WITH e2e_clients AS (
  SELECT id FROM clients WHERE email ILIKE '%@teste-elkys.com'
), e2e_projects AS (
  SELECT id FROM projects WHERE client_id IN (SELECT id FROM e2e_clients)
),
del_timeline AS (
  DELETE FROM timeline_events
  WHERE project_id IN (SELECT id FROM e2e_projects)
  RETURNING 1
),
del_installments AS (
  DELETE FROM project_installments
  WHERE project_id IN (SELECT id FROM e2e_projects)
     OR client_id  IN (SELECT id FROM e2e_clients)
  RETURNING 1
),
del_subs AS (
  DELETE FROM project_subscriptions
  WHERE project_id IN (SELECT id FROM e2e_projects)
     OR client_id  IN (SELECT id FROM e2e_clients)
  RETURNING 1
),
del_next_steps AS (
  DELETE FROM project_next_steps
  WHERE project_id IN (SELECT id FROM e2e_projects)
     OR client_id  IN (SELECT id FROM e2e_clients)
  RETURNING 1
),
del_validations AS (
  DELETE FROM project_validation_rounds
  WHERE client_id IN (SELECT id FROM e2e_clients)
  RETURNING 1
),
del_tasks AS (
  DELETE FROM team_tasks
  WHERE project_id IN (SELECT id FROM e2e_projects)
  RETURNING 1
),
del_mkt AS (
  DELETE FROM marketing_calendar_events
  WHERE project_id IN (SELECT id FROM e2e_projects)
     OR client_id  IN (SELECT id FROM e2e_clients)
  RETURNING 1
),
del_tickets AS (
  DELETE FROM support_tickets
  WHERE project_id IN (SELECT id FROM e2e_projects)
  RETURNING 1
)
SELECT
  (SELECT count(*) FROM del_timeline)    AS timeline_removed,
  (SELECT count(*) FROM del_installments) AS installments_removed,
  (SELECT count(*) FROM del_subs)         AS subscriptions_removed,
  (SELECT count(*) FROM del_next_steps)   AS next_steps_removed,
  (SELECT count(*) FROM del_validations)  AS validations_removed,
  (SELECT count(*) FROM del_tasks)        AS tasks_removed,
  (SELECT count(*) FROM del_mkt)          AS mkt_events_removed,
  (SELECT count(*) FROM del_tickets)      AS tickets_removed;

COMMIT;
