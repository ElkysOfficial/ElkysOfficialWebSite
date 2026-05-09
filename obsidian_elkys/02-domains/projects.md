---
title: Domínio — Projects
tags: [domain, projects, pivot]
---

# Domínio — Projects

## Contexto

Projetos são o segundo pivot do produto. Cada projeto é a unidade de execução do trabalho: tem cliente, contrato, parcelas/mensalidades, próximos passos, timeline e documentos. O portal cliente vê o ciclo de vida do seu projeto; o admin gere todos.

## Descrição Técnica

### Identidade e estado

| Campo                    | Função                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `status`                 | enum `project_status`: `negociacao`, `em_andamento`, `pausado`, `concluido`, `cancelado` |
| `current_stage`          | string livre (ex: "Desenvolvimento")                                                     |
| `billing_type`           | `mensal` ou `projeto`                                                                    |
| `pause_reason`           | enum `project_pause_reason`                                                              |
| `pause_source`           | `automatico` (cron) ou `manual` (admin)                                                  |
| `manual_status_override` | boolean — quando `true`, cron **não** altera status                                      |
| `client_visible_summary` | resumo público                                                                           |
| `internal_notes`         | notas internas                                                                           |

### Subentidades (1:N)

- [[project-contracts]] — versionamento imutável (`version_no`)
- [[project-installments]] — 50/50 (`entrada` + `entrega`), unique `(contract_id, installment_type)`
- [[project-subscriptions]] — mensalidades recorrentes
- [[project-next-steps]] — accountability cliente↔elkys
- [[timeline-events]] — feed do projeto
- [[charges]] — cobranças geradas (origem: `parcela_projeto`, `mensalidade`, `manual`)
- [[documents]] — escopo, contratos, NFs

### Estados e transições

```
negociacao ──aceite──▶ em_andamento ──cron / admin──┬──▶ pausado ──liquidação──▶ em_andamento
                                                    └──▶ concluido / cancelado
```

Ver [[../04-flows/pause-resume-flow]] (transição automática por cobranças bloqueantes atrasadas).

### RLS

| Operação         | Policy                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| SELECT (admin)   | `has_dev_access(uid)` OR `is_admin(uid)`                                  |
| SELECT (cliente) | `client_id = get_client_id_for_portal_user(uid)`                          |
| INSERT/UPDATE    | Admin (e roles operacionais como `po`, `developer`) — varia por migration |
| DELETE           | apenas `admin_super`                                                      |

### Pause/Resume automático

`sync_projects_from_blocking_charges()`:

- Se há `charges` com `is_blocking=true AND status='atrasado'` para um projeto → status = `pausado`, `pause_reason` setado, `pause_source='automatico'`.
- Quando todas liquidam → status = `em_andamento`, limpando `pause_reason` (a menos que `manual_status_override = true`).

⚠️ **Assumido:** o cron não diferencia `pausado(manual)` vs `pausado(automatico)` ao retomar — `manual_status_override` é a única defesa contra "cron desfaz pausa manual".

### Onboarding e aceite

- `project_onboarding_checklist` (JSON) — tasks iniciais.
- Aceite de contrato pelo cliente registrado em `project_contracts.signed_at` + `timeline_events`.

## Problemas Identificados

🔴 **Páginas órfãs** referenciam features de project não roteadas: `Notifications.tsx`, `RevenueByClient.tsx` — ver [[../13-issues/dead-pages]].

🟠 **`current_stage` é texto livre** — sem enum. Análise por estágio depende de `LIKE` ou agregações instáveis.

🟠 **`internal_notes` sem versionamento** — overwrite total a cada edição.

🟠 **Cascade de DELETE muito agressivo** — apagar projeto apaga 6+ subentidades inclusive `timeline_events`. Sem soft-delete; `archived_at` existe mas não é checado em todas as queries de leitura.

## Impacto

- Reabrir projeto cancelado = recriar do zero.
- Dashboards baseados em `current_stage` são frágeis.
- Pausa automática versus manual exige cuidado para não deixar projeto preso.

## Recomendações

1. Migrar `current_stage` para enum + tabela `project_stages` configurável.
2. Adicionar `internal_notes_history` ou usar `timeline_events` com `event_type='note'`.
3. Padronizar **soft-delete** com `archived_at` em todas as queries de listagem.
4. Documentar matriz pause_source × manual_status_override em [[../04-flows/pause-resume-flow]].

## Relações

- [[clients]]
- [[project-contracts]]
- [[project-installments]]
- [[project-subscriptions]]
- [[project-next-steps]]
- [[timeline-events]]
- [[charges]]
- [[../04-flows/pause-resume-flow]]
- [[../03-features/onboarding-checklist]]
- [[../03-features/contract-acceptance]]

## Referências

- `supabase/migrations/20260329120000_project_centric_redesign.sql`
- `src/pages/admin/ProjectCreate.tsx`
- `src/pages/admin/ProjectDetail.tsx`
- `src/pages/client/ProjectDetail.tsx`
- `src/lib/portal-data.ts` (`loadProjectsForClient`, `loadProjectById`)
