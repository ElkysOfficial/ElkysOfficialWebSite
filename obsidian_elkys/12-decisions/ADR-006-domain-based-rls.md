---
title: ADR-006 — RLS segregada por domínio (PA10–PA19)
tags: [adr, security, rls]
status: accepted
---

# ADR-006 — RLS segregada por domínio

## Contexto

Inicialmente, todas as policies usavam `has_any_team_role(uid)` — qualquer role de equipe lia tudo. Isso violava o princípio de menor privilégio: developer via dados financeiros sensíveis, marketing via leads internos, juridico via despesas.

Migrations PA10 a PA19 (abril 2026) refatoraram RLS por domínio.

## Decisão

Cada domínio tem **gate function dedicada**:

| Domínio     | Gate                   | Tabelas                                                                 |
| ----------- | ---------------------- | ----------------------------------------------------------------------- |
| Financeiro  | `has_finance_access`   | `clients` (read), `charges`, `expenses`, `financial_goals`, `billing_*` |
| Comercial   | `has_comercial_access` | `leads`, `lead_interactions`, `proposals`                               |
| Jurídico    | `is_admin_or_juridico` | `project_contracts`, `documents` (contracts)                            |
| Dev/Suporte | `has_dev_access`       | `projects`, `support_tickets`, `ticket_messages`, `project_*`           |

Admin (`admin_super` / `admin`) bypass tudo via `is_admin`.

## Alternativas

| Opção                          | Por que não                                                                |
| ------------------------------ | -------------------------------------------------------------------------- |
| Manter `has_any_team_role`     | Violava menor privilégio                                                   |
| ABAC (attribute-based)         | Overkill para tamanho do time                                              |
| Roles 1:N por tabela explícito | Tabela junction `role_table_access` — manutenção complexa, query mais cara |

## Consequências

### Positivas

- Onboarding de role novo (designer, po) é trivial: criar gate function, atribuir às tabelas.
- Auditoria de "quem pode ler X" é uma query: `SELECT policy_name FROM pg_policies WHERE tablename='X'`.
- Vazamento de dados por role contido por construção.

### Negativas

- 4 funções helper a manter; adicionar role exige sincronizar todas.
- Migrations PA1–PA19 são "cake layer" — entender lendo migrations isoladas é difícil.

## Como adicionar role nova

1. `ALTER TYPE app_role ADD VALUE 'novo'`.
2. Decidir qual gate (ou criar novo).
3. UPDATE function: `CREATE OR REPLACE FUNCTION has_xxx_access ...`.
4. Sincronizar `_shared/auth.ts` (`requireXxxAccess`).

## Relações

- [[../10-security/rls-model]]
- [[../13-issues/role-visibility-text-array]]
- [[ADR-002-roles-in-db-not-jwt]]

## Referências

- `supabase/migrations/20260417230100_pa10_*.sql` até `20260418*_pa19_*.sql`
- `docs/PERMISSIONS.md`
