---
title: Auth Flow
tags: [flow, auth, security]
aliases: [Login Flow, Authentication Flow]
---

# Auth Flow

## Contexto

A autenticação é o ponto de entrada para os dois portais. Como **roles vivem na tabela `user_roles`** (não em JWT claims), o fluxo tem mais idas-e-voltas que um login JWT-only típico — e isso introduz superfície de risco que vale documentar.

## Descrição Técnica

### Sequência completa

> **A partir de v2.97.5** ([[../12-decisions/ADR-011-pkce-intended-route]]):
>
> - Supabase client usa **PKCE** (`flowType: 'pkce'`) e **detectSessionInUrl: true**.
> - `ProtectedRoute` captura rota original via `?redirect=<path>` ao redirecionar para `/login`.
> - `Login.tsx` valida via `safeRedirectPath` e navega para destino intencional pós-login (email **e** Google OAuth).

```
┌─ Browser ───────────────────────────────────────────────────────┐
│ 1. User → /login (ou /login?redirect=<path>)                     │
│ 2. PortalShell monta AuthProvider (lazy)                         │
│ 3. signInWithPassword(email, password)  OU  signInWithOAuth(g)   │
│    OAuth: PKCE code_verifier nunca trafega na URL.               │
│    OAuth callback: ?code= processado por detectSessionInUrl.     │
└─────────────────────┬────────────────────────────────────────────┘
                      ▼
              ┌───────────────┐
              │ Supabase Auth │
              └───────┬───────┘
                      ▼
              JWT + session
                      ▼
┌──────────── AuthContext.tsx ────────────────────────────────────┐
│ 4. onAuthStateChange dispara                                     │
│ 5. resolveSessionState(session)                                  │
│    └─→ SELECT role FROM user_roles WHERE user_id=...             │
│        timeout 8s → retry → timeout 12s                          │
│ 6. Se roles.length === 0:                                        │
│       signOut + dispatch('auth-no-access')                       │
│ 7. updateState(user, session, roles, derivedFlags)               │
│       (isAdmin, isClient, isTeamMember…)                         │
│ 8. Inicia inactivityTimer (30min) + warningTimer (28min)         │
└──────────────────────────────────────────────────────────────────┘
                      ▼
┌──────────── Routing layer ──────────────────────────────────────┐
│ 9. ProtectedRoute valida user + role base                        │
│ 10. MustChangePasswordGuard[Admin]:                              │
│     SELECT must_change_password FROM clients|team_members        │
│     true → redirect /portal/*/alterar-senha                      │
│ 11. TermsAcceptanceGuard (cliente only):                         │
│     SELECT terms_version, privacy_version FROM clients           │
│     vs LEGAL_VERSION → modal bloqueante                          │
│ 12. PortalRoleGuard (per-route):                                 │
│     roles.some(r ∈ allowedRoles)                                 │
│     false → redirect getDefaultAdminRoute(roles)                 │
│ 13. Layout renderiza + página resolve                            │
└──────────────────────────────────────────────────────────────────┘
```

### Roles definidos (enum `app_role`)

`admin_super`, `admin`, `cliente`, `comercial`, `juridico`, `financeiro`, `po`, `developer`, `designer`, `marketing`, `support` — **11 roles**.

### Default routes por role

`portal-access.ts:10-40` → `getDefaultAdminRoute(roles)`:

| Role                          | Rota padrão                |
| ----------------------------- | -------------------------- |
| `admin_super`, `admin`        | `/portal/admin`            |
| `comercial`                   | `/portal/admin/crm`        |
| `juridico`                    | `/portal/admin/contratos`  |
| `financeiro`                  | `/portal/admin/financeiro` |
| `marketing`                   | `/portal/admin/calendario` |
| `developer`, `designer`, `po` | `/portal/admin/projetos`   |
| `support`                     | `/portal/admin/suporte`    |
| `cliente`                     | `/portal/cliente`          |

### Timeout de inatividade

- `INACTIVITY_TIMEOUT = 30 * 60 * 1000` (`AuthContext.tsx:75`)
- `WARNING_BEFORE = 2 * 60 * 1000` (`AuthContext.tsx:76`)
- Throttle reset 2000ms.
- Eventos rastreados: `mousedown`, `keydown`, `scroll`, `touchstart`.
- Custom events emitidos: `session-expiring`, `session-expired`, `auth-no-access`.

### Cleanup de cache no signOut

`QueryClient.clear()` é chamado em troca de auth state (`AuthContext.tsx:310`) — evita vazamento de dados entre roles em logout/login na mesma aba.

## Problemas Identificados

🔴 **Roles vêm do banco, não do JWT** — se `user_roles` SELECT falhar (timeout, RLS quebrada, replica delay), o app dispara `auth-no-access` e desloga o usuário. Recovery via refresh manual; sem retry automático após o segundo.

- Arquivo: `AuthContext.tsx:104, 197-203, 227-232`

🔴 **`isTeamMember` flag é união manual de 10 roles** (`AuthContext.tsx:128-138`) — ao adicionar role nova ao enum, é fácil esquecer de atualizar a flag. Boa migração para uma função pura `isTeamRole(role)` em `portal-access.ts`.

🟠 **Custom events sem garantia de consumo** — se a UI do banner de "session-expiring" não estiver montada, o usuário é deslogado sem aviso. Anti-pattern: evento sem subscriber não falha, falha silenciosamente.

🟠 **TermsAcceptanceGuard schema cast** (`TermsAcceptanceGuard.tsx:27`) — `"terms_version, privacy_version" as never` para contornar tipos gerados. Frágil; refator de schema pode quebrar em runtime sem erro de compile.

🟠 **`syncId` pattern para race conditions** (`AuthContext.tsx:187,220,225`) — funcional, mas baseado em closure capture; difícil de testar e fácil de regredir.

🟢 **Throttle de 2s nos eventos de atividade** — pode perder interações muito rápidas; aceitável para UX.

## Impacto

- Usuário com role mal sincronizada vê tela vazia ou loop de redirect.
- Em incidente de Supabase (timeout, replica), todos os logins falham.
- Adicionar role nova exige tocar em ≥3 lugares (enum SQL, `app_role` TS, `isTeamMember`, `getDefaultAdminRoute`).

## Recomendações

1. **Mover roles para custom claims do JWT** via Supabase function hook (`auth.users.app_metadata.roles`). Eliminaria 1 round-trip e o ponto único de falha.
2. **Centralizar `isTeamRole`** em `portal-access.ts`; consumir em AuthContext.
3. **Garantir UI de aviso de sessão** sempre montada via portal global (não condicional).
4. Regenerar tipos do Supabase ao mudar `clients` para remover `as never` cast.
5. ✅ **PKCE + intended route + safeRedirectPath** — implementado em v2.97.5 ([[../12-decisions/ADR-011-pkce-intended-route]]).

## Relações

- [[first-access-flow]]
- [[../10-security/rls-model]]
- [[../06-api/edge-fn-complete-first-access]]
- [[../07-frontend/routing]]
- [[../12-decisions/ADR-002-roles-in-db-not-jwt]]

## Referências

- `src/contexts/AuthContext.tsx`
- `src/components/portal/auth/ProtectedRoute.tsx`
- `src/components/portal/auth/PortalRoleGuard.tsx`
- `src/components/portal/auth/MustChangePasswordGuard.tsx`
- `src/components/portal/auth/MustChangePasswordGuardAdmin.tsx`
- `src/components/portal/auth/TermsAcceptanceGuard.tsx`
- `src/lib/portal-access.ts`
- `src/PortalRoutes.tsx`
