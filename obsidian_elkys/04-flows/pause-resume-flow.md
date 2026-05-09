---
title: Pause / Resume Flow
tags: [flow, projects, financial]
---

# Pause / Resume Flow

## Contexto

Projetos podem ser pausados **manualmente** (admin) ou **automaticamente** (cron por inadimplência). Distinguir as duas fontes é crítico para não desfazer pausa manual sem querer.

## Diagrama

```
[em_andamento]
     │
     ├─ admin pausa            ─► pausado, pause_source='manual',
     │                            manual_status_override=true
     │                            (cron NÃO toca)
     │
     ├─ cron 02h: charges      ─► pausado, pause_source='automatico',
     │   blocking + atrasada      pause_reason='financeiro'
     │                            (cron pode retomar)
     │
     ▼
[pausado]
     │
     ├─ admin retoma           ─► em_andamento, manual_status_override=false
     │
     ├─ cron: charges liquidam ─► em_andamento (apenas se source='automatico'
     │                            E manual_status_override=false)
     │
     └─ admin marca concluido  ─► concluido
```

## Regra do cron (`sync_projects_from_blocking_charges`)

```sql
-- Pausa
IF EXISTS charges WHERE project_id = p.id
   AND is_blocking = true
   AND status = 'atrasado'
   AND is_historical = false
THEN
  UPDATE projects SET
    status = 'pausado',
    pause_source = 'automatico',
    pause_reason = 'financeiro' -- ⚠️ assumido; conferir migration
  WHERE id = p.id
    AND status != 'cancelado'
    AND status != 'concluido';

-- Retoma
ELSE IF p.status = 'pausado'
     AND p.pause_source = 'automatico'
     AND p.manual_status_override = false
THEN
  UPDATE projects SET
    status = 'em_andamento',
    pause_reason = NULL
  WHERE id = p.id;
```

## Problemas Identificados

🟠 **`manual_status_override` é binário** — não capta intenção fina. Admin que pausa manualmente em janela onde charges também estão atrasadas pode não saber que cron já estava pausando.
🟠 **Sem timeline event automático** — pausa/retomada via cron não gera entry em `timeline_events` (ou gera? validar).
🟢 **Cliente vê StatusBadge "Pausado" sem motivo nem data** — onda 1 do roadmap.

## Recomendações

1. Sempre que cron mudar status de projeto, INSERT `timeline_events(event_type='project_paused'|'project_resumed', source_table='cron')`.
2. Mostrar `pause_reason` + data formatada no cliente (StatusBadge ou tooltip).
3. Audit trail: capturar antes/depois em `audit_logs` mesmo nas mudanças de cron.

## Relações

- [[../02-domains/projects]]
- [[../02-domains/charges]]
- [[overdue-cron-flow]]
- [[../03-features/financial-blocks]]
- [[../13-issues/corrupt-pause-source-on-resume]]

## Referências

- `supabase/migrations/*_sync_projects_from_blocking_charges*.sql`
- `src/pages/admin/ProjectDetail.tsx`
- `src/pages/client/ProjectDetail.tsx`
