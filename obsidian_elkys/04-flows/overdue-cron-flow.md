---
title: Overdue Cron Flow (02h UTC)
tags: [flow, cron, financial]
---

# Overdue Cron Flow

## Contexto

Diariamente às 02h UTC, o sistema **promove cobranças vencidas** e **pausa projetos** com cobranças bloqueantes em atraso. Esse flow é o motor da inadimplência automática e do _financial blocking_.

## Sequência

```
pg_cron 02:00 UTC
   │
   ▼
sync_financial_blocks()
   │
   ├─▶ mark_overdue_charges()
   │     UPDATE charges SET status = 'atrasado'
   │     WHERE status = 'pendente'
   │       AND due_date < CURRENT_DATE
   │       AND is_historical = false;
   │
   └─▶ sync_projects_from_blocking_charges()
         For each project:
           IF EXISTS charges WHERE
              project_id = p.id
              AND is_blocking = true
              AND status = 'atrasado'
              AND is_historical = false
           THEN status = 'pausado'
                pause_source = 'automatico'
                pause_reason = 'financeiro' (assumido)
           ELSE IF status = 'pausado' AND pause_source = 'automatico'
                AND manual_status_override = false
           THEN status = 'em_andamento', pause_reason = NULL;
```

Em paralelo (mesmo cron ou cron irmão):

- `reconcile_inadimplencia_warnings()` — sincroniza tabela `client_inadimplencia_warnings`.
- UPDATE `clients.contract_status = 'inadimplente'` se houver charges atrasadas há >X dias.

## Estados afetados

| Tabela                          | Coluna                                   | Mudanças possíveis         |
| ------------------------------- | ---------------------------------------- | -------------------------- |
| `charges`                       | `status`                                 | `pendente` → `atrasado`    |
| `projects`                      | `status`, `pause_reason`, `pause_source` | `em_andamento` ⇄ `pausado` |
| `clients`                       | `contract_status`                        | `ativo` ⇄ `inadimplente`   |
| `client_inadimplencia_warnings` | row inserido por charge atrasada         |

## Problemas Identificados

🔴 **`agendada` não promove para `pendente` no cron** — só promove `pendente → atrasado`. Charges criadas com `due_date <= hoje` ficam em `agendada` até alguém abrir o Finance (ver [[../02-domains/charges]]). Solução proposta: adicionar `UPDATE ... SET status='pendente' WHERE status='agendada' AND due_date <= CURRENT_DATE` na função SQL.

🟠 **`pause_reason` na pausa automática** — qual valor é setado? `financeiro` é a hipótese, mas migration deve confirmar. ⚠️ **Assumido**.

🟠 **Sem log de execução** — se a função SQL falhar (lock, deadlock), não há `cron_run_log`. Difícil diagnosticar atraso na promoção.

🟢 **`is_historical = false` filtragem** depende do uso correto do flag.

## Recomendações

1. Estender `sync_financial_blocks()`:
   ```sql
   UPDATE charges
     SET status = 'pendente'
   WHERE status = 'agendada'
     AND due_date <= CURRENT_DATE
     AND is_historical = false;
   ```
2. Tabela `cron_run_log` (ver [[../05-database/cron-jobs]]).
3. Notificar Discord em ERROR.

## Relações

- [[../02-domains/charges]]
- [[../02-domains/projects]]
- [[pause-resume-flow]]
- [[inadimplencia-flow]]
- [[../05-database/cron-jobs]]
- [[../05-database/functions]]

## Referências

- `supabase/migrations/*_sync_financial_blocks*.sql`
- `supabase/migrations/*_mark_overdue_charges*.sql`
- `supabase/migrations/20260423140000_inadimplencia_reconcile_fix.sql`
