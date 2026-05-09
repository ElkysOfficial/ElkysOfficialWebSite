---
title: Glossário
tags: [glossary, moc]
---

# Glossário

> Termos do domínio Elkys. Use sempre que quiser desambiguar entre `Charge`, `Installment`, `Subscription`, ou entre estados de projeto.

## Domínio comercial / financeiro

- **Lead** — pessoa/empresa em pipeline antes de ser cliente. Tabela: `leads`. Status: `novo`, `qualificado`, `proposta`, `negociacao`, `ganho`, `perdido`. Ver [[../02-domains/leads]].
- **Proposal** — proposta comercial enviada a lead ou cliente. Tem `valid_until`. Status: `rascunho`, `enviada`, `aprovada`, `rejeitada`, `expirada`. Ver [[../02-domains/proposals]].
- **Client** — cliente ativo da Elkys. Pivot do produto. Tabela: `clients`. `contract_status` ∈ `ativo`, `inadimplente`, `encerrado`. Ver [[../02-domains/clients]].
- **Contract (project_contract)** — contrato formal por projeto. Pode ter múltiplas versões (`version_no`). Ver [[../02-domains/project-contracts]].
- **Installment (project_installment)** — parcela 50/50: `entrada` (assinatura) e `entrega` (conclusão). Ver [[../02-domains/project-installments]].
- **Subscription (project_subscription)** — mensalidade recorrente. Tem `due_day`, `starts_on`, `ends_on` (nullable = indeterminado). Ver [[../02-domains/project-subscriptions]].
- **Charge** — cobrança individual gerada de instalment, subscription ou manual. Tabela `charges`. `origin_type` ∈ `parcela_projeto`, `mensalidade`, `manual`. Ver [[../02-domains/charges]].
- **Inadimplência** — `clients.contract_status = 'inadimplente'` setado pelo cron 02h quando há charges atrasadas há >X dias. Avisos progressivos rastreados em `client_inadimplencia_warnings`.
- **Régua de cobrança** — `billing_rules` + `billing_templates`. Dispara emails em D-3, D, D+3, D+15. Idempotente via `billing_actions_log`. Ver [[../03-features/billing-rules]].
- **Despesas** — `expenses`. Categorizadas, mensais. Usadas em `computeBurnRate` (`lib/finance-metrics.ts`).
- **Meta financeira** — `financial_goals`. Períodos `mensal`, `trimestral`, `anual`.

## Domínio projeto

- **Project** — entidade de execução. Status: `negociacao`, `em_andamento`, `pausado`, `concluido`, `cancelado`. Ver [[../02-domains/projects]].
- **current_stage** — texto livre (não enum). Ex: "Desenvolvimento", "Validação".
- **Pause source** — `automatico` (cron pausou por inadimplência) ou `manual` (admin pausou).
- **manual_status_override** — flag em `projects` que impede o cron de mexer no status.
- **Onboarding checklist** — `project_onboarding_checklist`, JSON de tasks iniciais.
- **Validation round** — `project_validation_rounds`, ciclo QA cliente↔interno.
- **Next step** — `project_next_steps`, owner = `elkys` | `cliente` | `compartilhado`.
- **Timeline event** — `timeline_events`, feed unificado por projeto. Visibility: `cliente`, `interno`, `ambos`.

## Domínio auth / RBAC

- **Role** — enum `app_role`: 11 valores (admin_super, admin, cliente, comercial, juridico, financeiro, po, developer, designer, marketing, support).
- **Portal** — admin (`/portal/admin`) ou cliente (`/portal/cliente`). Layouts e guards distintos.
- **Guard** — componente React que protege rota: ProtectedRoute, MustChangePasswordGuard, TermsAcceptanceGuard, PortalRoleGuard.
- **First access** — primeiro login com senha temporária. `must_change_password=true` força troca.
- **`get_client_id_for_portal_user(uid)`** — função SQL que resolve `client_id` para o usuário logado (prioridade: `clients.user_id`, fallback: `client_contacts.auth_user_id`).
- **`is_admin(uid)`** — `admin_super` OR `admin`.
- **`has_finance_access`, `has_comercial_access`, `has_dev_access`, `is_admin_or_juridico`** — gates de domínio (PA10–PA19).
- **service role** — chave Supabase com bypass de RLS, usada em edge functions server-side.

## Edge functions

- **`verify_jwt = false`** — flag no `config.toml` que desabilita validação automática de JWT pelo Supabase. 11 funções têm; precisam validar admin manualmente via `requireAdminAccess`.
- **`requireAdminAccess`** — helper em `_shared/auth.ts` que valida Bearer token + checa role admin.
- **`createServiceRoleClient`** — cria Supabase client com service role key (bypass RLS).
- **`buildEmail` / `sendEmail`** — wrappers em `_shared/email-template.ts` para Resend.

## Build / Deploy

- **manualChunks** — função em `vite.config.ts` que decide chunking por arquivo. Forma objeto foi descartada em v2.83.4 (gotcha). Ver [[../12-decisions/ADR-005-manualchunks-pitfall]].
- **PurgeCSS** — remove CSS não usado da landing; portal CSS lazy-loaded via `window.__ELKYS_FULL_CSS__`.
- **Prerender** — `scripts/prerender.cjs` gera HTML estático de cada rota pública.
- **Smoke check** — `deploy.yml` faz curl `elkys.com.br` 12× depois do FTP, espera 200/301/302.
- **dangerous-clean-slate** — flag do FTP-Deploy-Action; primeiro tentativo do deploy apaga tudo no servidor antes de subir.

## Frontend

- **CVA** — Class Variance Authority. Padrão para componentes do design system.
- **`cn()`** — utility `clsx + tailwind-merge` (sem conflitos de classes).
- **Token** — CSS custom property em `_tokens.scss` (formato HSL sem wrapper `hsl()`).
- **Eyebrow** — texto pequeno acima de heading (`text-[11px] font-semibold uppercase tracking-[0.08em]`).

## Métricas (`lib/finance-metrics.ts`)

- **Burn rate** — soma de `expenses` no período.
- **Runway** — saldo / burn rate.
- **Operational margin** — (receita - despesas) / receita.
