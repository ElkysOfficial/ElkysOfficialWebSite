---
title: Domínio — Leads
tags: [domain, leads, sales]
---

# Domínio — Leads

## Contexto

Pipeline comercial. Lead representa uma oportunidade **antes** de virar cliente. Owner típico: role `comercial`.

## Estrutura

| Campo                               | Função                                                              |
| ----------------------------------- | ------------------------------------------------------------------- |
| `name`, `email`, `phone`, `company` | identidade                                                          |
| `source`                            | `inbound`, `indicacao`, `rede_social`, `evento`, `cold`, `outro`    |
| `status`                            | `novo`, `qualificado`, `proposta`, `negociacao`, `ganho`, `perdido` |
| `estimated_value`                   | numeric(12,2)                                                       |
| `probability`                       | smallint 0–100                                                      |
| `assigned_to`                       | FK auth.users (responsável)                                         |
| `lost_reason`                       | preenchido ao marcar perdido                                        |
| `converted_client_id`               | FK clients — ao virar cliente                                       |

Ver `lead_interactions` (1:N) — `type` ∈ `ligacao`, `email`, `reuniao`, `whatsapp`, `nota`.

## RLS

| Quem                                 | Acesso |
| ------------------------------------ | ------ |
| `is_admin` ou `has_comercial_access` | full   |
| Outros                               | ❌     |

Cliente não tem acesso a `leads`.

## Conversão

`leads.converted_client_id` é populado por uma RPC ou diretamente no fluxo de "criar cliente a partir do lead". Status passa para `ganho`. Proposta vinculada (se houver) é mantida via `proposals.lead_id`.

Ver [[../04-flows/lead-to-client-flow]].

## Problemas Identificados

🟠 **`probability` é texto (smallint)** mas sem default; UI default = 0 implicitamente. Pipelines visuais ficam zerados em leads novos.
🟢 **`lost_reason` sem enum** — string livre fragmenta análise.
🟢 **`source` CHECK pode crescer**; sugerido enum.

## Recomendações

1. Definir default `probability = 10` no DB para "novo".
2. Migrar `source` e `lost_reason` para enums dedicados.
3. Painel "tempo médio em cada estágio" (`negociacao` → `ganho`).

## Relações

- [[clients]]
- [[proposals]]
- [[../03-features/lead-pipeline]]
- [[../04-flows/lead-to-client-flow]]

## Referências

- `supabase/migrations/*_leads_*.sql`
- `src/pages/admin/CRM.tsx`, `LeadDetail.tsx`
- `src/lib/lead-diagnosis.ts`, `pipeline-utils.ts`
