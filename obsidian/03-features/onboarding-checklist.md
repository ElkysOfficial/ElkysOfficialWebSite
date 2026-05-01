---
title: Feature — Onboarding Checklist
tags: [feature, projects, onboarding]
---

# Feature — Onboarding Checklist

## Contexto

Após contrato assinado, projeto entra em "onboarding" com checklist de tarefas (acessos, briefings, materiais). Cliente vê seu lado, admin vê tudo.

## Componentes

| Camada     | Artefato                                                   |
| ---------- | ---------------------------------------------------------- |
| Tabela     | `project_onboarding_checklist` (JSONB)                     |
| Componente | `components/portal/project/ProjectOnboardingChecklist.tsx` |
| Lib        | `src/lib/project-onboarding.ts`                            |

## Modelo (JSONB)

```jsonb
{
  "items": [
    { "id": "access-server", "label": "Enviar acesso servidor", "owner": "cliente",
      "status": "pendente", "due_date": "2026-05-10" },
    { "id": "briefing-design", "label": "Briefing de design", "owner": "elkys",
      "status": "concluido", "completed_at": "2026-04-28" }
  ],
  "completion_pct": 50,
  "started_at": "2026-04-25"
}
```

## Por que JSONB?

- Estrutura flexível por projeto (templates diferentes).
- Sem migration para adicionar campo.
- Trade-off: queries agregadas mais difíceis.

## Problemas Identificados

🟠 **Sem template canônico** — cada projeto começa vazio. Admin recria a checklist toda vez.
🟠 **Sem trigger ao concluir 100%** — projeto deveria sair de onboarding automaticamente.
🟢 **`completion_pct` calculado em runtime** — derivar é OK, persistir gera divergência.

## Recomendações

1. Tabela `onboarding_templates(name, items_jsonb)`; admin escolhe template ao criar projeto.
2. Trigger ou edge fn ao 100%: `timeline_event(event_type='onboarding_completed')` + email.
3. Remover `completion_pct` da estrutura (calcular sempre).

## Relações

- [[../02-domains/projects]]
- [[../02-domains/timeline-events]]
- [[contract-acceptance]]

## Referências

- `src/lib/project-onboarding.ts`
- `src/components/portal/project/ProjectOnboardingChecklist.tsx`
- `supabase/migrations/20260416150000_project_onboarding_checklist*.sql`
