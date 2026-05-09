---
title: Deployment
tags: [infra, deploy, ci-cd]
---

# Deployment

## Contexto

Push em `main` aciona GitHub Action que **build → 3 tentativas FTP → smoke check → notifica Discord**. Sem CDN, sem blue/green, sem rollback automático.

## Pipeline (`deploy.yml`)

```
1. Push main
   ↓
2. checkout + setup-node@20 + npm ci
   ↓
3. npm run build:min (Terser + sitemap + prerender + .htaccess)
   ↓
4. FTP upload — Attempt 1: dangerous-clean-slate=true
   │  (apaga TUDO no servidor antes de subir, fixa orphaned chunks)
   ↓
5. FTP upload — Attempt 2 (se 1 falhar): clean-slate=false
   ↓
6. FTP upload — Attempt 3 (se 2 falhar): clean-slate=false
   ↓
7. Smoke check: 12× curl https://elkys.com.br (60s entre)
   esperando 200/301/302
   ↓
8. Discord webhook: success/failure com commit, branch, run #, author
```

Action: `SamKirkland/FTP-Deploy-Action@v4.3.5`.

## Rollback manual

1. Identificar commit anterior funcional.
2. `git checkout <sha> && npm run build:min`.
3. Subir manualmente via FTP — não há botão de rollback no Action.

## Secrets do Action

| Secret                                               | Função               |
| ---------------------------------------------------- | -------------------- |
| `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`         | conexão Hostinger    |
| `DISCORD_WEBHOOK_URL`                                | notificação          |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | build-time injection |

## Problemas Identificados

🔴 **Sem ambiente staging** — `develop` não é deployado em URL separada. PR mergeada vai direto para prod. Ver [[../13-issues/no-staging-environment]].
🟠 **Smoke check superficial** — só checa root 200; pode "passar" com `/portal` quebrado. Ver [[../13-issues/smoke-check-superficial]].
🟠 **`dangerous-clean-slate=true` no primeiro deploy** — janela de ~30s onde site está vazio se algum upload falhar mid-flight.
🟢 **Sem hash de bundle integrity check** — após FTP, não há prova matemática de que arquivos chegaram intactos.

## Recomendações

1. Criar **ambiente staging**: branch `develop` faz deploy via segundo workflow para `staging.elkys.com.br` apontando para projeto Supabase distinto.
2. Smoke check robusto: validar `/portal/cliente` redirect (302 para login esperado), validar HTML retornado tem `<title>Elkys`.
3. Considerar **mover para Cloudflare Pages** ou **Netlify** — atomic deploys, rollback 1-click.
4. Adicionar **rollback action manual** no GitHub Actions (workflow_dispatch que reescala build de SHA específico).

## Relações

- [[github-actions]]
- [[../11-performance/build-pipeline]]
- [[../13-issues/no-staging-environment]]
- [[../13-issues/smoke-check-superficial]]
- [[../01-architecture/deployment-topology]]

## Referências

- `.github/workflows/deploy.yml`
- `.github/workflows/ci.yml`
