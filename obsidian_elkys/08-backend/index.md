---
title: Backend — MOC
tags: [backend, moc]
---

# Backend — MOC

Backend = Supabase Cloud (Postgres + Auth + Edge + Storage). Não há application server próprio.

## Notas

- [[edge-functions-architecture]] — 26 edge functions, padrões shared, secrets
- [[../05-database/erd]] — schema relacional
- [[../05-database/functions]] — funções SQL `SECURITY DEFINER`
- [[../05-database/cron-jobs]] — pg_cron jobs
- [[triggers-and-audit]] — triggers em clients, projects, charges → audit_logs
- [[storage-buckets]] — `avatars`, `email-assets`
- [[migrations-strategy]] — ~95 migrations ativas, fases PA1–PA19

## Pilares

1. **RLS é a verdade** — toda tabela com policy.
2. **Edge functions usam service role** — bypass RLS server-side.
3. **Idempotência via tabelas dedicadas** (`billing_actions_log`, `client_inadimplencia_warnings`).
4. **Audit imutável** (`legal_acceptance_log`, `audit_logs`).
5. **Cron centralizado em pg_cron**, sem queue externa.
