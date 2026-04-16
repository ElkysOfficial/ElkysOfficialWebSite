-- Limpeza de resíduos adicionais dos testes E2E
BEGIN;

-- Tarefas "Elaborar proposta" e "Revisar e ativar contrato" criadas automaticamente pelos testes
DELETE FROM public.team_tasks
WHERE title LIKE 'Elaborar proposta%'
  AND created_at > '2026-04-16 00:00:00+00'
  AND (
    client_id IN (SELECT id FROM public.clients WHERE full_name LIKE '%E2E\_TEST\_%' ESCAPE '\' OR full_name LIKE '%Lead Teste%')
    OR title LIKE '%E2E\_TEST\_%'
  );

DELETE FROM public.team_tasks
WHERE title IN ('Verificar cobranças', 'Kickoff do projeto')
  AND created_at > '2026-04-16 00:00:00+00';

-- Cliente "Lead Teste Teste" e similares (convertidos de leads de teste)
-- Primeiro limpar FKs

-- Timeline events
DELETE FROM public.timeline_events
WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE 'Lead Teste%' OR full_name LIKE '%test-%');

-- Notification recipients
DELETE FROM public.notification_recipients
WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE 'Lead Teste%' OR full_name LIKE '%test-%');

-- Client contacts
DELETE FROM public.client_contacts
WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE 'Lead Teste%' OR full_name LIKE '%test-%');

-- Charges
DELETE FROM public.charges
WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE 'Lead Teste%' OR full_name LIKE '%test-%');

-- Project contracts
DELETE FROM public.project_contract_versions
WHERE contract_id IN (
  SELECT id FROM public.project_contracts WHERE client_id IN (
    SELECT id FROM public.clients WHERE full_name LIKE 'Lead Teste%' OR full_name LIKE '%test-%'
  )
);
DELETE FROM public.project_contracts
WHERE client_id IN (SELECT id FROM public.clients WHERE full_name LIKE 'Lead Teste%' OR full_name LIKE '%test-%');

-- User roles + profiles
DELETE FROM public.user_roles
WHERE user_id IN (SELECT user_id FROM public.clients WHERE (full_name LIKE 'Lead Teste%' OR full_name LIKE '%test-%') AND user_id IS NOT NULL);

DELETE FROM public.profiles
WHERE id IN (SELECT user_id FROM public.clients WHERE (full_name LIKE 'Lead Teste%' OR full_name LIKE '%test-%') AND user_id IS NOT NULL);

-- Auth users
DELETE FROM auth.users
WHERE email LIKE 'teste-%@exemplo.com';

-- Clientes
DELETE FROM public.clients
WHERE full_name LIKE 'Lead Teste%' OR full_name LIKE '%test-%';

COMMIT;
