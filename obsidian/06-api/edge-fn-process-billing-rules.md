---
title: Edge fn — process-billing-rules
tags: [edge-fn, cron, billing]
---

# Edge fn — `process-billing-rules`

## Contexto

Coração da régua de cobrança. Roda diário às **08h UTC** via pg_cron e pode ser disparado manualmente pelo admin.

## Spec

| Campo        | Valor                                               |
| ------------ | --------------------------------------------------- |
| Path         | `supabase/functions/process-billing-rules/index.ts` |
| `verify_jwt` | `false`                                             |
| Auth         | Bearer admin OU service role (cron)                 |
| Schedule     | `0 8 * * *` (UTC)                                   |
| Idempotência | `billing_actions_log`                               |

## Payload

```json
{ "triggered_by": "manual" | "cron",
  "singleChargeId": "uuid?",
  "forceTemplateType": "string?" }
```

## Fluxo

```
1. Carrega billing_rules (is_active=true) ORDER BY sort_order
2. Para cada rule:
   target_date = today - rule.trigger_days
   ├─ trigger_days = -3 → buscar charges due_date = today + 3 (status pendente|agendada)
   ├─ trigger_days =  0 → buscar charges due_date = today (status pendente)
   └─ trigger_days =  3 → buscar charges due_date = today - 3 (status atrasado)
3. Para cada charge encontrada:
   3.1 SELECT billing_actions_log WHERE charge_id=? AND rule_id=? AND sent_at::date=today
       Se existe → skip (idempotência)
   3.2 SELECT billing_templates WHERE id = rule.template_id
   3.3 Substituir variáveis: {{client_name}}, {{amount}}, {{due_date}}, {{description}}
   3.4 buildEmail() + sendEmail() via Resend
   3.5 INSERT billing_actions_log (charge_id, rule_id, template_id, sent_at, status, triggered_by)
4. Retorna { ok, sent, errors }
```

## Problemas Identificados

🟠 **Re-check de `charges.status` antes de enviar** ausente — janela de 6h entre cron 02h (mark_overdue) e 08h (régua). Charge pode ser marcada paga manualmente entre as 02h e 08h e ainda receber lembrete.

🟠 **Substituição de variável via regex simples** — não escapa HTML; se `client_name` contiver `<script>`, vai cru no email.

🟢 **Sem rate limit em loop interno** — para 1000 charges, 1000 chamadas Resend em série.

## Recomendações

1. Antes de enviar email, re-fetch `charges` e validar `status` ainda corresponde ao esperado pela regra.
2. Substituir regex por `escapeAndFormat` (já em `_shared/validation.ts`).
3. Bulk send via Resend Batch API.

## Relações

- [[../03-features/billing-rules]]
- [[../04-flows/billing-rules-flow]]
- [[../02-domains/charges]]
- [[../05-database/cron-jobs]]

## Referências

- `supabase/functions/process-billing-rules/index.ts`
- `supabase/migrations/20260423120000_billing_rules_d3_d15.sql`
- `supabase/migrations/20260410100000_billing_log_idempotency.sql`
