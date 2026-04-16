-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Limpeza dos dados gerados pelos testes E2E
-- Remove todos os registros com marcador "E2E_TEST_" no nome/título.
-- Respeita a ordem de dependência (FKs) para evitar violações.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Ticket messages (FK → support_tickets)
DELETE FROM public.ticket_messages
WHERE ticket_id IN (
  SELECT id FROM public.support_tickets
  WHERE subject LIKE '%E2E\_TEST\_%' ESCAPE '\'
);

-- 2. Support tickets (FK → projects, clients)
DELETE FROM public.support_tickets
WHERE subject LIKE '%E2E\_TEST\_%' ESCAPE '\'
   OR project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 3. Timeline events (FK → projects, clients)
DELETE FROM public.timeline_events
WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\'
   OR summary LIKE '%E2E\_TEST\_%' ESCAPE '\'
   OR project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 4. Admin notifications
DELETE FROM public.admin_notifications
WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\'
   OR body LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 5. Audit logs
DELETE FROM public.audit_logs
WHERE entity_id IN (
  SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\'
  UNION
  SELECT id FROM public.proposals WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\'
  UNION
  SELECT id FROM public.leads WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\'
);

-- 6. Billing actions log (FK → charges)
DELETE FROM public.billing_actions_log
WHERE charge_id IN (
  SELECT c.id FROM public.charges c
  JOIN public.projects p ON c.project_id = p.id
  WHERE p.name LIKE '%E2E\_TEST\_%' ESCAPE '\'
);

-- 7. Project next steps (FK → projects)
DELETE FROM public.project_next_steps
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 8. Team tasks (FK → projects)
DELETE FROM public.team_tasks
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR title LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 9. Project validation rounds (FK → projects)
DELETE FROM public.project_validation_rounds
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 10. Charges (FK → project_installments, project_subscriptions, contracts, projects)
DELETE FROM public.charges
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR description LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 11. Project installments (FK → contracts, projects)
DELETE FROM public.project_installments
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 12. Project subscriptions (FK → projects)
DELETE FROM public.project_subscriptions
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 13. Documents (FK → projects, contracts)
DELETE FROM public.documents
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 14. Project contract versions (FK → contracts)
DELETE FROM public.project_contract_versions
WHERE contract_id IN (
  SELECT pc.id FROM public.project_contracts pc
  LEFT JOIN public.projects p ON pc.project_id = p.id
  WHERE p.name LIKE '%E2E\_TEST\_%' ESCAPE '\'
     OR pc.client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\')
);

-- 15. Project contracts (FK → projects, clients)
DELETE FROM public.project_contracts
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 16. Projects (FK → clients, proposals)
DELETE FROM public.projects
WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 17. Proposals (FK → leads, clients)
DELETE FROM public.proposals
WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 18. Lead interactions (FK → leads)
DELETE FROM public.lead_interactions
WHERE lead_id IN (SELECT id FROM public.leads WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 19. Notification recipients (FK → clients)
DELETE FROM public.notification_recipients
WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 20. Client contacts (FK → clients)
DELETE FROM public.client_contacts
WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- ═══════════════════════════════════════════════════════════════════
-- ORDEM CRÍTICA: Leads ANTES de Clients
-- O lead "ganho" tem converted_client_id FK → clients.
-- A constraint leads_conversion_consistency exige que se status=ganho,
-- converted_client_id NÃO seja NULL. Deletar leads primeiro resolve.
-- ═══════════════════════════════════════════════════════════════════

-- 21. Leads (ANTES de clients — converted_client_id FK)
DELETE FROM public.leads
WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 22. User roles for E2E test clients
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT user_id FROM public.clients
  WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\'
  AND user_id IS NOT NULL
);

-- 23. Profiles for E2E test clients
DELETE FROM public.profiles
WHERE id IN (
  SELECT user_id FROM public.clients
  WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\'
  AND user_id IS NOT NULL
);

-- 24. Clients (agora seguro — leads já foram deletados)
DELETE FROM public.clients
WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 25. Auth users criados pelo E2E (convert_lead_to_client cria auth users)
-- Busca por email pattern dos testes
DELETE FROM auth.users
WHERE email LIKE '%e2e-%@teste-elkys.com'
   OR email LIKE '%e2e\_test\_%' ESCAPE '\';

COMMIT;
