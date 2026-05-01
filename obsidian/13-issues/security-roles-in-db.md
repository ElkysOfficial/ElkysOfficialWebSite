---
title: Roles em DB são SPOF
tags: [issue, high, auth, security]
severity: HIGH
---

# 🔴 H3 — Roles em DB são single point of failure

## Contexto

`AuthContext` faz `SELECT role FROM user_roles WHERE user_id = ?` após cada `onAuthStateChange`. Se essa query falhar (timeout, replica lag, RLS quebrada), o usuário é tratado como sem role e deslogado com evento `auth-no-access`.

## Impacto

- **Disponibilidade**: incidente de Supabase (mesmo curto) → todos os logins falham.
- **UX**: usuário pode entrar em loop "loga → desloga" sem entender por quê.
- **Debug**: difícil diagnosticar — o "404 de role" não é diferenciado de "credenciais inválidas".

## Reprodução

1. Simular timeout em `user_roles` SELECT (artificialmente, ou em janela de manutenção do Supabase).
2. Observar dispatch de `auth-no-access` em `AuthContext.tsx:227-232`.

## Recomendação

**Migrar para JWT custom claims** via auth function hook:

```sql
-- pseudo-código do hook
CREATE FUNCTION inject_roles_into_jwt(user_id UUID) RETURNS jsonb AS $$
  SELECT jsonb_build_object('roles',
    array_agg(role::text)
  ) FROM user_roles WHERE user_id = $1;
$$ LANGUAGE sql STABLE;
```

E ler `roles` de `session.user.app_metadata.roles` no front. Manter `user_roles` como source of truth.

Ver [[../12-decisions/ADR-002-roles-in-db-not-jwt]] (plano detalhado).

## Onda

- 🟠 Onda 2 (estrutural).

## Relações

- [[../04-flows/auth-flow]]
- [[../12-decisions/ADR-002-roles-in-db-not-jwt]]
- [[../10-security/auth-model]]
- [[is-team-member-flag-manual-union]]

## Referências

- `src/contexts/AuthContext.tsx:104, 197-203, 227-232`
