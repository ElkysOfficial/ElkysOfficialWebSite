---
title: useAdminClients faz over-fetch
tags: [issue, medium, performance]
severity: MEDIUM
---

# 🟠 M2 — `useAdminClients` faz over-fetch

## Contexto

`useAdminClients` busca em paralelo: `clients` + `project_contracts` + `charges` + `proposals`, agrega indicators (overdue, active project, pending proposal) em Map. Bom para performance da listagem unificada, ruim quando UI precisa de subset.

## Impacto

- Páginas que só leem `clients` (ex: dropdown de seleção em `LeadDetail`) puxam 4 queries.
- `staleTime: 2min` invalida tudo a cada window focus (default React Query) — efeito amplificado.
- Em time com 200 clientes, são 200 charges + 200 proposals + 200 contracts puxados.

## Reprodução

Abrir DevTools → Network. Navegar para `/portal/admin/leads/:id`. Ver requests.

## Recomendação

### Refatorar em 2 hooks

```ts
// Base: só clients
export function useAdminClientsBase() {
  return useQuery({
    queryKey: ["admin", "clients", "base"],
    queryFn: () => supabase.from("clients").select("*"),
    staleTime: 5 * 60_000,
  });
}

// Indicators: deriva de cliente + outras queries
export function useAdminClientsIndicators() {
  const clients = useAdminClientsBase();
  const charges = useAdminChargesActive(); // existing
  const proposals = useAdminProposalsActive();
  const contracts = useAdminContractsActive();

  return useMemo(() => {
    if (!clients.data) return null;
    return mapIndicators(clients.data, charges.data, proposals.data, contracts.data);
  }, [clients, charges, proposals, contracts]);
}
```

`AdminClientsList.tsx` usa `useAdminClientsIndicators`; lookup em outros lugares usa `useAdminClientsBase`.

### Outra mitigação

Aumentar `staleTime` global:

```ts
new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});
```

## Onda

- 🟠 Onda 2.

## Relações

- [[../07-frontend/hooks]]
- [[refetch-on-window-focus]]
- [[../12-decisions/ADR-008-no-state-library]]

## Referências

- `src/hooks/useAdminClients.ts`
- `src/hooks/useAdminProjects.ts`
- `src/hooks/useAdminProposals.ts`
