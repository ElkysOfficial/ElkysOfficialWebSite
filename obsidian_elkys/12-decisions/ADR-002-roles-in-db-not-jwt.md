---
title: ADR-002 — Roles em user_roles, não em JWT
tags: [adr, auth, security]
status: accepted-with-debt
---

# ADR-002 — Roles em `user_roles`, não em JWT

## Contexto

Supabase suporta `auth.users.app_metadata` com claims customizadas, lidas no JWT. Isso evita um SELECT a cada autenticação. A Elkys optou pelo caminho oposto: armazenar roles em `user_roles(user_id, role)` e fetchar após login.

## Decisão

Roles vivem em `user_roles`. `AuthContext` faz `SELECT role FROM user_roles WHERE user_id = ...` após cada `onAuthStateChange`. Roles **não** entram no JWT.

## Alternativas consideradas

| Opção                               | Por que não (no momento)                                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app_metadata.roles` no JWT         | Requer auth function hook ou trigger no `auth.users` para sincronizar; Supabase não popula automaticamente. Custo extra de migração e debug do hook. |
| Custom claims via `user_metadata`   | Editável pelo próprio user; inseguro.                                                                                                                |
| RPC dedicada `current_user_roles()` | Cache no client-side complica invalidação.                                                                                                           |

## Consequências

### Positivas

- Trivial adicionar/remover role: `INSERT/DELETE` na tabela.
- RLS pode usar `user_roles` diretamente em policies (`has_role`, `is_admin`).
- Sem necessidade de "refresh token" para refletir mudança de role.

### Negativas (debt importante)

- **Round-trip extra a cada login** — 1 SELECT bloqueante.
- **Ponto único de falha** — se SELECT timeout (8s) + retry (12s), usuário é deslogado com `auth-no-access`.
- **Roles não disponíveis no edge** — funções com `verify_jwt=true` não recebem roles no JWT; precisam consultar `user_roles` via service role.
- **Cache invalidation manual** — mudar role de um usuário logado exige logout/login.

## Plano para sair do debt

1. Implementar Supabase **auth function hook** (`auth.users.before_sent_to_client`) que injeta `app_metadata.roles` baseado em `user_roles`.
2. Manter `user_roles` como source of truth; hook é projeção.
3. Migrar `AuthContext` para ler `roles` do `session.user.app_metadata.roles`.
4. Adicionar `refresh_session` quando admin altera roles de um usuário em uso.

## Relações

- [[../04-flows/auth-flow]]
- [[../10-security/auth-model]]
- [[../10-security/rls-model]]
- [[../13-issues/security-roles-in-db]]

## Referências

- `src/contexts/AuthContext.tsx:104, 197-203, 227-232`
- `supabase/migrations/*_user_roles_*.sql`
