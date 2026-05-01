---
title: Sem Content-Security-Policy
tags: [issue, high, security]
severity: HIGH
---

# 🔴 H4 — Sem Content-Security-Policy

## Contexto

`.htaccess` define `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, mas **não define `Content-Security-Policy`**. Aplicação inline o `entry.js` no HTML para LCP, o que exigiria nonce ou `unsafe-inline` em CSP.

## Impacto

- XSS (se houver vetor) tem **execução não restringida**. Sessão Supabase em `localStorage` torna o impacto crítico.
- Sem `frame-ancestors`, app pode ser embeddado (clickjacking) — mitigado parcialmente por `X-Frame-Options: DENY`.

## Recomendação

CSP inicial (permissivo, vai apertando):

```apache
Header set Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://*.supabase.co;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.supabase.co https://*.supabase.in;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
"
```

Próximo passo: substituir `'unsafe-inline'` por nonce gerado a cada deploy (script post-build injeta `nonce="..."` em `<script>` inlined).

## Onda

- 🟠 Onda 2.

## Relações

- [[../10-security/index]]
- [[../09-infra/hostinger-config]]
- [[../11-performance/build-pipeline]]

## Referências

- `public/.htaccess`
- `vite.config.ts` (entry inlining)
