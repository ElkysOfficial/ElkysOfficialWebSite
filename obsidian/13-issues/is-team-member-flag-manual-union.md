---
title: isTeamMember é union manual de roles
tags: [issue, medium, auth]
severity: MEDIUM
---

# 🟠 M10 — `isTeamMember` é union manual

## Contexto

`AuthContext.tsx:128-138` deriva `isTeamMember = roles.some(r => ['admin_super','admin','marketing','developer','designer','po','support','financeiro','comercial','juridico'].includes(r))` — 10 roles enumerados manualmente.

## Impacto

- Adicionar role nova ao enum `app_role` exige tocar `AuthContext` E lembrar de incluir.
- Esquecer = role nova considerada cliente — Auth bug em produção.

## Recomendação

```ts
// src/lib/portal-access.ts
export const TEAM_ROLES: AppRole[] = [
  "admin_super",
  "admin",
  "marketing",
  "developer",
  "designer",
  "po",
  "support",
  "financeiro",
  "comercial",
  "juridico",
];

export function isTeamRole(role: AppRole): boolean {
  return TEAM_ROLES.includes(role);
}

export function isTeamMember(roles: AppRole[]): boolean {
  return roles.some(isTeamRole);
}
```

Centralizar. `AuthContext` consome.

Ainda manual, mas em **um lugar** + cobertura de teste se Vitest existir.

## Onda

- 🔴 Onda 1.

## Relações

- [[../04-flows/auth-flow]]
- [[../05-database/enums]]
- [[security-roles-in-db]]

## Referências

- `src/contexts/AuthContext.tsx:128-138`
- `src/lib/portal-access.ts`
