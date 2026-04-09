-- Add 'team_tasks' to the audit_logs entity_type check constraint
ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_entity_type_check;

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_entity_type_check
  CHECK (entity_type = ANY (ARRAY[
    'project','projects',
    'proposal','proposals',
    'charge','charges',
    'contract','project_contracts',
    'installment','project_installments',
    'subscription','project_subscriptions',
    'client','clients',
    'lead','leads',
    'ticket','support_tickets',
    'document','documents',
    'notification','notifications',
    'team_member','team_members',
    'expenses','billing_rules','billing_templates',
    'team_tasks'
  ]));
