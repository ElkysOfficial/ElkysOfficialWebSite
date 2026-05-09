---
title: System Overview
tags: [architecture, overview, moc]
aliases: [Architecture, Visão Geral Arquitetural]
---

# System Overview

## Contexto

Elkys é uma **software house brasileira** que opera com poucos clientes de alto valor, contratos longos e projetos com mensalidade + entrada/entrega 50/50. A plataforma serve três audiências:

1. **Visitantes** (site público de marketing/SEO).
2. **Equipe interna** (portal admin: CRM, propostas, contratos, financeiro, projetos, suporte, marketing, equipe).
3. **Clientes** (portal cliente: projetos em andamento, propostas para aprovar, contratos para assinar, cobranças, suporte).

A escolha por **SPA + Supabase Cloud** privilegia _time-to-market_ e custo operacional baixo (~zero infra própria).

## Descrição Técnica

### Stack

| Camada       | Tecnologia                                     | Versão      |
| ------------ | ---------------------------------------------- | ----------- |
| Frontend     | React + TypeScript                             | 18.3 / 5.5  |
| Bundler      | Vite + SWC                                     | 7.3 / 3.5   |
| Roteamento   | React Router                                   | 6.26        |
| Server state | TanStack Query                                 | 5.56        |
| Forms        | react-hook-form + zod                          | 7.53 / 3.23 |
| Estilo       | Tailwind CSS + CVA + tailwind-merge            | 3.4         |
| Backend      | Supabase (Postgres 15 + Auth + Edge + Storage) | Cloud       |
| Edge runtime | Deno (Supabase Edge Functions)                 | —           |
| Email        | Resend API                                     | —           |
| Hosting      | Hostinger (FTP estático)                       | —           |
| CI/CD        | GitHub Actions                                 | —           |
| Testing      | Playwright (E2E only)                          | 1.59        |

### Topologia

```
┌──────────────────── Browser ────────────────────┐
│  React SPA (bundle estático Hostinger)          │
│   ┌─────────┐  ┌──────────┐  ┌──────────────┐   │
│   │ Public  │  │ Admin    │  │ Cliente      │   │
│   │ Site    │  │ Portal   │  │ Portal       │   │
│   └─────────┘  └──────────┘  └──────────────┘   │
└────────────────────┬────────────────────────────┘
                     │ HTTPS + JWT
        ┌────────────▼─────────────┐
        │     Supabase Cloud       │
        │  Postgres (RLS) · Auth   │
        │  Edge Functions · Storage│
        └────────────┬─────────────┘
                     │ Resend
                  📧 SMTP
```

Mais detalhe em [[deployment-topology]].

### Princípios fundadores

1. **RLS é a verdade** — guards de rota são UX, segurança real está nas policies do Postgres. Ver [[10-security/rls-model]].
2. **Sem libs UI de terceiros** — design system 100% autoral. Ver [[ADR-001-no-third-party-ui]].
3. **Lazy-load em todas as páginas** — `React.lazy()` + `Suspense`. Ver [[07-frontend/routing]].
4. **Português brasileiro** em todo conteúdo, labels, enums, nomes de tabela.
5. **manualChunks por arquivo, não por objeto** — após gotcha v2.83.4. Ver [[ADR-005-manualchunks-pitfall]].
6. **Deploy via push em `main`** — GitHub Actions → FTP. Ver [[09-infra/deployment]].

### Camadas

- **Pages** (`src/pages/`) — componentes de rota lazy-loaded. Cada página é o "controller" da sua tela.
- **Components** (`src/components/`) — agrupados por domínio (`portal/admin`, `portal/client`, `portal/project`, etc.). Ver [[07-frontend/components-tree]].
- **Design System** (`src/design-system/`) — Button, Card, Input, etc. + primitives. Tokens em `src/styles/_tokens.scss`. Ver [[07-frontend/design-system]].
- **Hooks** (`src/hooks/`) — lógica reutilizável (`useAuth`, `useUrlState`, `useFormDraftAutoSave`, etc.). Ver [[07-frontend/hooks]].
- **Lib** (`src/lib/`) — domínio puro (`portal-data.ts`, `portal-access.ts`, `subscription-charges.ts`, `timeline.ts`, `profile.ts`, `masks.ts`).
- **Integrations** (`src/integrations/supabase/`) — cliente Supabase + tipos gerados.
- **Contexts** (`src/contexts/`) — apenas `AuthContext`. Tudo resto via React Query.

### Build pipeline

| Modo        | Minificador   | console.\* | Uso      |
| ----------- | ------------- | ---------- | -------- |
| `build`     | esbuild       | mantido    | staging  |
| `build:min` | Terser 2-pass | removido   | produção |
| `build:dev` | nenhum        | mantido    | debug    |

Pós-build sempre roda: `generate-sitemap.cjs`, `prerender.cjs`, `copy-htaccess.cjs`. Ver [[11-performance/build-pipeline]].

## Problemas Identificados

🔴 **Sem testes unitários nem de integração** — apenas E2E Playwright (21 cenários). Risco em refactors de `lib/portal-data.ts` e funções SQL.

🔴 **Sem observabilidade em produção** — sem Sentry/PostHog/error tracking. Erros 500 só são vistos via reporte do cliente.

🟠 **TanStack Query sem `staleTime`** — `refetchOnWindowFocus: true` causa requests redundantes em portais com janelas abertas.

🟠 **Acoplamento entre `lib/portal-data.ts` e UI** — funções compõem queries específicas para páginas; refator de UI quebra data layer.

🟢 **Edge Functions com cópia de helpers** — `_shared/` reduz, mas algumas funções ainda têm `corsHeaders` inline.

## Impacto

- Velocidade de iteração alta (deploy em <5min do push).
- Custo operacional muito baixo (Supabase free/pro + Hostinger).
- **Mas** debilidade em rastreabilidade e cobertura de testes faz cada release ser uma aposta de equipe pequena.

## Recomendações

1. Adicionar **Sentry** (browser + edge) — onda 3 do [[../14-roadmap/index|roadmap]].
2. Introduzir **Vitest** para `lib/` e `hooks/` (camadas puras).
3. Padronizar `staleTime: 30_000` global no `queryClient`; opt-in para tempo real.
4. Migrar helpers de `lib/portal-data.ts` para queries colocadas com cada página (RSC-style boundaries).
5. Documentar **runbook** de incidente (cron preso, RLS quebrada, FTP fora) em [[09-infra/runbook]] (a criar).

## Relações

- [[../05-database/erd|ERD do banco]]
- [[../07-frontend/routing|Roteamento]]
- [[../07-frontend/design-system|Design System]]
- [[../09-infra/deployment|Deploy]]
- [[../12-decisions/index|Decisões arquiteturais]]

## Referências

- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `vite.config.ts`
- `package.json`
- `docs/ARCHITECTURE.md`
