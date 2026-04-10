import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CLIENTS_SELECT =
  "id, user_id, full_name, nome_fantasia, client_type, email, cpf, phone, is_active, client_since, monthly_value, project_total_value, contract_status, client_origin, tags, created_at";

async function fetchClients() {
  const [clientsRes, contractsRes] = await Promise.all([
    supabase
      .from("clients")
      .select(CLIENTS_SELECT)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("project_contracts").select("client_id, total_amount"),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (contractsRes.error) throw contractsRes.error;

  const contractTotals = new Map<string, number>();
  for (const c of contractsRes.data ?? []) {
    contractTotals.set(
      c.client_id,
      (contractTotals.get(c.client_id) ?? 0) + Number(c.total_amount)
    );
  }

  return (clientsRes.data ?? []).map((client) => ({
    ...client,
    project_total_value: contractTotals.get(client.id) ?? Number(client.project_total_value),
  }));
}

export function useAdminClients() {
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: fetchClients,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
