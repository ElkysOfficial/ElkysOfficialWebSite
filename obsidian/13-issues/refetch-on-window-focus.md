---
title: refetchOnWindowFocus global true
tags: [issue, medium, performance]
severity: MEDIUM
---

# 🟠 M3 — `refetchOnWindowFocus: true` global

## Contexto

`queryClient` em `App.tsx` usa default React Query (`refetchOnWindowFocus: true`). Cada vez que admin troca de tab, todas as queries ativas refetcham.

## Impacto

- Admin com 4 tabs do portal abertas → 4× requests a cada troca.
- `useAdminClients` (que já over-fetcha) amplifica problema.
- Cota Supabase (Pro plan) consumida desnecessariamente.

## Recomendação

```ts
// App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s antes de "stale"
      refetchOnWindowFocus: false, // opt-in
      retry: 1,
    },
  },
});
```

Onde refetch on focus for desejável (ex: Finance que pode mudar enquanto admin atende cliente), opt-in:

```ts
useQuery({ ..., refetchOnWindowFocus: true });
```

## Onda

- 🔴 Onda 1 — 1 linha de mudança.

## Relações

- [[over-fetching-admin-hooks]]
- [[../07-frontend/hooks]]
- [[../12-decisions/ADR-008-no-state-library]]

## Referências

- `src/App.tsx`
