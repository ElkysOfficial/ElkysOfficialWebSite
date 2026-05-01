---
title: Cron Jobs (pg_cron)
tags: [database, cron, automation]
---

# Cron Jobs (pg_cron)

## Contexto

Toda automação temporal vive em pg_cron + edge functions Deno. Não há filas (sem Redis/SQS); idempotência é garantida via constraints e `billing_actions_log`.

## Inventário

| Job                           | Schedule (UTC) | Trigger        | Função / Edge fn                                                         | Idempotência                                       |
| ----------------------------- | -------------- | -------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| Auto-mark inadimplente + sync | `0 2 * * *`    | pg_cron        | `sync_financial_blocks()` (SQL)                                          | promove status → idempotente                       |
| Invoice reminders D-3         | `0 9 * * *`    | pg_cron → edge | `send-invoice-due`                                                       | filtro por `due_date = hoje + INVOICE_DAYS_BEFORE` |
| Billing rules (régua)         | `0 8 * * *`    | pg_cron → edge | `process-billing-rules`                                                  | `billing_actions_log`                              |
| Scheduled notifications       | `*/5 * * * *`  | pg_cron → edge | `process-scheduled-notifications`                                        | flag `status='enviada'`                            |
| Proposal expiry mark          | diário         | pg_cron → edge | `expire-proposals`                                                       | re-check `status='enviada'`                        |
| Proposal expiry warning       | diário         | pg_cron → edge | `send-proposal-expiry-warning`                                           | flag template + log                                |
| Inadimplência warnings        | diário         | pg_cron → SQL  | `reconcile_inadimplencia_warnings()` + edge `send-inadimplencia-warning` | tabela `client_inadimplencia_warnings`             |
| Overdue client actions        | diário         | pg_cron → edge | `check-overdue-client-actions`                                           | revisa `project_next_steps`                        |

## Sequência diária canônica

```
00:00 UTC ── nada
02:00 UTC ── sync_financial_blocks()
              ├── mark_overdue_charges()
              └── sync_projects_from_blocking_charges()
08:00 UTC ── process-billing-rules (régua D-3, D, D+3, D+15)
09:00 UTC ── send-invoice-due (D-3 padrão, configurável)
... (a cada 5min) ── process-scheduled-notifications
diário variavel ── expire-proposals, send-proposal-expiry-warning,
                   reconcile_inadimplencia_warnings
```

## Problemas Identificados

🔴 **Sem dead-letter queue / alerting** — se `process-billing-rules` falhar, ninguém é notificado. Apenas logs do Supabase.
🟠 **Sequência horária frágil** — se `sync_financial_blocks` (02h) demorar e cruzar 08h, `process-billing-rules` pode rodar com snapshot inconsistente.
🟠 **Sem timezone explícito** — pg_cron roda em UTC; a lógica de "hoje" usa `CURRENT_DATE` (database timezone). Verificar se estão alinhados.
🟢 **Sem visibilidade de "última execução com sucesso"** em UI admin.

## Recomendações

1. Tabela `cron_run_log(job_name, started_at, ended_at, status, error)` populada pelo wrapper de cada cron.
2. Painel admin "Saúde de automações" com último run + warning visual se >24h sem sucesso.
3. Webhook Discord/Slack em falha de cron (o `deploy.yml` já tem padrão).
4. Definir explicitamente `timezone = 'UTC'` na DB ou ajustar `CURRENT_DATE` para `(now() AT TIME ZONE 'America/Sao_Paulo')::date` se for política.

## Relações

- [[../06-api/edge-fn-process-billing-rules]]
- [[../06-api/edge-fn-send-invoice-due]]
- [[../06-api/edge-fn-process-scheduled-notifications]]
- [[../06-api/edge-fn-expire-proposals]]
- [[../04-flows/overdue-cron-flow]]
- [[../03-features/billing-rules]]
- [[../13-issues/cron-observability]]

## Referências

- Migrations `supabase/migrations/*_cron_*`
- `supabase/functions/process-billing-rules/index.ts`
- `supabase/functions/process-scheduled-notifications/index.ts`
