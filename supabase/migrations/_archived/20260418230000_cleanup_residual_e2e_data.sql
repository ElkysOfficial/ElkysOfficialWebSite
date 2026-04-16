BEGIN;

-- Limpar ticket_messages de tickets E2E
DELETE FROM public.ticket_messages WHERE ticket_id IN (
  SELECT id FROM public.support_tickets WHERE subject LIKE '%E2E\_TEST\_%' ESCAPE '\'
);

-- Limpar support_tickets
DELETE FROM public.support_tickets WHERE subject LIKE '%E2E\_TEST\_%' ESCAPE '\'
   OR project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- Timeline events
DELETE FROM public.timeline_events WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- Admin notifications
DELETE FROM public.admin_notifications WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\' OR body LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- Audit logs
DELETE FROM public.audit_logs WHERE entity_id IN (
  SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\'
  UNION SELECT id FROM public.proposals WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\'
  UNION SELECT id FROM public.leads WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\'
);

-- Billing actions
DELETE FROM public.billing_actions_log WHERE charge_id IN (
  SELECT c.id FROM public.charges c JOIN public.projects p ON c.project_id = p.id WHERE p.name LIKE '%E2E\_TEST\_%' ESCAPE '\'
);

DELETE FROM public.project_next_steps WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');
DELETE FROM public.team_tasks WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\') OR title LIKE '%E2E\_TEST\_%' ESCAPE '\';
DELETE FROM public.project_validation_rounds WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');
DELETE FROM public.charges WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\') OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');
DELETE FROM public.project_installments WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');
DELETE FROM public.project_subscriptions WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');
DELETE FROM public.documents WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\') OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');
DELETE FROM public.project_contract_versions WHERE contract_id IN (
  SELECT pc.id FROM public.project_contracts pc LEFT JOIN public.projects p ON pc.project_id = p.id
  WHERE p.name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR pc.client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\')
);
DELETE FROM public.project_contracts WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\') OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');
DELETE FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\';
DELETE FROM public.proposals WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\';
DELETE FROM public.lead_interactions WHERE lead_id IN (SELECT id FROM public.leads WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');
DELETE FROM public.notification_recipients WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');
DELETE FROM public.client_contacts WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- Leads ANTES de clients
DELETE FROM public.leads WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- User roles + profiles de clients E2E
DELETE FROM public.user_roles WHERE user_id IN (SELECT user_id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' AND user_id IS NOT NULL);
DELETE FROM public.profiles WHERE id IN (SELECT user_id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' AND user_id IS NOT NULL);
DELETE FROM auth.users WHERE email LIKE 'e2e-%@teste-elkys.com';
DELETE FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- Também limpar leads genéricos "Lead Teste" (rodadas anteriores do teste)
-- Propostas vinculadas a esses leads precisam ser limpas primeiro
DELETE FROM public.proposals WHERE lead_id IN (SELECT id FROM public.leads WHERE name LIKE 'Lead Teste test-%');
DELETE FROM public.lead_interactions WHERE lead_id IN (SELECT id FROM public.leads WHERE name LIKE 'Lead Teste test-%');
DELETE FROM public.leads WHERE name LIKE 'Lead Teste test-%';

-- Propostas órfãs com título "Proposta Lead Teste"
DELETE FROM public.proposals WHERE title LIKE 'Proposta Lead Teste test-%';

COMMIT;
