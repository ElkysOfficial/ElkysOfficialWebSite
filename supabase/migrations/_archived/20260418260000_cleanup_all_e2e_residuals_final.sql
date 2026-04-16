-- Limpeza final e minuciosa de TODOS os residuos dos testes E2E
-- Analise: tarefas, clientes, projetos, contratos, leads, propostas, cobranças, etc.

BEGIN;

-- 1. Ticket messages
DELETE FROM public.ticket_messages WHERE ticket_id IN (
  SELECT id FROM public.support_tickets WHERE subject LIKE '%E2E\_TEST\_%' ESCAPE '\'
     OR project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
);

-- 2. Support tickets
DELETE FROM public.support_tickets WHERE subject LIKE '%E2E\_TEST\_%' ESCAPE '\'
   OR project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 3. Timeline events
DELETE FROM public.timeline_events
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com');

-- 4. Admin notifications (todos os E2E)
DELETE FROM public.admin_notifications
WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\' OR body LIKE '%E2E\_TEST\_%' ESCAPE '\'
   OR title LIKE '%Kickoff%' AND created_at > '2026-04-16 00:00:00+00';

-- 5. Audit logs
DELETE FROM public.audit_logs WHERE entity_id IN (
  SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\'
  UNION SELECT id FROM public.proposals WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\'
  UNION SELECT id FROM public.leads WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\'
  UNION SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com'
);

-- 6. Team tasks (Kickoff, Verificar cobranças, Elaborar proposta, Revisar e ativar contrato)
DELETE FROM public.team_tasks
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR title LIKE '%E2E\_TEST\_%' ESCAPE '\'
   OR (title IN ('Verificar cobranças', 'Kickoff do projeto', 'Elaborar proposta') AND created_at > '2026-04-16 00:00:00+00');

-- 7. Billing actions
DELETE FROM public.billing_actions_log WHERE charge_id IN (
  SELECT c.id FROM public.charges c WHERE c.project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
     OR c.client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com')
);

-- 8. Project next steps
DELETE FROM public.project_next_steps WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 9. Validation rounds
DELETE FROM public.project_validation_rounds WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 10. Charges
DELETE FROM public.charges
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com');

-- 11. Installments
DELETE FROM public.project_installments WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 12. Subscriptions
DELETE FROM public.project_subscriptions WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 13. Documents
DELETE FROM public.documents
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com');

-- 14. Contract versions
DELETE FROM public.project_contract_versions WHERE contract_id IN (
  SELECT pc.id FROM public.project_contracts pc
  WHERE pc.project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
     OR pc.client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com')
);

-- 15. Contracts
DELETE FROM public.project_contracts
WHERE project_id IN (SELECT id FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\')
   OR client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com');

-- 16. Projects
DELETE FROM public.projects WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 17. Proposals
DELETE FROM public.proposals WHERE title LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 18. Lead interactions
DELETE FROM public.lead_interactions WHERE lead_id IN (SELECT id FROM public.leads WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\');

-- 19. Notification recipients
DELETE FROM public.notification_recipients
WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com');

-- 20. Client contacts
DELETE FROM public.client_contacts
WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com');

-- 21. Leads (ANTES de clients por FK converted_client_id)
DELETE FROM public.leads WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\';

-- 22. User roles de clientes E2E
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT user_id FROM public.clients WHERE (full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com') AND user_id IS NOT NULL
);

-- 23. Profiles de clientes E2E
DELETE FROM public.profiles WHERE id IN (
  SELECT user_id FROM public.clients WHERE (full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com') AND user_id IS NOT NULL
);

-- 24. Auth users de clientes E2E
DELETE FROM auth.users WHERE email LIKE 'e2e-%@teste-elkys.com';

-- 25. Clients E2E
DELETE FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR email LIKE 'e2e-%@teste-elkys.com';

COMMIT;
