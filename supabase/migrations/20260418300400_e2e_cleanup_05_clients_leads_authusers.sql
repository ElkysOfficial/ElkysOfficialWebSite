-- E2E Cleanup — Etapa 5/5: pais (clients, leads) + auth.users

BEGIN;

WITH
del_auth AS (
  DELETE FROM auth.users
  WHERE id IN (
    SELECT user_id FROM clients
    WHERE email ILIKE '%@teste-elkys.com' AND user_id IS NOT NULL
  )
  RETURNING 1
),
del_clients AS (
  DELETE FROM clients
  WHERE email ILIKE '%@teste-elkys.com'
  RETURNING 1
),
del_leads AS (
  DELETE FROM leads
  WHERE email ILIKE 'e2e-%@teste-elkys.com'
  RETURNING 1
)
SELECT
  (SELECT count(*) FROM del_auth)    AS auth_users_removed,
  (SELECT count(*) FROM del_clients) AS clients_removed,
  (SELECT count(*) FROM del_leads)   AS leads_removed;

COMMIT;
