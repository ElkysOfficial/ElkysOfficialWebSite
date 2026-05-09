---
title: Billing Rules Flow (08h UTC)
tags: [flow, cron, billing]
---

# Billing Rules Flow

## Sequência (08h UTC, diário)

```
pg_cron 08:00 UTC
   ↓
process-billing-rules (edge fn)
   ↓
SELECT * FROM billing_rules WHERE is_active=true ORDER BY sort_order
   ↓
For each rule:
  target = today - rule.trigger_days

  trigger_days = -3 (D-3): charges with due_date = today + 3, status pendente|agendada
  trigger_days =  0 (D):   charges with due_date = today, status pendente
  trigger_days =  3 (D+3): charges with due_date = today - 3, status atrasado
  trigger_days = 15 (D+15): charges with due_date = today - 15, status atrasado

  For each charge:
    Idempotency check:
      SELECT 1 FROM billing_actions_log
       WHERE charge_id=? AND rule_id=? AND sent_at::date = today
      → if exists: skip

    template = SELECT FROM billing_templates WHERE id = rule.template_id

    body = replace_variables(template.body, {
      client_name, amount, due_date, description
    })

    sendEmail(to=client.email, subject=template.subject, html=body)

    INSERT billing_actions_log (charge_id, rule_id, template_id, sent_at, status='enviado', triggered_by='cron')
   ↓
Return { ok, sent: N, errors: M }
```

## Templates (D-3, D, D+3, D+15)

Configuráveis via UI admin (`BillingAutomation.tsx`):

| Trigger | Tom        | Conteúdo                                |
| ------- | ---------- | --------------------------------------- |
| D-3     | amigável   | "Lembrete de vencimento próximo"        |
| D       | neutro     | "Vence hoje"                            |
| D+3     | preocupado | "Atrasado, ajude-nos a regularizar"     |
| D+15    | sério      | "Aviso final, projeto pode ser pausado" |

## Manual override

Admin pode chamar com `{ singleChargeId, forceTemplateType }` para reenviar.

## Problemas Identificados

🟠 **Re-check de status entre sync 02h e régua 08h** ausente.
🟠 **Substituição de variável regex sem escape** — XSS-friendly se nome cliente contém HTML.
🟢 **Sem rate limit interno**.

Ver [[../06-api/edge-fn-process-billing-rules]] para detalhes e recomendações.

## Relações

- [[../03-features/billing-rules]]
- [[../06-api/edge-fn-process-billing-rules]]
- [[../02-domains/charges]]
- [[overdue-cron-flow]]
- [[../05-database/cron-jobs]]

## Referências

- `supabase/functions/process-billing-rules/index.ts`
- `supabase/migrations/20260423120000_billing_rules_d3_d15.sql`
