---
title: First Access Flow
tags: [flow, auth, onboarding]
---

# First Access Flow

## Contexto

Clientes e membros de equipe são **criados pelo admin** com senha temporária. No primeiro login, devem trocar a senha obrigatoriamente. Este flow garante essa transição sem permitir entrada no portal real até finalizado.

## Sequência

```
[admin] AdminClientCreate / AdminTeamCreate
   │
   ├─→ create-user (edge fn) → auth.admin.createUser({email_confirm: true})
   ├─→ INSERT clients|team_members (must_change_password = true)
   └─→ send-client-welcome | send-team-welcome (com senha temp)
                │
                ▼
[user] recebe email + login
   │
   ▼
/login → signInWithPassword(email, temp)
   │
   ▼
AuthContext fetch user_roles → OK
   │
   ▼
ProtectedRoute passa
   │
   ▼
MustChangePasswordGuard[Admin] queries clients|team_members.must_change_password
   true → redirect /portal/{cliente|admin}/alterar-senha
   │
   ▼
ChangePassword.tsx → updateUser({password: new})
   │
   ▼
complete-first-access (edge fn)
   ├─ resolve user.id from Bearer
   ├─ UPDATE clients SET must_change_password = false WHERE user_id = ...
   ├─ UPDATE team_members SET must_change_password = false WHERE user_id = ...
   └─ retorna { ok, updated_client, updated_team_member }
   │
   ▼
[next mount] MustChangePasswordGuard → false → portal real
```

## Pontos críticos

### Edge fn `complete-first-access`

- `verify_jwt = false` no `config.toml`.
- Valida Bearer token via `requireAuthenticatedUser` (não admin) — é o próprio usuário se identificando.
- Tenta UPDATE em **ambas** tabelas; pelo menos uma deve retornar registro.
- Se nenhuma → 404.

### Por que `must_change_password` em duas tabelas?

`clients` e `team_members` são entidades distintas (RLS distintas). Manter o flag dentro do registro (em vez de `auth.users.user_metadata`) evita race condition: a flag é setada na criação **antes** do user ser criado no Auth.

## Problemas Identificados

🟠 **Senha temporária no email transacional** — UX necessária; mitigada por nota de segurança no template + recomendação de troca imediata.
🟠 **`complete-first-access` sem rate limit** — usuário malicioso poderia bombardear endpoint, mas já está autenticado, dano limitado.
🟢 **Token de senha temporária não expira por si** — confia em `must_change_password = true` para forçar troca. Se admin esquece de marcar a flag, senha temp vira permanente.

## Recomendações

1. Adicionar **`temp_password_expires_at`** em `clients`/`team_members`; cron desativa user se `must_change_password = true AND temp_password_expires_at < now()`.
2. `MustChangePasswordGuard` mostrar countdown ("você tem X dias para trocar a senha").
3. Hash da senha temp em log (admin não vê senha em texto após criação).

## Relações

- [[auth-flow]]
- [[../06-api/edge-fn-create-user]]
- [[../06-api/edge-fn-complete-first-access]]
- [[../06-api/edge-fn-send-client-welcome]]
- [[../06-api/edge-fn-send-team-welcome]]
- [[../02-domains/clients]]
- [[../02-domains/team-members]]

## Referências

- `supabase/functions/complete-first-access/index.ts`
- `supabase/functions/create-user/index.ts`
- `src/pages/portal/cliente/ChangePassword.tsx`
- `src/pages/portal/admin/ChangePassword.tsx`
- `src/components/portal/auth/MustChangePasswordGuard.tsx`
- `src/components/portal/auth/MustChangePasswordGuardAdmin.tsx`
