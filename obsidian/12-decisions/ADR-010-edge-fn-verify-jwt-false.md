---
title: ADR-010 — verify_jwt=false em 11 Edge Functions
tags: [adr, security, backend]
status: accepted-with-debt
---

# ADR-010 — `verify_jwt = false` em 11 Edge Functions

## Contexto

Supabase, por padrão, valida JWT em todas as Edge Functions e retorna 401 se ausente. Isso impede:

1. Cron chamando function diretamente (sem JWT de usuário).
2. Funções chamadas pelo próprio Supabase via webhook (ex: trigger de DB).
3. Endpoints "first access" onde usuário ainda não completou auth.

## Decisão

11 funções configuradas com `verify_jwt = false` no `config.toml`:

- `create-user`, `delete-user`, `update-user`
- `complete-first-access`
- `send-team-welcome`, `send-client-welcome`, `send-document-added`
- `send-ticket-opened`, `send-ticket-updated`, `send-inadimplencia-warning`
- `process-billing-rules`, `process-scheduled-notifications`

Cada função valida acesso **manualmente**:

- **Admin only** → `requireAdminAccess(req, CORS)` (timing-safe)
- **User only** → `requireAuthenticatedUser(req)`
- **Service role** → `isServiceRoleRequest(req)`
- Mistura → if-else explícito

## Alternativas

| Opção                                                | Por que não                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `verify_jwt=true` em todas + cron passa JWT de admin | Cron precisaria de credencial fixa armazenada — pior security posture |
| Função separada para cron e para admin               | Duplicação massiva (~70% do código igual)                             |
| Webhook signing                                      | Supabase não suporta nativamente                                      |

## Consequências

### Positivas

- Cron + admin + first-access em uma função só.
- Validação explícita e localizada por endpoint.

### Negativas (debt)

- **Esquecer `requireAdminAccess` é bypass total** — função usa service role internamente.
- **Sem garantia de compile-time** que a verificação foi feita.
- Auditoria periódica obrigatória.

## Mitigações

1. Test em CI: para cada arquivo em `supabase/functions/` listado em `verify_jwt=false`, garantir que contém `requireAdminAccess` OU `requireAuthenticatedUser` OU `isServiceRoleRequest` antes de qualquer `from()`.
2. Code review obrigatório com 2 olhos para mudanças nessas funções.
3. PR template lembrando da regra.

## Relações

- [[../08-backend/edge-functions-architecture]]
- [[../10-security/auth-model]]
- [[../06-api/index]]
- [[../13-issues/security-edge-fn-bypass-risk]]

## Referências

- `supabase/config.toml`
- `supabase/functions/_shared/auth.ts`
