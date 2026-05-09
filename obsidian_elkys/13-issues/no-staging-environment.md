---
title: Sem ambiente staging
tags: [issue, high, infra, dx]
severity: HIGH
---

# 🔴 H8 — Sem ambiente de staging real

## Contexto

`develop` branch existe (git-flow), mas não é deployada em URL pública. PR aprovado e mergeado em `main` vai direto pra produção sem QA contra ambiente espelho.

## Impacto

- Bug que só aparece em build minificado pega cliente.
- Migrations destrutivas não têm sanity check em ambiente real.
- Time não pode "validar com cliente" antes de prod.
- Smoke check do deploy é a única defesa pós-merge.

## Recomendação

### Opção A — Hostinger subdomain

1. Criar `staging.elkys.com.br` (DNS + virtualhost no Hostinger).
2. Novo workflow `.github/workflows/deploy-staging.yml` triggered por push em `develop`.
3. Mesmo `deploy.yml` adaptado, com FTP creds separadas.

### Opção B — Vercel/Netlify para staging (recomendado)

1. Conectar `develop` branch.
2. Preview deployments por PR (ergonomia gigante).
3. Mantém produção no Hostinger.

### Em ambos os casos

- Projeto Supabase **separado** (`elkys-staging`) com schema espelhado via dump + restore.
- E2E roda contra staging em CI.

## Onda

- 🟠 Onda 2 (depende de approval do orçamento Vercel/Netlify ou subdomain).

## Relações

- [[../09-infra/deployment]]
- [[../09-infra/github-actions]]
- [[no-tests-units-integration]]
