---
title: Enums
tags: [database, enums]
---

# Enums

| Enum                          | Valores                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `app_role`                    | `admin_super`, `admin`, `cliente`, `comercial`, `juridico`, `financeiro`, `po`, `developer`, `designer`, `marketing`, `support` |
| `project_status`              | `negociacao`, `em_andamento`, `pausado`, `concluido`, `cancelado`                                                               |
| `billing_type`                | `mensal`, `projeto`                                                                                                             |
| `invoice_status`              | `agendada`, `pendente`, `pago`, `atrasado`, `cancelado`                                                                         |
| `document_type`               | `contrato`, `aditivo`, `nota_fiscal`, `codigo_fonte`, `outro`                                                                   |
| `project_pause_reason`        | `financeiro`, `dependencia_cliente`, `interno`, `escopo`, `outro`                                                               |
| `pause_source`                | `automatico`, `manual`                                                                                                          |
| `contract_record_status`      | `rascunho`, `ativo`, `encerrado`, `cancelado`                                                                                   |
| `payment_model`               | `50_50`                                                                                                                         |
| `project_installment_type`    | `entrada`, `entrega`                                                                                                            |
| `project_installment_status`  | `agendada`, `pendente`, `paga`, `atrasada`, `cancelada`                                                                         |
| `project_installment_trigger` | `assinatura`, `conclusao`, `data_fixa`                                                                                          |
| `subscription_status`         | `agendada`, `ativa`, `pausada`, `encerrada`                                                                                     |
| `document_visibility`         | `cliente`, `interno`, `ambos`                                                                                                   |
| `next_step_owner`             | `elkys`, `cliente`, `compartilhado`                                                                                             |
| `next_step_status`            | `pendente`, `em_andamento`, `concluido`, `cancelado`                                                                            |

## Como adicionar novo valor

```sql
ALTER TYPE app_role ADD VALUE 'novo_role';
```

⚠️ Não pode ser feito dentro de transação. Migration deve ser standalone (sem outras DDL antes/depois).

## Pontos a sincronizar ao adicionar role

1. Migration `ALTER TYPE app_role ADD VALUE`
2. Regenerar types: `supabase gen types`
3. `src/contexts/AuthContext.tsx` → flag `isTeamMember` (manual union)
4. `src/lib/portal-access.ts` → `getDefaultAdminRoute`
5. `docs/PERMISSIONS.md` → matriz
6. RLS policies relevantes (se for role privilegiado)
7. `_shared/auth.ts` (helpers `requireXxxAccess`)

Ver [[../13-issues/is-team-member-flag-manual-union]].
