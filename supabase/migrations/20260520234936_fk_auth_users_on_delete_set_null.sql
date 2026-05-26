-- 20260520234936_fk_auth_users_on_delete_set_null.sql
--
-- Corrige 6 foreign keys para auth.users(id) que estavam sem clausula
-- ON DELETE explicita. No Postgres, ausencia de ON DELETE = NO ACTION
-- (equivalente a RESTRICT). Isso impede a remocao de um auth.users
-- quando ha QUALQUER linha referenciando o id, gerando "Database error
-- deleting user" no Supabase Auth Admin API e bloqueando o fluxo de
-- delete-user (TeamCreate rollback, Team delete, ClientCreate rollback).
--
-- Comportamento desejado: deletar um auth.users limpa a referencia
-- (SET NULL) nas tabelas que armazenam apenas autoria/atribuicao
-- historica. Nenhuma das tabelas afetadas perde semantica de dominio
-- ao perder o autor — o registro de leads, proposals, notifications,
-- financial_goals e lead_interactions continua util mesmo se a
-- pessoa que criou saiu da empresa.
--
-- FKs corrigidas (todas trocam NO ACTION/RESTRICT por SET NULL):
--   notifications.created_by
--   notification_recipients.user_id (ja era SET NULL — verificada)
--   financial_goals.created_by
--   leads.assigned_to
--   leads.created_by
--   lead_interactions.created_by
--   proposals.created_by

begin;

-- notifications.created_by
alter table public.notifications
  drop constraint if exists notifications_created_by_fkey;
alter table public.notifications
  add constraint notifications_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- financial_goals.created_by
alter table public.financial_goals
  drop constraint if exists financial_goals_created_by_fkey;
alter table public.financial_goals
  add constraint financial_goals_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- leads.assigned_to
alter table public.leads
  drop constraint if exists leads_assigned_to_fkey;
alter table public.leads
  add constraint leads_assigned_to_fkey
  foreign key (assigned_to) references auth.users(id) on delete set null;

-- leads.created_by
alter table public.leads
  drop constraint if exists leads_created_by_fkey;
alter table public.leads
  add constraint leads_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- lead_interactions.created_by
alter table public.lead_interactions
  drop constraint if exists lead_interactions_created_by_fkey;
alter table public.lead_interactions
  add constraint lead_interactions_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- proposals.created_by
alter table public.proposals
  drop constraint if exists proposals_created_by_fkey;
alter table public.proposals
  add constraint proposals_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

commit;
