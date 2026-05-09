---
title: Infra — MOC
tags: [infra, moc]
---

# Infra — MOC

## Notas

- [[deployment]] — Hostinger FTP + GitHub Actions
- [[github-actions]] — 4 workflows
- [[hostinger-config]] — Apache, .htaccess, headers
- [[supabase-config]] — config.toml, secrets, RLS
- [[runbook]] — incidentes comuns (cron preso, FTP fora, RLS quebrada)
- [[backup-strategy]] — Supabase auto-backup, FTP rollback

## Topologia

```
DNS (elkys.com.br)
  ├─ Hostinger (Apache, FTP)        ← bundle estático SPA
  └─ Supabase Cloud                 ← Postgres+RLS + Auth + Edge + Storage
       └─ Resend (SMTP)             ← email transacional
```

## Ambientes

| Ambiente | URL               | Branch     | Status                    |
| -------- | ----------------- | ---------- | ------------------------- |
| Produção | `elkys.com.br`    | `main`     | ativo                     |
| Develop  | (sem URL pública) | `develop`  | sem host separado — risco |
| Local    | `localhost:8080`  | feature/\* | dev                       |

⚠️ **Sem staging real** — ver [[../13-issues/no-staging-environment]].
