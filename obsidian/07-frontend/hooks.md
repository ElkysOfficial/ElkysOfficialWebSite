---
title: Hooks Inventory
tags: [frontend, hooks, react]
---

# Hooks Inventory (15 customizados)

## Contexto

Hooks customizados encapsulam padrões: data fetching, URL state, autosave, debounce, dark mode, paginação responsiva. Heavy use de **React Query** para data layer; sem state library global.

## Lista

| Hook                    | Arquivo                          | Função                                                                         |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------ |
| `useAuth`               | `contexts/AuthContext.tsx`       | acesso ao user/roles/session/timeout                                           |
| `useAsyncButton`        | `hooks/useAsyncButton.ts`        | orquestra loading→success→idle                                                 |
| `useAdminProjects`      | `hooks/useAdminProjects.ts`      | bundle: projects + clients + contracts + subscriptions (parallel) — 2min stale |
| `useAdminClients`       | `hooks/useAdminClients.ts`       | clients + indicators (overdue, active project, pending proposal) — Map agg     |
| `useAdminCharges`       | `hooks/useAdminCharges.ts`       | charges ordered by `due_date` — 1min stale                                     |
| `useAdminProposals`     | `hooks/useAdminProposals.ts`     | proposals + clients + leads — 2min stale                                       |
| `useAdminExpenses`      | `hooks/useAdminExpenses.ts`      | expenses para burn rate — 2min stale                                           |
| `useSidebarBadges`      | `hooks/useSidebarBadges.ts`      | counters de tasks/tickets/contracts no sidebar — refetch on focus              |
| `useClientId`           | `hooks/useClientId.ts`           | resolve auth user → client_id — 5min stale                                     |
| `useClientOverview`     | `hooks/useClientOverview.ts`     | bundle dashboard cliente                                                       |
| `useMinLoading`         | `hooks/useMinLoading.ts`         | 200ms delay + 500ms min para evitar flash de loader                            |
| `useResponsivePageSize` | `hooks/useResponsivePageSize.ts` | items por página por breakpoint                                                |
| `useUrlState`           | `hooks/useUrlState.ts`           | state ↔ search params (replace mode, omit defaults)                            |
| `useUrlStateNullable`   | `hooks/useUrlState.ts`           | variant para filtros opcionais                                                 |
| `useFormDraftAutoSave`  | `hooks/useFormDraftAutoSave.ts`  | autosave em localStorage com debounce                                          |
| `useSearchDebounce`     | `hooks/useSearchDebounce.ts`     | debounce de input de busca (400ms)                                             |
| `useDarkMode`           | `hooks/useDarkMode.ts`           | substitui `next-themes` — lê `.dark` class no `<html>`                         |

## Padrões

- **Bundle fetching**: hooks Admin\* fazem múltiplas queries em paralelo + Maps para O(1) lookup.
- **SSR guards**: todos checam `typeof window === "undefined"`.
- **Cleanup refs**: `mountedRef`, `hasCheckedRef` previnem state updates pós-unmount.
- **React Query stale times**: 1min (charges), 2min (admin lists), 5min (clientId).

## Problemas Identificados

🟠 **`useAdminClients` over-fetch** — busca clients + contracts + charges + proposals; se UI só usa `clients`, refetch invalida tudo.
🟠 **`useFormDraftAutoSave` em localStorage** — drafts persistem entre logins de admins diferentes na mesma máquina (vazamento UX). Solução: prefixar key com `user.id`.
🟢 **`useSidebarBadges` queries 3 tabelas** — `team_tasks`, `support_tickets`, `project_contracts`. Acoplado por design (sidebar perf).

## Recomendações

1. **Splittar `useAdminClients`** em `useAdminClientsBase()` + `useAdminClientsIndicators()` (camada computada).
2. `useFormDraftAutoSave`: incluir `user.id` na chave do localStorage.
3. Documentar **stale time matrix** em comentário no `queryClient`.

## Relações

- [[state-strategy]]
- [[../06-api/index]] (`portal-data.ts`)
- [[../13-issues/over-fetching-admin-hooks]]

## Referências

- `src/hooks/`
- `src/contexts/AuthContext.tsx`
