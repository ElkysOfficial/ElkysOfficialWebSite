import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchProposalsBundle() {
  const [proposalsRes, clientsRes, leadsRes] = await Promise.all([
    supabase
      .from("proposals")
      .select(
        "id, title, status, total_amount, valid_until, sent_at, approved_at, created_at, client_id, lead_id"
      )
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, full_name, client_type, nome_fantasia"),
    supabase.from("leads").select("id, name, company"),
  ]);

  const queryError = proposalsRes.error ?? clientsRes.error ?? leadsRes.error;
  if (queryError) throw queryError;

  return {
    proposals: proposalsRes.data ?? [],
    clients: clientsRes.data ?? [],
    leads: leadsRes.data ?? [],
  };
}

export function useAdminProposals() {
  return useQuery({
    queryKey: ["admin-proposals-bundle"],
    queryFn: fetchProposalsBundle,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
