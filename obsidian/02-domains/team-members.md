---
title: Domínio — Team Members
tags: [domain, team, internal]
---

# Domínio — Team Members

## Contexto

Membros internos da Elkys. Acessam o portal admin com role específico. Distintos de `clients` (clientes externos).

## Estrutura

| Campo                         | Função                                         |
| ----------------------------- | ---------------------------------------------- |
| `user_id`                     | FK auth.users (nullable)                       |
| `full_name`, `email`, `phone` | identidade                                     |
| `role_title`                  | string livre (cargo: "Desenvolvedor Senior")   |
| `system_role`                 | enum espelhando `app_role` (referência rápida) |
| `senioridade`                 | (assumido) `junior`, `pleno`, `senior`         |
| `manager_id`                  | FK team_members (hierarquia)                   |
| `must_change_password`        | flag de primeiro acesso                        |
| `is_active`                   | boolean                                        |

`team_tasks` é a tabela de tarefas internas (Kanban). `role_visibility text[]` para granularidade — ver [[../13-issues/role-visibility-text-array]].

## RLS

- Admin → full
- Membro → lê próprios dados (`user_id = uid`)
- Cliente → ❌ nunca

## Onboarding

Mesmo flow de [[../04-flows/first-access-flow]]: admin cria → email → troca senha → portal.

## Problemas Identificados

🟠 **`role_title` vs `system_role` vs `user_roles`** — três fontes para "cargo". Confunde:

- `role_title` é display ("Desenvolvedor Sênior")
- `system_role` ⚠️ assumido — referência ao `app_role`
- `user_roles` é o que RLS lê
  🟢 **Sem audit log de mudança de manager_id**.

## Recomendações

1. Documentar a tripla "role_title (UI) × system_role (legacy?) × user_roles (auth)" — eliminar `system_role` se redundante.
2. Adicionar trigger de audit em `team_members` (UPDATE).

## Relações

- [[user-roles]]
- [[../04-flows/first-access-flow]]
- [[../06-api/edge-fn-create-user]]
- [[../06-api/edge-fn-send-team-welcome]]

## Referências

- `supabase/migrations/*_team_members_*.sql`
- `src/pages/admin/TeamHub.tsx`, `TeamCreate.tsx`, `TeamEdit.tsx`
