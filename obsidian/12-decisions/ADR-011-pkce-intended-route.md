---
title: ADR-011 — PKCE + intended route + safeRedirectPath
tags: [adr, security, auth]
status: accepted
---

# ADR-011 — PKCE, intended route e safeRedirectPath

## Contexto

Auditoria de auth (v2.97.5) identificou três gaps em relação ao padrão de mercado para SPAs:

1. **Sem PKCE explícito** — `flowType` não definido no Supabase client. Default antigo era implicit flow (deprecated em OAuth2.1).
2. **Sem intended route** — `ProtectedRoute` redirecionava para `/login` sem preservar a rota original. Pós-login, usuário caía sempre no fallback (`/portal/admin` ou `/portal/cliente`), perdendo o destino que motivou o login.
3. **Sem `detectSessionInUrl`** — callback OAuth do Google não populava sessão automaticamente.

## Decisão

### 1. PKCE no Supabase client

`src/integrations/supabase/client.ts`:

```ts
auth: {
  storage: localStorage,
  persistSession: true,
  autoRefreshToken: true,
  flowType: "pkce",            // novo
  detectSessionInUrl: true,     // novo
}
```

### 2. Intended route via `?redirect=`

`ProtectedRoute` quando rejeita por falta de sessão:

```tsx
const intended = `${location.pathname}${location.search}`;
const redirectQuery = isLoginPath ? "" : `?redirect=${encodeURIComponent(intended)}`;
return <Navigate to={`/login${redirectQuery}`} replace />;
```

`Login.tsx` lê `?redirect=` e aplica em ambos os fluxos (email + Google):

```tsx
const redirectParam = searchParams.get("redirect");
const fallback = isTeamMember ? "/portal/admin" : "/portal/cliente";
const dest = safeRedirectPath(redirectParam, fallback);
navigate(dest, { replace: true });
```

### 3. `safeRedirectPath` helper (`src/lib/safe-redirect.ts`)

Bloqueia:

- URLs absolutas (`https://evil.com`, `mailto:`, `javascript:`, `data:`).
- Protocol-relative (`//evil.com`).
- Backslash injection (`/\evil.com` que alguns browsers normalizam para `//evil.com`).
- Control chars (codepoints < U+0020) — defesa contra header/log injection.

Ver doc inline e exemplos no arquivo.

### 4. OAuth Google preserva redirect

`AuthContext.signInWithGoogle(redirectQuery)` re-anexa o `?redirect=` ao `redirectTo`:

```ts
const target = window.location.origin + "/login" + (redirectQuery ?? "");
await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: target } });
```

## Alternativas consideradas

| Opção                                           | Por que não                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `state` em React Router (em vez de query param) | State não persiste através de redirect HTTP do OAuth. Query param sobrevive ao round-trip Google. |
| sessionStorage para guardar intended route      | Mais lugar para limpar; query param é stateless e auditável na URL.                               |
| Apenas `flowType=pkce`, sem intended route      | UX continua quebrada (cai sempre no fallback).                                                    |
| Implicit flow (deprecated)                      | Token no fragment; vaza em referer/log.                                                           |

## Consequências

### Positivas

- Conformidade com OAuth2.1 (PKCE obrigatório para SPAs).
- UX correta: ao tentar acessar `/portal/cliente/projetos/123` deslogado, login + redirect entrega exatamente nessa rota.
- Validação centralizada (`safeRedirectPath`) — se outro fluxo precisar redirect futuramente, reusa.

### Negativas / atenção

- Se Supabase mudar formato do callback (improvável), `detectSessionInUrl` pode precisar ajustes.
- `?redirect=` é visível na URL — não inclua dados sensíveis no path original (tipo tokens em query). Como guardamos só path interno, OK.

## Mantido sem mudança

- Inactivity timeout (30min + 2min warning).
- Custom events `session-expiring`, `session-expired`, `auth-no-access`.
- Retry de role com timeout 8s + 12s.
- `queryClient.clear()` em logout/refresh inválido.
- Ordem de guards: `ProtectedRoute → Must-change-password → Terms → PortalRoleGuard`.

## Relações

- [[../04-flows/auth-flow]]
- [[../10-security/auth-model]]
- [[ADR-002-roles-in-db-not-jwt]]
- [[ADR-010-edge-fn-verify-jwt-false]]

## Referências

- `src/integrations/supabase/client.ts`
- `src/lib/safe-redirect.ts`
- `src/components/portal/auth/ProtectedRoute.tsx`
- `src/contexts/AuthContext.tsx`
- `src/pages/Login.tsx`
- Commit: `chore(auth): adicionei pkce, intended route com ?redirect= e validacao safe`
- Release: `v2.97.5`
