---
title: Domínio — Proposals
tags: [domain, proposals, sales]
---

# Domínio — Proposals

## Contexto

Documento que precede contrato. Pode ser endereçada a `client_id` (cliente existente) **ou** `lead_id` (lead). XOR enforced em migration.

## Estrutura

| Campo                                                          | Função                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------- |
| `client_id`, `lead_id`                                         | XOR — uma das duas                                         |
| `title`, `scope_summary`, `payment_conditions`, `observations` | conteúdo                                                   |
| `total_amount`                                                 | numeric                                                    |
| `status`                                                       | `rascunho`, `enviada`, `aprovada`, `rejeitada`, `expirada` |
| `valid_until`                                                  | data de expiração                                          |
| `document_url`                                                 | link externo (Google Drive, PDF)                           |
| `sent_at`, `approved_at`, `rejected_at`                        | timestamps de transição                                    |
| `rejection_reason`                                             | preenchido ao rejeitar                                     |

## State machine

```
rascunho ──admin envia──▶ enviada
                         │
                         ├── cliente aprova ──▶ aprovada
                         ├── cliente rejeita ──▶ rejeitada
                         └── cron expira ─────▶ expirada (se valid_until < hoje)
```

`PROPOSAL_TRANSITIONS` em `src/lib/portal.ts` define transições válidas.

## RLS

| Quem                | SELECT              | UPDATE                                     |
| ------------------- | ------------------- | ------------------------------------------ |
| Admin / `comercial` | full                | full                                       |
| Cliente             | status ≠ `rascunho` | aprovar/rejeitar quando status = `enviada` |

## Crons

- `expire-proposals` — diário; UPDATE status = `expirada` WHERE `valid_until < CURRENT_DATE` AND `status = 'enviada'`. Re-check status para evitar overwrite de aprovada/rejeitada (race).
- `send-proposal-expiry-warning` — diário; envia 3 dias antes da expiração.

## Problemas Identificados

🟠 **Cliente UPDATE direto na tabela** — RLS permite; depende de policies bem escritas. Auditar que cliente não pode mudar `total_amount`.
🟢 **`document_url` sem validação de scheme** — `javascript:` poderia ser inserido.
🟢 **Sem versionamento** — editar proposta após enviada substitui original.

## Recomendações

1. Adicionar **column-level grants** ou trigger para impedir cliente de tocar em `total_amount`/`scope_summary`.
2. Validar URL no front antes de salvar.
3. Tabela `proposal_versions` espelhando padrão `project_contract_versions`.

## Relações

- [[leads]]
- [[clients]]
- [[../03-features/proposal-lifecycle]]
- [[../04-flows/proposal-flow]]
- [[../06-api/edge-fn-expire-proposals]]
- [[../06-api/edge-fn-send-proposal-expiry-warning]]

## Referências

- `supabase/migrations/*_proposals_*.sql`
- `src/pages/admin/ProposalDetail.tsx`
- `src/pages/portal/cliente/Proposals.tsx`
- `src/pages/portal/cliente/ProposalView.tsx`
- `src/lib/portal.ts` (PROPOSAL_TRANSITIONS)
