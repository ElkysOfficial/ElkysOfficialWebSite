---
title: Edge fn — create-user
tags: [edge-fn, user-mgmt]
---

# Edge fn — `create-user`

## Contexto

Cria conta no Supabase Auth e dispara onboarding. Chamada por `AdminClientCreate.tsx` e `AdminTeamCreate.tsx`.

## Spec

| Campo        | Valor                                            |
| ------------ | ------------------------------------------------ |
| Path         | `supabase/functions/create-user/index.ts`        |
| `verify_jwt` | `false`                                          |
| Auth         | Bearer admin (validado por `requireAdminAccess`) |

## Payload

```json
{ "email": "string", "password": "string", "full_name": "string" }
```

## Comportamento

1. `requireAdminAccess(req, CORS)` valida quem chama.
2. `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })`.
3. `email_confirm: true` evita o e-mail automático do Supabase (Elkys envia o seu via `send-client-welcome` ou `send-team-welcome`).
4. Retorna `{ ok: true, user_id: uuid }`.

## Erros conhecidos

| Status | Causa                                                           |
| ------ | --------------------------------------------------------------- |
| 401    | Bearer ausente/inválido                                         |
| 403    | Caller não é admin                                              |
| 422    | `auth.admin.createUser` rejeitou (email duplicado, senha fraca) |
| 500    | service role indisponível                                       |

## Problemas Identificados

🟠 **Sem validação de força de senha no servidor** — se admin enviar senha curta, depende do default do Supabase. `validation.ts` tem `isStrongPassword` mas não está sendo usado.
🟢 **`full_name` opcional em `user_metadata`** — algumas chamadas omitem; `profiles` trigger preenche com email se vazio.

## Recomendações

1. Validar `isStrongPassword(password)` antes de `createUser`.
2. Garantir que após `createUser`, o INSERT em `clients`/`team_members` ocorra na mesma transação ou em retry idempotente (atualmente é fire-and-forget no front).

## Relações

- [[edge-fn-delete-user]]
- [[edge-fn-update-user]]
- [[edge-fn-send-client-welcome]]
- [[edge-fn-send-team-welcome]]
- [[../04-flows/first-access-flow]]
- [[../02-domains/clients]]
- [[../02-domains/team-members]]

## Referências

- `supabase/functions/create-user/index.ts`
- `supabase/functions/_shared/auth.ts`
- `src/pages/admin/ClientCreate.tsx`
- `src/pages/admin/TeamCreate.tsx`
