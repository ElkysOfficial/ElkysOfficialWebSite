---
title: Domínio — Clients
tags: [domain, clients, pivot]
---

# Domínio — Clients

## Contexto

`clients` é a **entidade pivot** do produto. Tudo no portal admin gira em torno de operações sobre clientes: criar, ver detalhe, vincular projetos, emitir cobranças, abrir tickets. Tudo no portal cliente é restrito ao `client_id` resolvido a partir do `auth.users.id`.

## Descrição Técnica

### Identidade

| Campo                                | Função                                                               |
| ------------------------------------ | -------------------------------------------------------------------- |
| `id`                                 | UUID PK                                                              |
| `user_id`                            | FK → `auth.users` (nullable; null se cliente "histórico" sem portal) |
| `email`, `cpf`                       | Unique                                                               |
| `cnpj`, `nome_fantasia`              | PJ (nullable)                                                        |
| `contract_status`                    | `ativo`, `inadimplente`, `encerrado`                                 |
| `must_change_password`               | Flag de primeiro acesso                                              |
| `client_since`                       | Data                                                                 |
| `terms_version`, `terms_accepted_at` | LGPD/aceite — adicionados em `20260427120000`                        |

### Dois caminhos de acesso ao portal

1. **Direto**: `clients.user_id` aponta para `auth.users.id`. Usado para o "cliente principal".
2. **Via contato**: `client_contacts.auth_user_id` aponta para `auth.users.id`. Permite múltiplos contatos com acesso.

A função `get_client_id_for_portal_user(_user_id)` resolve com **prioridade 1 = `clients.user_id`, prioridade 0 = `client_contacts.auth_user_id`**.

⚠️ **Assumido:** o portal só carrega 1 cliente por usuário, mesmo que o contato esteja vinculado a múltiplos. Validar.

### Cascades

Deletar um `client` cascateia para:

- `projects` → cascateia para `project_contracts`, `project_installments`, `project_subscriptions`, `charges`, `project_next_steps`, `timeline_events`.
- `documents`, `support_tickets` → `ticket_messages`, `client_contacts`.

### RLS

| Operação      | Policy                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------ |
| SELECT        | `is_admin(uid)` OR `clients.user_id = uid` OR existência de `client_contacts.auth_user_id = uid` |
| INSERT/UPDATE | Apenas admin                                                                                     |
| DELETE        | Apenas `admin_super` (auditado em `audit_logs`)                                                  |

### Operações principais

- **Criação**: `AdminClientCreate.tsx` → `create-user` (edge fn) → INSERT `clients` + `client_contacts(is_primary=true)` → `send-client-welcome`.
- **Edição**: `AdminClientDetail.tsx` → UPDATE direto (RLS) + `update-user` se email/full_name mudou.
- **Exclusão**: apenas `admin_super`. Trigger de auditoria captura `before_data`.
- **Conversão de lead**: ver [[../04-flows/lead-to-client-flow]] (e o campo `leads.converted_client_id`).

### Inadimplência

- `contract_status = 'inadimplente'` é setado pelo cron de financial blocks.
- `client_inadimplencia_warnings` (table dedicada, migration `20260423120100`) rastreia avisos enviados (D+15, D+30) para idempotência.

## Problemas Identificados

🟠 **`monthly_value` e `project_total_value` são legacy** — calculados em runtime via soma de subscriptions/installments. Manter a coluna gera divergência silenciosa quando alterada manualmente.

🟠 **`client_contacts.is_primary` com unique partial index** — única garantia de "1 contato primário". Sem trigger que force; INSERT direto que vire as costas para o index pode quebrar invariante.

🟢 **Nenhum constraint impedindo `clients` órfão** (`user_id = NULL` indefinido). Esperado por design (clientes históricos), mas alguns relatórios podem omitir.

## Impacto

- Refactor de auth precisa contemplar a dualidade `clients.user_id` ↔ `client_contacts.auth_user_id`.
- Renomeação ou DELETE de cliente é evento de alto blast radius (cascade total).

## Recomendações

1. Criar **view materializada** `client_financial_rollup` para substituir `monthly_value`/`project_total_value` legados.
2. Adicionar **trigger** que enforce no máximo 1 contato com `is_primary=true` por cliente.
3. Documentar SLA de exclusão (apenas admin_super, registrar motivo em `audit_logs.reason`).

## Relações

- [[client-contacts]]
- [[projects]]
- [[charges]]
- [[../03-features/lead-conversion]]
- [[../04-flows/lead-to-client-flow]]
- [[../10-security/rls-model]]
- [[../06-api/edge-fn-create-user]]
- [[../06-api/edge-fn-delete-user]]

## Referências

- `supabase/migrations/*_clients_*.sql`
- `src/pages/admin/ClientCreate.tsx`
- `src/pages/admin/ClientDetail.tsx`
- `src/lib/portal-data.ts` → `resolveClientForUser`
- `docs/DATABASE.md` (clients section)
