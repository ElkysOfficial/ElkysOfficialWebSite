/**
 * Hook de projetos para o admin portal.
 *
 * Carrega projetos + clientes + contratos + subscriptions em paralelo
 * (bundle). O bundle evita cascata de requests — uma unica chamada
 * traz tudo que a listagem precisa para renderizar cards com nome do
 * cliente, valor do contrato e status de recorrencia.
 *
 * Retorna um Map de clientes e contratos indexados por ID para
 * lookup O(1) na renderizacao.
 *
 * Usado por: Projects.tsx, Pipeline.tsx, Overview.tsx
 * Cache: 2min stale, 10min garbage collection
 *
 * @example
 * const { data } = useAdminProjects();
 * // data.projects: ProjectRow[]
 * // data.clientsMap: Map<string, ClientRef>
 * // data.contractsMap: Map<string, ContractRef>
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROJECTS_SELECT =
  "id, client_id, name, status, current_stage, solution_type, started_at, delivered_at, expected_delivery_date, billing_type, tags, created_at, production_url";

async function fetchProjectsBundle() {
  const [projectsRes, clientsRes, contractsRes, subscriptionsRes] = await Promise.all([
    supabase.from("projects").select(PROJECTS_SELECT).order("created_at", { ascending: false }),
    supabase.from("clients").select("id, full_name, client_type, nome_fantasia"),
    supabase
      .from("project_contracts")
      .select("project_id, total_amount, created_at, status")
      .order("created_at", { ascending: false }),
    supabase.from("project_subscriptions").select("project_id, status"),
  ]);

  const queryError =
    projectsRes.error ?? clientsRes.error ?? contractsRes.error ?? subscriptionsRes.error;
  if (queryError) throw queryError;

  return {
    projects: projectsRes.data ?? [],
    clients: clientsRes.data ?? [],
    contracts: contractsRes.data ?? [],
    subscriptions: subscriptionsRes.data ?? [],
  };
}

export function useAdminProjects() {
  return useQuery({
    queryKey: ["admin-projects-bundle"],
    queryFn: fetchProjectsBundle,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
