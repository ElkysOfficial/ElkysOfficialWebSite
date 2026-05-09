---
title: Domínio — Charges
tags: [domain, charges, financial, pivot]
---

# Domínio — Charges

## Contexto

`charges` é o coração do módulo financeiro: toda cobrança individual (parcela, mensalidade, avulsa) vive aqui. Esta é a tabela com **mais policies, mais triggers e mais cron jobs tocando**.

## Descrição Técnica

### Estrutura

| Campo                                              | Função                                                                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `client_id`, `project_id`                          | FK; project nullable                                                                                      |
| `contract_id`, `installment_id`, `subscription_id` | apenas um dos dois últimos é populado (XOR enforced)                                                      |
| `origin_type`                                      | `parcela_projeto`, `mensalidade`, `manual`                                                                |
| `description`, `amount`, `due_date`                | dados da cobrança                                                                                         |
| `status`                                           | enum `invoice_status`: `agendada` (futura), `pendente` (a vencer/no dia), `pago`, `atrasado`, `cancelado` |
| `is_blocking`                                      | bloqueia projeto se atrasado                                                                              |
| `is_historical`                                    | importadas; ignoradas por automações                                                                      |
| `paid_at`, `payment_reference`, `payment_link`     | dados de pagamento                                                                                        |

### Constraint XOR

Migration `20260415210000_charges_subscription_xor_installment.sql`: `installment_id IS NULL OR subscription_id IS NULL` — uma `charge` é parcela **ou** mensalidade, nunca ambas. Origin `manual` deixa ambos NULL.

### Ciclo de vida do status

```
[criação]
  due_date > hoje → agendada
  due_date <= hoje → pendente
       │
       ▼ (cron diário 02h)
  due_date < hoje → atrasado    [via mark_overdue_charges()]
       │
       ▼ (admin marca pago)
  pago + paid_at + send-installment-paid email
```

### Triggers e jobs

- `mark_overdue_charges()` — cron diário 02h UTC (job _Auto-mark inadimplente_).
- `sync_projects_from_blocking_charges()` — cron 02h, pausa/retoma projetos.
- `sync_financial_blocks()` — wrapper executado pelo cron.
- `send-invoice-due` — cron 09h UTC, email D-3 antes do vencimento.
- `process-billing-rules` — cron 08h UTC, regra D+3, D+15 (ver [[../03-features/billing-rules]]).
- `send-installment-paid` — disparada pelo admin ao marcar pago.

### Idempotência da régua

`billing_actions_log` tem unique implicit em `(charge_id, rule_id, template_id, sent_at::date)` — garantia de não enviar 2 emails do mesmo gatilho no mesmo dia.

### RLS

| Quem                               | SELECT                        | UPDATE  |
| ---------------------------------- | ----------------------------- | ------- |
| `is_admin` ou `has_finance_access` | ✅ tudo                       | ✅ tudo |
| Equipe geral                       | ✅                            | ❌      |
| Cliente                            | apenas próprias (`client_id`) | ❌      |

## Problemas Identificados

🔴 **`charges` é a tabela mais "tocada"** — qualquer mudança de schema cascateia em ≥3 cron, ≥4 edge functions, ≥2 páginas (admin Finance + cliente Finance). Risk hotspot por excelência.

🟠 **Status `agendada` versus `pendente`**: a transição depende de **abrir a página Finance** (sync no front-end) ou de cron. Se ninguém abrir Finance e cron falhar, charges ficam em `agendada` mesmo após `due_date`.

- Solução: o cron `mark_overdue_charges()` deveria também promover `agendada → pendente`.

🟠 **`is_historical` filtragem inconsistente** — algumas queries esquecem `is_historical = false` (ex: `loadChargesForClient` retorna histórico). Causa "duplo" em totalizações de KPI.

🟢 **`payment_link` sem validação de URL** — texto livre. Cliente pode receber link malformado.

## Impacto

- Bug em `charges` impacta cobrança real → fricção financeira com cliente.
- Migrations devem sempre rodar em horário de baixa atividade (manhã).
- Refator do schema exige checklist cross-team (FE + cron + emails).

## Recomendações

1. **Promover `agendada → pendente` no cron** das 02h, não só na abertura do Finance.
2. **Centralizar filtro `is_historical = false`** em uma helper (`activeCharges()`).
3. Adicionar **validação Zod** de `payment_link` antes de UPDATE no admin.
4. Criar **dashboard de saúde** de charges em AuditLog (count por status × idade).

## Relações

- [[clients]]
- [[projects]]
- [[project-installments]]
- [[project-subscriptions]]
- [[../03-features/billing-rules]]
- [[../04-flows/overdue-cron-flow]]
- [[../04-flows/pause-resume-flow]]
- [[../06-api/edge-fn-send-invoice-due]]
- [[../06-api/edge-fn-process-billing-rules]]
- [[../06-api/edge-fn-send-installment-paid]]

## Referências

- `supabase/migrations/20260415210000_charges_subscription_xor_installment.sql`
- `src/pages/admin/Finance.tsx`
- `src/pages/client/Finance.tsx`
- `src/lib/portal-data.ts` → `loadChargesForClient`, `loadChargesForProject`
- `src/lib/subscription-charges.ts`
