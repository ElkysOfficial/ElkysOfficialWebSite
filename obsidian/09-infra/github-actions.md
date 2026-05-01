---
title: GitHub Actions
tags: [infra, ci-cd]
---

# GitHub Actions

| Workflow              | Trigger                | Steps                                                               |
| --------------------- | ---------------------- | ------------------------------------------------------------------- |
| `ci.yml`              | push, PR               | checkout → node@20 → npm ci → lint → typecheck → build (sem testes) |
| `security.yml`        | weekly Mon 9h UTC + PR | `npm audit --high --omit=dev`                                       |
| `bundle-analysis.yml` | PR + push main         | build → métricas gzip → artefato 30d                                |
| `deploy.yml`          | push main              | build:min → FTP 3× → smoke → Discord                                |

## CI (`ci.yml`)

```
- npm ci
- npm run format:check (Prettier)
- npx eslint .
- tsc --noEmit
- npm run build (sem MINIFY)
```

Sem `npm run test:e2e` no CI — Playwright roda só local (depende de credenciais reais).

## Security (`security.yml`)

```yaml
on: { schedule: [{ cron: '0 9 * * 1' }], pull_request }
- npm ci
- npm audit --omit=dev --audit-level=high
```

Falha o workflow se houver HIGH/CRITICAL.

## Bundle analysis (`bundle-analysis.yml`)

- Build → captura `stats.html` + `dist/` sizes (gzip).
- Sobe artefato com retenção 30 dias.
- Comenta no PR com diff de tamanho vs base.

## Deploy

Detalhe completo em [[deployment]].

## Problemas Identificados

🔴 **Sem testes E2E em CI** — bug de fluxo Lead→Expansion (21 testes Playwright) só pega local antes de PR.
🟠 **Bundle-analysis sem threshold** — não falha se PR cresce o bundle 30%.
🟢 **Sem cache de `~/.npm`** consistente entre workflows — npm ci roda do zero.

## Recomendações

1. Adicionar **Playwright em CI** com Supabase staging (após criar) e secrets dedicados.
2. Threshold de bundle: PR falha se aumento > 5% em main bundle.
3. Cache de `node_modules` ou pnpm para reduzir 30s/run.

## Relações

- [[deployment]]
- [[../13-issues/no-tests-units-integration]]

## Referências

- `.github/workflows/`
