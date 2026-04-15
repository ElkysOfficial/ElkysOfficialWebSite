-- PROBLEMA 11 — audit_logs.entity_type aceita singular E plural para
-- a mesma entidade. Causa duplicacao semantica que mascara queries de
-- auditoria. Esta migration:
--   1) Normaliza linhas existentes do singular para o plural canonico.
--   2) Reescreve o CHECK aceitando apenas nomes de tabela (plural).
--   3) Documenta a regra no schema.

BEGIN;

-- 1) Normalizar valores singular para plural canonico.
--    Cada UPDATE so toca linhas que precisam de mudanca.
UPDATE public.audit_logs SET entity_type = 'projects'              WHERE entity_type = 'project';
UPDATE public.audit_logs SET entity_type = 'proposals'             WHERE entity_type = 'proposal';
UPDATE public.audit_logs SET entity_type = 'charges'               WHERE entity_type = 'charge';
UPDATE public.audit_logs SET entity_type = 'project_contracts'     WHERE entity_type = 'contract';
UPDATE public.audit_logs SET entity_type = 'project_installments'  WHERE entity_type = 'installment';
UPDATE public.audit_logs SET entity_type = 'project_subscriptions' WHERE entity_type = 'subscription';
UPDATE public.audit_logs SET entity_type = 'clients'               WHERE entity_type = 'client';
UPDATE public.audit_logs SET entity_type = 'leads'                 WHERE entity_type = 'lead';
UPDATE public.audit_logs SET entity_type = 'support_tickets'       WHERE entity_type = 'ticket';
UPDATE public.audit_logs SET entity_type = 'documents'             WHERE entity_type = 'document';
UPDATE public.audit_logs SET entity_type = 'notifications'         WHERE entity_type = 'notification';
UPDATE public.audit_logs SET entity_type = 'team_members'          WHERE entity_type = 'team_member';

-- 2) Reescrever CHECK aceitando apenas plural (= nome de tabela).
--    Inclui tabelas adicionadas em problemas posteriores
--    (project_validation_rounds, project_contract_versions, etc).
ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_entity_type_check;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_entity_type_check
  CHECK (entity_type = ANY (ARRAY[
    'projects'::text,
    'proposals'::text,
    'charges'::text,
    'project_contracts'::text,
    'project_installments'::text,
    'project_subscriptions'::text,
    'project_validation_rounds'::text,
    'project_next_steps'::text,
    'project_contract_versions'::text,
    'clients'::text,
    'leads'::text,
    'support_tickets'::text,
    'documents'::text,
    'notifications'::text,
    'team_members'::text,
    'team_tasks'::text,
    'expenses'::text,
    'billing_rules'::text,
    'billing_templates'::text,
    'financial_goals'::text
  ]));

COMMENT ON COLUMN public.audit_logs.entity_type IS
  'Nome da tabela (plural canonico) que originou o log de auditoria. Convencao: SEMPRE igual ao nome da tabela em public.* — nunca singular. Aceita apenas valores definidos no CHECK constraint. Tabelas adicionadas ao sistema devem estender esse CHECK.';

COMMIT;
