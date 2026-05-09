---
title: Segurança — MOC
tags: [security, moc]
---

# Segurança — MOC

## Camadas de defesa

1. **Frontend Guards** (UX) — `ProtectedRoute`, `MustChangePasswordGuard`, `TermsAcceptanceGuard`, `PortalRoleGuard`. Ver [[../04-flows/auth-flow]].
2. **Edge Functions** — `requireAdminAccess` + `timingSafeEqualStr` para comparação de tokens. Ver [[auth-model]].
3. **RLS no Postgres** — verdade de segurança. Ver [[rls-model]].
4. **Storage policies** — `avatars` privado por owner. Ver [[storage-security]].
5. **Audit logs imutáveis** — `audit_logs`, `legal_acceptance_log`, `billing_actions_log`. Ver [[audit-trail]].

## Notas

- [[rls-model]] — domain-based access (Finance, Sales, Legal, Dev/Support silos)
- [[auth-model]] — login, JWT, custom events, timeout
- [[threat-model]] — atacantes esperados, superfície
- [[owasp-findings]] — achados HIGH/MEDIUM/LOW
- [[audit-trail]] — o que registra o quê
- [[storage-security]] — buckets e policies

## Findings consolidados (do agent de auditoria)

### 🔴 HIGH

- **Roles via DB, não JWT** — ponto único de falha (timeout do `user_roles` SELECT desconecta usuários). Ver [[../04-flows/auth-flow]] e [[../12-decisions/ADR-002-roles-in-db-not-jwt]].
- **localStorage com sessão Supabase** — vetor XSS clássico. Mitigado por inexistência de `dangerouslySetInnerHTML` e sanitização de templates. Não há CSP.
- **Senhas temporárias por email** — UX necessária; mitigada com nota de segurança no template, mas exposta em logs SMTP/relays.

### 🟠 MEDIUM

- **CORS permissivo** nas edge functions (default Supabase). Sem whitelist de origin explícita.
- **`.env` na raiz** — verificar se está no `.gitignore` e nunca acompanha deploy.
- **Service role key compartilhada por 24+ edge fns** — chave monolítica.
- **Missing CSP header** — `.htaccess` define X-Frame, X-Content-Type, mas não Content-Security-Policy. Inline de entry.js exigiria nonce.
- **`role_visibility` array em `team_tasks`** — RLS confia no array; role tipada errado escapa do filtro.

### 🟢 LOW

- **Sem 2FA obrigatório** — admin pode habilitar via Supabase, mas não é forçado.
- **`payment_link` em charges sem validação** — texto livre.
- **`documents.url`/`external_url` sem validação de scheme** — `javascript:` ou `data:` poderiam ser inseridos.
- **No timing-safe** em comparações user-provided (ok hoje, futuro: tokens custom?).

### ✅ Bom

- `timingSafeEqualStr` para comparação de service role.
- `send-password-reset` é **enumeration-safe** (sempre retorna `{ ok: true }`).
- DELETE policies implícitas (Postgres default = restrictive).
- `legal_acceptance_log` imutável.
- `billing_actions_log` com idempotência.

## OWASP Top 10 — mapeamento

| Item                       | Status   | Nota                                                                            |
| -------------------------- | -------- | ------------------------------------------------------------------------------- |
| A01 Broken Access Control  | 🟠 Médio | RLS sólido; risco em `verify_jwt=false` se devs esquecerem `requireAdminAccess` |
| A02 Cryptographic Failures | 🟢 Baixo | TLS forçado no .htaccess; senhas hashed pelo Supabase                           |
| A03 Injection              | 🟢 Baixo | Supabase client parametrizado; sem SQL string-cat no front                      |
| A04 Insecure Design        | 🟠 Médio | Roles em DB ao invés de JWT (decisão consciente, com trade-off)                 |
| A05 Security Misconfig     | 🟠 Médio | Faltam CSP e CORS estritos                                                      |
| A06 Vulnerable Deps        | 🟢 Baixo | `npm audit --high` weekly via security.yml                                      |
| A07 ID & Auth              | 🟢 Baixo | Supabase Auth + first-access flow + must-change-password                        |
| A08 SW & Data Integrity    | 🟢 Baixo | Sem CDN externo de JS, audit logs imutáveis                                     |
| A09 Logging                | 🔴 Alto  | Sem Sentry/PostHog; logs só do Supabase                                         |
| A10 SSRF                   | 🟢 Baixo | Sem fetches server-side de URLs do usuário (exceto Resend, controlado)          |

## Roadmap de segurança

- Onda 1: CSP básico, Sentry, validação de URL em `documents`.
- Onda 2: 2FA admin obrigatório, scoped service-role keys, CORS allowlist.
- Onda 3: WAF (Cloudflare), pentest externo, bug bounty soft.

## Relações

- [[../04-flows/auth-flow]]
- [[../06-api/index]]
- [[../12-decisions/ADR-002-roles-in-db-not-jwt]]
- [[../13-issues/security-csp-missing]]
- [[../13-issues/security-roles-in-db]]
