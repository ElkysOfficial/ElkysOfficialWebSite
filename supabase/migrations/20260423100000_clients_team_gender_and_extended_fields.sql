-- ─────────────────────────────────────────────────────────────────────────
-- Gender + campos estendidos em clients e team_members (Ondas 1 + 2)
--
-- Motivação:
--   Onda 1: e-mails formais com tratamento Sr./Sra. exigem gênero.
--   Onda 2: completar modelagem de cliente (RG, data nascimento, financeiro
--           detalhado, CRM) e membro (CPF, senioridade, hierarquia).
--
-- Tudo NULLABLE — nenhum registro existente quebra. Defaults só onde faz
-- sentido semântico (aceite_termos = false).
-- ─────────────────────────────────────────────────────────────────────────

-- ── ENUM de gênero ───────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'gender_type') then
    create type public.gender_type as enum ('masculino', 'feminino');
  end if;
end$$;

comment on type public.gender_type is
  'Tratamento formal em comunicações (Sr./Sra.). NULL cai em Prezado(a).';

-- ── ENUM regime tributário ───────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'regime_tributario_type') then
    create type public.regime_tributario_type as enum (
      'mei', 'simples', 'lucro_presumido', 'lucro_real'
    );
  end if;
end$$;

-- ── ENUM forma de pagamento ──────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'forma_pagamento_type') then
    create type public.forma_pagamento_type as enum (
      'pix', 'boleto', 'cartao', 'transferencia', 'dinheiro'
    );
  end if;
end$$;

-- ── ENUM canal de assinatura ─────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'canal_assinatura_type') then
    create type public.canal_assinatura_type as enum (
      'manual', 'govbr', 'clicksign', 'docusign', 'eletronico'
    );
  end if;
end$$;

-- ── ENUM senioridade ─────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'senioridade_type') then
    create type public.senioridade_type as enum (
      'estagiario', 'junior', 'pleno', 'senior', 'lead', 'gerente'
    );
  end if;
end$$;

-- ── CLIENTS: adiciona colunas (tudo nullable) ────────────────────────────
alter table public.clients
  -- Tratamento formal (Onda 1)
  add column if not exists gender public.gender_type,

  -- Identificação PF adicional (Onda 2)
  add column if not exists rg text,
  add column if not exists birth_date date,

  -- Identificação PJ adicional (Onda 2)
  add column if not exists inscricao_estadual text,
  add column if not exists inscricao_municipal text,
  add column if not exists cnae text,
  add column if not exists regime_tributario public.regime_tributario_type,

  -- Contato estendido (Onda 2)
  add column if not exists whatsapp text,
  add column if not exists contato_secundario text,

  -- Financeiro (Onda 2)
  add column if not exists email_financeiro text,
  add column if not exists responsavel_financeiro text,
  add column if not exists responsavel_financeiro_phone text,
  add column if not exists forma_pagamento public.forma_pagamento_type,
  add column if not exists limite_credito numeric(12, 2),

  -- Jurídico / contratual (Onda 2)
  add column if not exists aceite_termos boolean not null default false,
  add column if not exists aceite_termos_at timestamptz,
  add column if not exists canal_assinatura public.canal_assinatura_type,
  add column if not exists sla_hours integer,

  -- CRM interno (Onda 2)
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists notes_internal text;

comment on column public.clients.gender is
  'Tratamento formal em e-mails. NULL → fallback "Prezado(a)".';
comment on column public.clients.birth_date is
  'Data de nascimento (PF).';
comment on column public.clients.rg is
  'RG do representante (PF ou representante PJ).';
comment on column public.clients.cnae is
  'Código CNAE principal (PJ). Útil para segmentação.';
comment on column public.clients.regime_tributario is
  'Regime tributário (PJ). Relevante para emissão fiscal.';
comment on column public.clients.whatsapp is
  'WhatsApp para contato (dígitos apenas, com DDI/DDD).';
comment on column public.clients.email_financeiro is
  'E-mail dedicado para cobranças e boletos. Usado em send-invoice-due/charge-overdue quando preenchido.';
comment on column public.clients.responsavel_financeiro is
  'Nome do responsável financeiro quando distinto do contato principal.';
comment on column public.clients.forma_pagamento is
  'Forma de pagamento preferencial do cliente.';
comment on column public.clients.limite_credito is
  'Limite de crédito acordado (opcional).';
comment on column public.clients.aceite_termos is
  'Aceite de termos de uso/serviço. Persistido com timestamp em aceite_termos_at.';
comment on column public.clients.canal_assinatura is
  'Canal usado na assinatura do contrato (gov.br, clicksign, manual, etc.).';
comment on column public.clients.sla_hours is
  'SLA contratado em horas (opcional).';
comment on column public.clients.owner_id is
  'Responsável interno pela conta (usuário da equipe). Usado em Pipeline/CRM.';

-- ── TEAM_MEMBERS: adiciona colunas ───────────────────────────────────────
alter table public.team_members
  add column if not exists gender public.gender_type,
  add column if not exists cpf text,
  add column if not exists birth_date date,
  add column if not exists senioridade public.senioridade_type,
  add column if not exists manager_id uuid references auth.users(id) on delete set null,
  add column if not exists last_login_at timestamptz;

comment on column public.team_members.gender is
  'Tratamento formal em e-mails. NULL → fallback "Prezado(a)".';
comment on column public.team_members.senioridade is
  'Senioridade do membro da equipe.';
comment on column public.team_members.manager_id is
  'Líder direto (self-FK indireta via auth.users).';
comment on column public.team_members.last_login_at is
  'Último login registrado. Atualizado via trigger/hook de auth.';

-- ── Índices úteis ────────────────────────────────────────────────────────
create index if not exists idx_clients_owner_id on public.clients(owner_id);
create index if not exists idx_team_members_manager_id on public.team_members(manager_id);
create index if not exists idx_clients_gender on public.clients(gender) where gender is not null;

-- ── Trigger para aceite_termos_at ────────────────────────────────────────
-- Preenche timestamp automaticamente quando aceite_termos vira true.
create or replace function public.set_aceite_termos_timestamp()
returns trigger
language plpgsql
as $$
begin
  if new.aceite_termos = true and (old.aceite_termos is distinct from true) then
    new.aceite_termos_at := coalesce(new.aceite_termos_at, now());
  elsif new.aceite_termos = false then
    new.aceite_termos_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clients_aceite_termos on public.clients;
create trigger trg_clients_aceite_termos
  before insert or update of aceite_termos on public.clients
  for each row
  execute function public.set_aceite_termos_timestamp();
