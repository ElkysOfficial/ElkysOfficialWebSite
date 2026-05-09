---
title: RLS Model
tags: [security, rls, database]
---

# RLS Model

## Contexto

A segurança real do produto está no **Postgres com RLS**. Frontend guards são UX. Cada role tem acesso _segregado por domínio_ — não há mais "is_team_member" universal.

## Descrição Técnica

### Funções helper (todas `SECURITY DEFINER`)

```sql
has_role(uid, role)              -- check single role
is_admin(uid)                    -- admin_super OR admin
has_any_team_role(uid)           -- qualquer role de equipe
has_finance_access(uid)          -- admin, financeiro
has_comercial_access(uid)        -- admin, comercial, marketing (em algumas tabelas)
has_dev_access(uid)              -- admin, developer, designer, po, support
is_admin_or_juridico(uid)        -- admin, juridico
get_client_id_for_portal_user(uid) -- resolve cliente do portal
```

Migrations chave: `20260417230100_pa10_tighten_clients_expenses_charges_rls.sql`, `20260418150000_juridico_reads_projects_clients.sql`.

### Domain-based access (PA10–PA19)

| Domínio     | Tabelas                                                                         | Role gate                          |
| ----------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| Finance     | `clients`, `charges`, `expenses`, `financial_goals`, `billing_*`                | `has_finance_access`               |
| Sales       | `leads`, `lead_interactions`, `proposals`                                       | `has_comercial_access`             |
| Legal       | `project_contracts`, `documents` (contracts)                                    | `is_admin_or_juridico`             |
| Dev/Support | `projects`, `support_tickets`, `ticket_messages`, `project_*`                   | `has_dev_access`                   |
| Marketing   | `marketing_calendar_events`, `internal_documents` (audience='marketing_design') | `has_role(_,'marketing')` ou admin |

### Cliente — leitura própria

| Tabela                                                | Filtro                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `clients`                                             | `user_id = uid` OR contato em `client_contacts.auth_user_id = uid`           |
| `projects`, `charges`, `documents`, `support_tickets` | `client_id = get_client_id_for_portal_user(uid)`                             |
| `documents`                                           | + `visibility ≠ 'interno'`                                                   |
| `timeline_events`                                     | + `visibility ∈ ('cliente','ambos')`                                         |
| `project_next_steps`                                  | + `client_visible = true`                                                    |
| `proposals`                                           | `status ≠ 'rascunho'` (read), `status = 'enviada'` (update aprovar/rejeitar) |
| `ticket_messages`                                     | + `is_internal = false`                                                      |

Cliente **não tem INSERT direto**; muta via edge functions (`complete-first-access`, ou ações como aprovar proposta que rodam via UPDATE no proprio status com check policy).

### Tabelas restritas a admin

`leads`, `lead_interactions`, `billing_*`, `expenses`, `financial_goals`, `audit_logs` (read), `automation_settings`.

### Imutabilidade

- `legal_acceptance_log` — sem UPDATE/DELETE policies (audit-proof).
- `audit_logs` — INSERT-only via triggers em `clients`, `projects`, `charges`, etc.
- `billing_actions_log` — INSERT-only; idempotência por (charge_id, rule_id, template_id, sent_at::date).

## Problemas Identificados

🔴 **Edge functions com `verify_jwt=false` precisam validar admin manualmente** — `requireAdminAccess` é a defesa. Se algum dev esquece, é bypass total de RLS (a função usa service role).

🟠 **DELETE policies ausentes/implícitas** — Postgres default é "negar tudo se não há policy". Funcional, mas não autodocumentado. Análise estática pode não pegar.

🟠 **`role_visibility` array em `team_tasks`** — string match contra enum. Role removida do enum sem cleanup deixa registros pendurados.

🟢 **Cascade DELETE bypass de policy** — quando `clients` é deletado, cascade dispara DELETE em filhos sem checar policy. Esperado, mas vale lembrar.

## Recomendações

1. **Lint customizado** ou test em CI: para cada edge function com `verify_jwt=false`, garantir que `requireAdminAccess` (ou outro require explícito) é chamado antes do primeiro `from()`.
2. Tornar **DELETE policies explícitas** (`CREATE POLICY ... FOR DELETE ... USING (is_admin(...))`) para autodocumentar.
3. Substituir `role_visibility text[]` por tabela junction `team_task_roles(task_id, role app_role)`.

## Relações

- [[auth-model]]
- [[../04-flows/auth-flow]]
- [[../06-api/index]]
- [[../05-database/erd]]
- [[../12-decisions/ADR-002-roles-in-db-not-jwt]]
- [[../12-decisions/ADR-006-domain-based-rls]]

## Referências

- `supabase/migrations/*_pa[0-9]*.sql` (séria PA1–PA19)
- `supabase/functions/_shared/auth.ts`
- `docs/PERMISSIONS.md`
