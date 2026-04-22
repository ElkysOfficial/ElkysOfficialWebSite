# Roadmap — Régua de paralisação por inadimplência (Onda 3)

> **Status:** Planejado. Requer decisão de negócio antes de implementar.
> **Sensibilidade:** Alta — afeta relacionamento comercial com cliente.

## Contexto

A análise de qualidade de vida do portal (ver histórico de conversas) identificou que:

- Cliente vira `inadimplente` silenciosamente via `mark_overdue_clients_inadimplente()` — não recebe aviso formal.
- A função `sync_projects_from_blocking_charges()` pausa projeto **imediatamente** quando charge vira `atrasado` e é `is_blocking=true`. Sem janela de aviso.
- Régua atual cobre D-3 (lembrete), D0 (vencimento), D+7 (atraso). Não há D+3, D+15, D+30, D+45.
- Admin descobre inadimplência só abrindo `Finance > Delinquency`. Não há widget no overview.

Resultado: cliente é surpreendido pela pausa. Zero oportunidade de regularizar antes. Dano relacional evitável.

## Política sugerida (precisa validação do negócio)

### Régua progressiva de comunicação

| Dia      | Evento                               | Ação no sistema                                                                | Comunicação ao cliente                              |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| **D-3**  | Lembrete pré-vencimento              | Email existente (régua atual)                                                  | "Vence em 3 dias"                                   |
| **D0**   | Vencimento                           | `mark_overdue_charges` após grace                                              | "Vence hoje"                                        |
| **D+3**  | 1º aviso pós-vencimento              | **Novo** email cordial                                                         | "Identificamos pendência"                           |
| **D+7**  | 2º aviso                             | `send-charge-overdue` (existe)                                                 | "Pendência persiste"                                |
| **D+15** | ⚠️ **Aviso de paralisação iminente** | **Novo** email + notification                                                  | "Serviço será pausado em 5 dias se não regularizar" |
| **D+20** | 🔴 **Paralisação do projeto**        | Modificar `sync_projects_from_blocking_charges` para só pausar após esse prazo | "Projeto pausado por pendência financeira"          |
| **D+30** | Aviso gerencial interno              | `admin_notifications` com severity `action_required`                           | (interno) "Cliente X com 30d de atraso"             |
| **D+45** | Escalação comercial/jurídica         | Notification para roles `juridico` + `comercial`                               | "Seu caso foi encaminhado para setor jurídico"      |

### Parâmetros configuráveis

Adicionar secrets ou colunas em `billing_rules`:

- `WARNING_DAYS_BEFORE_PAUSE` (default 5)
- `PAUSE_AFTER_OVERDUE_DAYS` (default 20)
- `ESCALATION_INTERNAL_DAYS` (default 30)
- `ESCALATION_LEGAL_DAYS` (default 45)

## Implementação sugerida

Sub-dividir em duas fases para reduzir risco:

### Fase 3a — Avisos escalonados (sem mudar comportamento de pausa) 🟢 Seguro

**Não altera fluxo atual de pausa.** Só adiciona comunicação.

1. **Nova edge function `send-overdue-reminder`**
   - Busca charges com `status=atrasado` e `due_date + N dias = today`
   - N configurável via body: `{ stage: 3 | 15 }` → corresponde aos emails D+3 e D+15
   - Email cordial (D+3) ou alerta de paralisação (D+15)

2. **Migration de cron** agendando a função
   - Diário 09h UTC (06h BRT)
   - Chama para stages D+3 e D+15 em sequência

3. **Nova edge function `send-inadimplencia-warning`**
   - Disparada quando `clients.contract_status` muda para `inadimplente`
   - Pode ser trigger SQL ou hook na função `mark_overdue_clients_inadimplente`

### Fase 3b — Mudança de comportamento de pausa 🟡 Crítico

**Altera quando projetos são pausados automaticamente.**

1. **Modificar `sync_projects_from_blocking_charges`**
   - Antes: pausa imediato se charge é `atrasado` e `is_blocking=true`
   - Depois: só pausa se `overdue_days >= PAUSE_AFTER_OVERDUE_DAYS`
   - Usar `current_date - charge.due_date` para calcular dias

2. **Novas notificações internas**
   - D+30: `admin_notifications` type `inadimplencia_30d`, severity `warning`
   - D+45: type `inadimplencia_escalacao_juridica`, target `juridico` + `comercial`

3. **Widget "Inadimplência aging" no AdminOverview**
   - Cards com contadores 0-30 / 30-60 / 60+ clicáveis
   - Link direto pro filtro correspondente em `Finance > Delinquency`

## Ordem de implementação recomendada

1. ✏️ **Validar política com stakeholder** (financeiro + jurídico) — define os dias e comunicações
2. 🟢 **Fase 3a** — emails escalonados, sem mexer em pausa
3. 👀 **Monitorar 2-4 semanas** — ver se os emails reduzem inadimplência sem paralisar
4. 🟡 **Fase 3b** — só depois de observar comportamento real, alterar trigger de pausa

## Riscos conhecidos

| Risco                                                     | Mitigação                                                                                                   |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cliente recebe muitos emails e considera spam             | Régua tem cadência espaçada (D-3, D0, D+3, D+7, D+15) — ~5 emails no total pré-paralisação                  |
| Pausa automática derruba cliente importante               | Widget no overview para financeiro revisar antes. Possível whitelist manual via `charges.is_blocking=false` |
| Cliente regulariza mas projeto não retoma                 | Ajustar `sync_projects_from_blocking_charges` para reativar quando charges pagas                            |
| Clientes em negociação ativa recebem aviso de paralisação | Campo `clients.negotiation_hold` (booleano) que pula a régua enquanto ativo                                 |

## Arquivos afetados (checklist futuro)

- [ ] `docs/BILLING-ESCALATION.md` (documento de política definitivo)
- [ ] `supabase/functions/send-overdue-reminder/index.ts` (nova)
- [ ] `supabase/functions/send-inadimplencia-warning/index.ts` (nova)
- [ ] `supabase/migrations/*_overdue_reminder_cron.sql` (cron)
- [ ] `supabase/migrations/*_pause_after_overdue_days.sql` (modifica trigger)
- [ ] `src/pages/portal/admin/Overview.tsx` (widget aging)
- [ ] `src/pages/portal/admin/Finance.tsx` (ação sugerida por bucket)

## Relação com outras ondas

- **Onda 1 (concluída):** lembrete de proposta expirando e card de pendências do cliente. Paradigma similar (régua de lembretes) — o código pode ser inspiração.
- **Onda 2 (concluída):** badges de pendência no sidebar. Pode adicionar badge "Inadimplentes" para role financeiro quando este roadmap for implementado.
