---
title: Feature — Régua de Cobrança
tags: [feature, billing, automation]
---

# Feature — Régua de Cobrança Automática

## Contexto

Reduz fricção financeira via emails programados ao cliente em pontos da timeline da cobrança (antes, no dia, depois do vencimento). Substitui o trabalho manual do financeiro de "lembrar quem tá pra vencer".

## Descrição Técnica

### Componentes

| Camada   | Artefato                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| Tabela   | `billing_rules` (regra), `billing_templates` (template de email), `billing_actions_log` (histórico/idempotência) |
| Edge fn  | [[../06-api/edge-fn-process-billing-rules]] (cron 08h UTC)                                                       |
| UI admin | `src/pages/admin/BillingAutomation.tsx`                                                                          |
| Trigger  | pg_cron + botão "Executar régua agora" (manual)                                                                  |

### Modelo de regra

```
billing_rules
  trigger_days  ← negativo = antes do vencimento
                  zero     = no dia
                  positivo = depois do vencimento
  action_type   ← 'email' | 'notificacao'
  template_id   ← FK billing_templates
  sort_order    ← ordem de execução
```

Padrão atual (migration `20260423120000_billing_rules_d3_d15`):

- D-3 (3 dias antes) → "lembrete amigável"
- D+0 → "vence hoje"
- D+3 → "atrasado, ajude-nos a regularizar"
- D+15 → "aviso final, projeto pode ser pausado"

### Templates

`billing_templates.body` aceita variáveis: `{{client_name}}`, `{{amount}}`, `{{due_date}}`, `{{description}}`. Substituição feita no `process-billing-rules` via regex simples.

### Idempotência

`billing_actions_log` registra `(charge_id, rule_id, template_id, sent_at)`. Antes de enviar, a função verifica se há log do mesmo dia para a mesma regra e mesma cobrança — se sim, skip.

⚠️ **Assumido:** unique constraint em `(charge_id, rule_id, sent_at::date)` ou check no código. Validar.

### Manual override

Admin pode invocar `process-billing-rules` com `{ singleChargeId, forceTemplateType }` para reenviar ou disparar manualmente.

## Problemas Identificados

🟠 **Sem painel de "regra X disparou Y vezes"** — `billing_actions_log` existe mas BillingAutomation.tsx não mostra agregado.
🟠 **Risco de "carta D-3" para charge marcada paga entre 02h (sync) e 08h (régua)** — janela curta de 6h, mas existe.
🟢 **Templates sem preview visual antes de salvar** — admin escreve HTML "no escuro".

## Recomendações

1. Adicionar agregado de envios por regra (últimos 30d) na BillingAutomation.
2. `process-billing-rules` re-checar `charges.status` imediatamente antes de enviar (evita lembrete pra paga).
3. Adicionar **preview de template** com substituição de variáveis sample.

## Relações

- [[../02-domains/charges]]
- [[../05-database/cron-jobs]]
- [[../06-api/edge-fn-process-billing-rules]]
- [[../04-flows/billing-rules-flow]]
- [[invoice-reminders]]
- [[financial-blocks]]

## Referências

- `supabase/migrations/20260423120000_billing_rules_d3_d15.sql`
- `supabase/migrations/20260410100000_billing_log_idempotency.sql`
- `supabase/functions/process-billing-rules/index.ts`
- `src/pages/admin/BillingAutomation.tsx`
