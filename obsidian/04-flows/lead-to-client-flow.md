---
title: Lead → Client Flow
tags: [flow, sales, conversion]
---

# Lead → Client Flow

## Sequência

```
┌─ AdminCRM/LeadDetail
│  status = qualificado → proposta → negociacao
│
├─ (opcional) ProposalDetail nova
│  vincula proposals.lead_id
│  envia → cliente recebe email → aprova
│
├─ "Converter em cliente" (botão admin)
│  ↓
│  AdminClientCreate.tsx (pré-preenche email, nome, telefone, company do lead)
│  ↓
│  create-user (edge fn) → auth user
│  INSERT clients
│  INSERT client_contacts (is_primary=true)
│  send-client-welcome (com senha temp)
│  ↓
│  UPDATE leads SET status='ganho', converted_client_id=<new client.id>
│  ↓
│  (se proposta existia) UPDATE proposals SET client_id=<new>, lead_id=NULL
│
└─ Lead permanece com vínculo histórico via converted_client_id
```

## Problemas Identificados

🟠 **Conversão não-atômica** — sequência de 5+ operações em front-end. Se algo falha no meio, lead fica `status='ganho' converted_client_id=NULL` ou cliente sem contrato. Sem RPC transacional dedicada.

🟠 **Proposta não migra automaticamente** — admin precisa lembrar de re-vincular `client_id`.

🟢 **`leads.converted_client_id` sem unique constraint** — tecnicamente um lead poderia "virar" 2 clientes (não acontece, mas não é forçado).

## Recomendações

1. Criar **RPC `convert_lead_to_client(lead_id, payload)`** que faz tudo em transação atômica + INSERT em `audit_logs`.
2. RPC migra propostas vinculadas automaticamente.
3. Unique constraint partial em `converted_client_id` quando `status='ganho'`.

## Relações

- [[../02-domains/leads]]
- [[../02-domains/clients]]
- [[../02-domains/proposals]]
- [[../06-api/edge-fn-create-user]]
- [[../06-api/edge-fn-send-client-welcome]]

## Referências

- `src/pages/admin/LeadDetail.tsx`
- `src/pages/admin/ClientCreate.tsx`
- `src/lib/lead-diagnosis.ts`
