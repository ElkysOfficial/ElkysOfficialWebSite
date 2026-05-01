---
title: Sem observabilidade em produção
tags: [issue, high, observability]
severity: HIGH
---

# 🔴 H1 — Sem observabilidade em produção

## Contexto

Não há Sentry, PostHog, LogRocket, Datadog ou similar. Logs do front-end ficam apenas no browser do usuário; logs do backend ficam apenas no Supabase Dashboard. Erros 500 só são vistos por reporte humano.

## Impacto

- **Visibilidade zero** de erros JS em produção (TypeError, Promise rejection, ChunkLoadError pós-deploy).
- **Sem rastreabilidade** de fluxos: "quantos clientes apertaram aceitar contrato esta semana?".
- **Tempo de detecção de incidente** = tempo até cliente reclamar.
- **Cron silenciosamente falhando** ([[cron-observability]]) é caso particular deste problema.

## Recomendação

### Sentry browser

```ts
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
  tracesSampleRate: 0.1,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
});
```

Wrap `RootErrorBoundary` com `Sentry.ErrorBoundary`.

### Sentry edge

Adicionar `@sentry/deno` em `_shared/sentry.ts`; cada edge function importa e captura erros do try/catch.

### PostHog (opcional, onda 3)

Eventos de produto: `proposal_approved`, `contract_signed`, `payment_marked_paid`.

## Onda

- 🟠 Onda 2 — Sentry crítico antes de qualquer expansão.

## Relações

- [[cron-observability]]
- [[../14-roadmap/index]]
- [[../12-decisions/ADR-003-supabase-cloud]]
