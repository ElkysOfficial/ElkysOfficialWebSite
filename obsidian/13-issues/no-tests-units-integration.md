---
title: Sem testes unitários/integração
tags: [issue, high, testing]
severity: HIGH
---

# 🔴 H2 — Sem testes unitários ou de integração

## Contexto

A única cobertura é **Playwright E2E** (1 arquivo, 8 personas, ~21 cenários serial). Nenhum Vitest, Jest, Testing Library. `lib/` (portal-data, masks, finance-metrics, timeline) e `hooks/` são camadas puras testáveis sem teste.

## Impacto

- Refator de `mark_overdue_charges` não tem rede de proteção.
- Mudança em `cn()` ou `formatBRDate` pode regredir silenciosamente.
- Mudança em RLS policy só é "vista" pelo usuário em produção.
- E2E é caro (~3-5 min por run) e flaky em ambiente compartilhado.

## Recomendação

### Vitest para `lib/` e `hooks/`

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Cobertura inicial:

- `lib/masks.ts` (CPF/CNPJ/phone, isValidCPF, formatBRDate) — 30 min, alta confiança.
- `lib/finance-metrics.ts` (computeBurnRate, computeRunway, computeOperationalMargin) — invariantes claras.
- `lib/portal.ts` (PROPOSAL_TRANSITIONS, state machines).
- `hooks/useUrlState.ts` (input/output de search params).
- `hooks/useFormDraftAutoSave.ts`.

### pgTAP (opcional) para SQL functions

`mark_overdue_charges`, `sync_projects_from_blocking_charges`, `get_client_id_for_portal_user` — funções críticas com lógica.

### CI

Adicionar step `npm test` em `ci.yml`. Exigir verde em PR.

## Onda

- 🟠 Onda 2.

## Relações

- [[../11-performance/build-pipeline]]
- [[../09-infra/github-actions]]
- [[../14-roadmap/index]]
