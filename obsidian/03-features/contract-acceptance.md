---
title: Feature — Aceite de Contrato
tags: [feature, contracts]
---

# Feature — Aceite de Contrato

## Contexto

Cliente vê contrato proposto pelo admin, aceita digitalmente. Aceite gera `signed_at`, dispara `timeline_event`, libera fluxo de cobrança (parcela `entrada` vira charge).

## Componentes

| Camada     | Artefato                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| Tabela     | `project_contracts` (versionável via `project_contract_versions`)                                    |
| UI cliente | `pages/portal/cliente/Contracts.tsx` + `components/portal/contract/ContractAcceptanceStatusCard.tsx` |
| UI admin   | `pages/admin/Contracts.tsx` + `ContractActionsButtons.tsx`, `ContractVersionHistory.tsx`             |
| Edge fn    | `send-contract-validation` (notifica jurídico de aceite)                                             |

## Fluxo

```
[admin] cria contrato (rascunho) → ativo → cliente recebe email
         │
         ▼
[cliente] /portal/cliente/contratos/:id
         vê escopo, valor, payment_model
         clica "Aceitar"
         ↓
         UPDATE project_contracts SET signed_at = now() (RLS check: client_id matches)
         ↓
         INSERT timeline_events (event_type='contract_signed')
         ↓
         INSERT/UPDATE project_installments (entrada vira pendente)
         ↓
         INSERT charges (origin_type='parcela_projeto', status='pendente')
         ↓
         send-contract-validation (email para jurídico)
```

## Versionamento

`project_contract_versions` mantém histórico imutável. Editar contrato após `ativo` cria nova versão (`version_no + 1`); cliente é notificado.

## Problemas Identificados

🟠 **Aceite não é atômico** — UPDATE + INSERT charges + INSERT timeline em sequência no front-end. Falha parcial deixa contrato `signed_at` mas charges não geradas.
🟠 **Sem assinatura criptográfica** — apenas timestamp; LGPD/eSignature pode exigir mais (hash do documento, IP, user_agent).
🟢 **Modal de sucesso ausente** — onda 1 do roadmap.

## Recomendações

1. **RPC `accept_contract(contract_id)`** que faz tudo em transação atômica + retorna `{ ok, charges_created, timeline_event_id }`.
2. Capturar IP + user_agent (já em `legal_acceptance_log` para termos; replicar para contratos).
3. Modal de sucesso pós-aceite com CTA "Pagar entrada".

## Relações

- [[../02-domains/project-contracts]]
- [[../02-domains/project-installments]]
- [[../02-domains/charges]]
- [[../04-flows/contract-acceptance-flow]]
- [[../06-api/edge-fn-send-contract-validation]]

## Referências

- `src/components/portal/contract/`
- `src/pages/portal/cliente/Contracts.tsx`
- `supabase/migrations/20260415170000_project_contract_versioning.sql`
