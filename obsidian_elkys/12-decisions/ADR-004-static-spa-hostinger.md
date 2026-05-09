---
title: ADR-004 — SPA estática + Hostinger via FTP
tags: [adr, infra]
status: accepted
---

# ADR-004 — SPA estática + Hostinger via FTP

## Contexto

Site Elkys precisa de hospedagem 24/7 com domínio próprio, baixo custo, sem SSR. SEO depende de prerender de rotas públicas. Time minúsculo, sem DevOps dedicado.

## Decisão

Hospedar bundle estático SPA no **Hostinger** (Apache, FTP). Push em `main` aciona GitHub Action que faz upload via FTP.

## Alternativas

| Opção               | Por que não                                                                           |
| ------------------- | ------------------------------------------------------------------------------------- |
| Vercel              | $20/mo+ por domínio comercial; bundle pequeno hoje não exige edge functions de Vercel |
| Netlify             | Similar; conta unificada com Hostinger é mais simples para a empresa                  |
| Cloudflare Pages    | Boa, foi cogitada; Hostinger já estava contratado                                     |
| AWS S3 + CloudFront | Custo de tempo de configuração + IAM + CloudFront é alto                              |

## Consequências

### Positivas

- $5–10/mo de hosting incluído na conta Hostinger existente.
- Apache + .htaccess familiar.
- 100% controle do servidor.

### Negativas

- **Sem CDN geográfico** — usuário em Manaus puxa de servidor único.
- **Sem rollback de 1 click** — manual via FTP.
- **Sem atomic deploys** — `dangerous-clean-slate=true` cria janela de site vazio.
- **Smoke check superficial** — apenas curl 200.
- **Sem preview deployments por PR** — toda validação local ou em prod.

## Trigger de revisão

- 1k+ visitantes/dia em landing.
- Time crescer pra >5 devs (PRs paralelos exigem previews).
- Custo Vercel/Netlify cair abaixo do diferencial de produtividade.

## Relações

- [[../09-infra/deployment]]
- [[../09-infra/hostinger-config]]
- [[../13-issues/no-staging-environment]]
- [[../13-issues/smoke-check-superficial]]

## Referências

- `.github/workflows/deploy.yml`
- `public/.htaccess`
