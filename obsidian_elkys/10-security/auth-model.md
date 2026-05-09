---
title: Auth Model
tags: [security, auth]
---

# Auth Model

## Camadas

```
[Browser]
  ↓ email + password
Supabase Auth (gotrue)
  ↓ JWT (15min) + refresh (1 week)
[AuthContext]
  ↓ SELECT user_roles
[ProtectedRoute] [MustChangePasswordGuard] [TermsAcceptanceGuard] [PortalRoleGuard]
  ↓ allowed
[Layout + Page]
  ↓ supabase.from('table')
[Postgres + RLS]   OR   [Edge Function + service role]
```

## Identidade

- `auth.users` (Supabase) — email, password (bcrypt), `user_metadata`, `app_metadata`.
- `profiles` — espelho via trigger `on_auth_user_created`.
- `clients` ou `team_members` — perfil "de negócio", referencia `auth.users.id` em `user_id`.
- `client_contacts` — contatos extras com `auth_user_id` opcional.

## Sessão

- JWT refresh em `localStorage` (Supabase SDK default) — vetor XSS clássico.
- Inactivity timeout 30min com warning de 2min.
- `QueryClient.clear()` em troca de auth state.
- **PKCE flow** ativo (`flowType: 'pkce'`) — code_verifier nunca trafega na URL.
- **`detectSessionInUrl: true`** processa callback OAuth automaticamente.
- **Intended route** preservado via `?redirect=` validado por `safeRedirectPath`.

Detalhes em [[../12-decisions/ADR-011-pkce-intended-route]].

## Senhas

- Criação: edge fn `create-user` chama `auth.admin.createUser({email_confirm:true})`. Senha temporária em texto **dentro do email** transacional (única vez) — UX necessária.
- `must_change_password=true` força troca no 1º login.
- Reset: edge fn `send-password-reset` gera link via `auth.admin.generateLink()`.
- **Sem 2FA obrigatório**.

## RBAC

- 11 roles em `app_role` enum.
- Source of truth: `user_roles` table.
- Admin/team operations: gates `is_admin`, `has_finance_access`, etc.
- Cliente: `get_client_id_for_portal_user` resolve identidade no portal.

Detalhe em [[rls-model]].

## Edge functions auth

- `verify_jwt=true` (default) — Supabase rejeita request sem JWT válido.
- `verify_jwt=false` (11 fns) — função valida manualmente:
  - `requireAdminAccess(req)` — Bearer + role admin
  - `requireAuthenticatedUser(req)` — Bearer + qualquer usuário
  - `isServiceRoleRequest(req)` — service role (cron)
  - `timingSafeEqualStr(a, b)` — comparação constant-time

## Audit

- `audit_logs` — INSERT em UPDATE/DELETE de tabelas críticas (via triggers).
- `legal_acceptance_log` — IMUTÁVEL (sem UPDATE/DELETE policies). Usa `client_accept_terms(version)` RPC para INSERT atômico.
- `billing_actions_log` — idempotência da régua.

## Findings

Ver [[index]] para resumo HIGH/MEDIUM/LOW.

## Relações

- [[../04-flows/auth-flow]]
- [[../04-flows/first-access-flow]]
- [[rls-model]]
- [[../12-decisions/ADR-002-roles-in-db-not-jwt]]
- [[../12-decisions/ADR-010-edge-fn-verify-jwt-false]]

## Referências

- `src/contexts/AuthContext.tsx`
- `supabase/functions/_shared/auth.ts`
- `supabase/migrations/*has_role*`, `*is_admin*`, `*get_client_id*`
