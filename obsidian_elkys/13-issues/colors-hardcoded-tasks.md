---
title: Tasks.tsx com cores Tailwind hardcoded
tags: [issue, high, design-system]
severity: HIGH
---

# 🔴 H7 — `Tasks.tsx` com cores hardcoded

## Contexto

Auditoria 2026-04-23 (`docs/AUDIT-2026-04-23.md` §1.1) identificou `Tasks.tsx` como pior ofensor do design system: 8+ cores Tailwind cruas em CATEGORIES, 12+ em PRIORITIES, badge inline, fallback `bg-slate-400`.

## Impacto

- **Dark mode quebra** — cores fixas (`bg-blue-500`) não respeitam tokens HSL.
- **Não há controle central** — mudar a cor de "alta prioridade" exige editar componente.
- **Anti-padrão se espalha** — desenvolvedores copiam o estilo para outros lugares.

## Localização

| Arquivo                     | Linhas  | Cores                                                                                                          |
| --------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `src/pages/admin/Tasks.tsx` | 102-109 | `bg-blue-500`, `bg-cyan-500`, `bg-emerald-500`, `bg-amber-500`, `bg-pink-500`, `bg-purple-500`, `bg-slate-400` |
| `Tasks.tsx`                 | 118-140 | `bg-red-500`, `bg-orange-500`, `bg-yellow-500`, `bg-green-500` + variações `/15`, `/30`                        |
| `Tasks.tsx`                 | 339     | badge `bg-blue-500/10 text-blue-600 dark:text-blue-400`                                                        |
| `Tasks.tsx`                 | 763     | notice 3 cores hardcoded                                                                                       |
| `Tasks.tsx`                 | 298     | fallback `bg-slate-400`                                                                                        |

## Recomendação

1. Criar tokens dedicados em `_tokens.scss`:
   ```scss
   --elk-task-cat-marketing: 200 75% 50%;
   --elk-task-cat-design: 160 65% 45%;
   --elk-task-cat-dev: 260 55% 50%;
   --elk-task-priority-high: 0 75% 55%;
   --elk-task-priority-med: 35 90% 55%;
   --elk-task-priority-low: 140 60% 45%;
   ```
2. Mapear constantes para tokens:
   ```ts
   const CATEGORY_COLORS = {
     marketing: "bg-[hsl(var(--elk-task-cat-marketing))]",
     design: "bg-[hsl(var(--elk-task-cat-design))]",
     dev: "bg-[hsl(var(--elk-task-cat-dev))]",
   } as const;
   ```
   Ou, melhor, criar `<TaskBadge category={...}>` em DS.

## Onda

- 🔴 Onda 1 — quick win.

## Relações

- [[../07-frontend/design-system]]
- [[../12-decisions/ADR-001-no-third-party-ui]]
- [[inputs-html-crus-admin]]

## Referências

- `src/pages/admin/Tasks.tsx`
- `docs/AUDIT-2026-04-23.md` §1.1
- `docs/DESIGN-SYSTEM.md` §14
