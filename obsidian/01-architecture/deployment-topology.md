---
title: Deployment Topology
tags: [architecture, infra, deployment]
---

# Deployment Topology

## Contexto

Stack monorepo single-tenant: o repositório contém o frontend, edge functions, migrations SQL e scripts de build. Não há _backend application server_; o "backend" são _edge functions Deno_ + _Postgres com RLS_.

## Descrição Técnica

```
                ┌─── DNS (elkys.com.br) ───┐
                ▼                           ▼
         Hostinger (HTTPS, .htaccess)   (FTP from CI)
                │
        SPA estática + prerender HTML
                │ (XHR)
                ▼
         Supabase Cloud (api.supabase.co)
                │
        ┌───────┼─────────────────┐
        ▼       ▼                 ▼
     Postgres  Auth          Edge Functions (Deno)
       │       │                 │
       └───────┴── Storage       └── Resend API (email)
```

### Frontend hosting (Hostinger)

- **Bundle estático** (HTML + JS + CSS + WebP) servido pelo Apache do Hostinger.
- `.htaccess` controla:
  - HTTPS forçado, www→non-www
  - Trailing slash removal (canonical)
  - SPA rewrite somente para `/portal/*` → `index.html`
  - Rotas públicas servem **HTML pré-renderizado** (DirectoryIndex)
  - Headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-Robots-Tag noindex` em `/portal/*`
  - Bot rules para Ahrefs/Semrush (crawl-delay) e validação de UA do Googlebot

### Backend (Supabase Cloud)

- **Postgres 15** com RLS habilitado em todas as tabelas (~28 tabelas).
- **Auth** com email/password; sem 2FA obrigatório.
- **Edge Functions** (26) em Deno; 11 com `verify_jwt = false` para suportar cron.
- **Storage**: buckets `avatars` (privado, RLS) e `email-assets` (público).
- **pg_cron**: 4+ jobs (financeiro, notificações, billing rules, proposal expiry).

### CI/CD (GitHub Actions)

| Workflow              | Trigger         | Ação                                                                       |
| --------------------- | --------------- | -------------------------------------------------------------------------- |
| `ci.yml`              | push/PR         | lint + typecheck + build                                                   |
| `security.yml`        | weekly + PR     | `npm audit --high --omit=dev`                                              |
| `bundle-analysis.yml` | PRs + push main | métricas gzip, artefato 30d                                                |
| `deploy.yml`          | push main       | build → 3× FTP attempts → smoke check (12 retries × 60s) → Discord webhook |

Detalhes: [[../09-infra/github-actions]].

### Email (Resend)

- Todas as edge functions de email (`send-*`) usam Resend.
- Secrets: `RESEND_API_KEY`, `FROM_EMAIL`, `PORTAL_URL`, `TICKET_NOTIFY_EMAILS`, `INVOICE_DAYS_BEFORE`.

## Problemas Identificados

🔴 **Single point of failure no FTP** — se Hostinger cair, sem fallback (nada em CDN/Cloudflare).
🔴 **Sem ambiente de staging real** — `develop` branch existe mas não há host separado. Risco de regressão indo direto para `main`.
🟠 **Smoke check do deploy é HTTP-only** — não valida JS/CSS hash nem rota `/portal`. Possível "deploy verde" com bundle quebrado.
🟠 **CSP ausente** — `.htaccess` define X-Frame e X-Content-Type, mas nenhum `Content-Security-Policy`. Inline de entry.js exigiria nonce.
🟢 **Service role key isolada nos secrets do Supabase** — risco baixo, mas chave monolítica (todas permissões).

## Impacto

- Iteração rápida e custo baixo.
- Rollback é manual: subir build anterior via FTP (não há blue/green).
- Observabilidade prod = logs do Supabase + reports manuais.

## Recomendações

1. Adicionar **Cloudflare** na frente do Hostinger (cache + DDoS + WAF leve).
2. Criar ambiente `staging.elkys.com.br` apontando para projeto Supabase separado.
3. Smoke check pós-deploy validar **bundle hash** e rota `/portal/cliente` (200 esperado mesmo sem auth, redirect para login).
4. Definir CSP mesmo que permissivo no início; iterar para restritivo.

## Relações

- [[system-overview]]
- [[../09-infra/deployment]]
- [[../09-infra/github-actions]]
- [[../11-performance/build-pipeline]]
- [[../12-decisions/ADR-005-manualchunks-pitfall]]

## Referências

- `.github/workflows/deploy.yml`
- `.github/workflows/ci.yml`
- `public/.htaccess`
- `vite.config.ts`
- `supabase/config.toml`
