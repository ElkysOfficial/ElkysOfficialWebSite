import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CLIENTS_SELECT =
  "id, user_id, full_name, nome_fantasia, client_type, email, cpf, phone, is_active, client_since, monthly_value, project_total_value, contract_status, client_origin, tags, created_at";

async function fetchClients() {
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENTS_SELECT)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function useAdminClients() {
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: fetchClients,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
