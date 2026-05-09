---
title: Funções SQL
tags: [database, functions, security-definer]
---

# Funções SQL

Todas marcadas `SECURITY DEFINER` (executam com privilégios do owner, bypass de RLS controlado).

## Auth helpers

| Função                                         | Retorno | Função                                                                           |
| ---------------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| `has_role(_user_id uuid, _role app_role)`      | bool    | check single role                                                                |
| `is_admin(_user_id uuid)`                      | bool    | `admin_super` OR `admin`                                                         |
| `has_any_team_role(_user_id uuid)`             | bool    | qualquer role de equipe                                                          |
| `has_finance_access(_user_id uuid)`            | bool    | admin OR `financeiro`                                                            |
| `has_comercial_access(_user_id uuid)`          | bool    | admin OR `comercial` (+ marketing em algumas tabelas)                            |
| `has_dev_access(_user_id uuid)`                | bool    | admin OR `developer`/`designer`/`po`/`support`                                   |
| `is_admin_or_juridico(_user_id uuid)`          | bool    | admin OR `juridico`                                                              |
| `get_client_id_for_user(_user_id uuid)`        | uuid    | LEGADO — usar `get_client_id_for_portal_user`                                    |
| `get_client_id_for_portal_user(_user_id uuid)` | uuid    | resolve client por `clients.user_id` (P1) ou `client_contacts.auth_user_id` (P0) |

## Financial automation

| Função                                  | Função                                                         |
| --------------------------------------- | -------------------------------------------------------------- |
| `mark_overdue_charges()`                | promove `pendente → atrasado` quando `due_date < CURRENT_DATE` |
| `sync_projects_from_blocking_charges()` | pausa/retoma projects com base em charges bloqueantes          |
| `sync_financial_blocks()`               | wrapper das duas acima — chamada pelo cron 02h                 |
| `reconcile_inadimplencia_warnings()`    | sincroniza `client_inadimplencia_warnings`                     |

## RPC para front

| RPC                            | Função                                                                   |
| ------------------------------ | ------------------------------------------------------------------------ |
| `client_accept_terms(version)` | INSERT `legal_acceptance_log` + UPDATE `clients.terms_version` (atômico) |

## Triggers

- `on_auth_user_created` → INSERT em `profiles` automaticamente após signup.
- Triggers de `audit_logs` em `clients`, `projects`, `charges`, `proposals` (UPDATE/DELETE).
- Trigger em `support_tickets` para `first_response_at`, `resolved_at`.

## Problemas Identificados

🟠 **`get_client_id_for_user` (legado) ainda em uso** — risco de chamar a errada e pegar resolver desatualizado.
🟢 **Sem testes pgTAP** das funções financeiras.

## Recomendações

1. Marcar `get_client_id_for_user` como deprecated (comment SQL) e remover usos.
2. Adicionar testes pgTAP para `mark_overdue_charges` e `sync_projects_from_blocking_charges`.

## Relações

- [[../10-security/rls-model]]
- [[cron-jobs]]
- [[../13-issues/charges-status-agendada-stuck]]

## Referências

- `supabase/migrations/*has_role*`, `*is_admin*`, `*get_client_id*`
- `supabase/migrations/*sync_financial_blocks*`
- `docs/DATABASE.md` (Functions section)
