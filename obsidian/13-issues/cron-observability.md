---
title: Sem observabilidade de crons
tags: [issue, medium, observability]
severity: MEDIUM
---

# 🟠 M4 — Sem observabilidade de cron jobs

## Contexto

Os 4+ cron jobs (`sync_financial_blocks`, `process-billing-rules`, `process-scheduled-notifications`, `expire-proposals`) executam diariamente. Não há tabela de execução nem alerting em falha.

## Impacto

- Cron falhar = inadimplência não detectada, lembretes não enviados, propostas não expiram.
- Diagnóstico: ler logs do Supabase manualmente. Tempo até detectar = >24h fácil.

## Recomendação

### Tabela `cron_run_log`

```sql
CREATE TABLE cron_run_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text CHECK (status IN ('running', 'success', 'error')),
  error_message text,
  metrics jsonb DEFAULT '{}'
);

CREATE INDEX ON cron_run_log (job_name, started_at DESC);
```

Wrapper SQL:

```sql
CREATE OR REPLACE FUNCTION run_cron_with_log(
  job_name text, fn_name regprocedure
) RETURNS void AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO cron_run_log (job_name, status)
  VALUES (job_name, 'running') RETURNING id INTO log_id;

  BEGIN
    EXECUTE 'SELECT ' || fn_name::text || '()';
    UPDATE cron_run_log SET ended_at=now(), status='success' WHERE id=log_id;
  EXCEPTION WHEN OTHERS THEN
    UPDATE cron_run_log SET ended_at=now(), status='error', error_message=SQLERRM
    WHERE id=log_id;
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;
```

### Alerting

- Edge fn `cron-health-check` que roda 5min após cada cron-alvo.
- Se último run > 24h ou status='error' → POST Discord webhook.
- Reusar webhook do `deploy.yml`.

### UI admin

- Painel "Saúde de automações" lista último run + status + métricas (sent count, error count).

## Onda

- 🟠 Onda 2.

## Relações

- [[../05-database/cron-jobs]]
- [[no-observability]]
- [[../03-features/billing-rules]]
