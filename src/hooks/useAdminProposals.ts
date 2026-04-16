/**
 * Hook de propostas para o admin portal.
 *
 * Carrega propostas + clientes + leads em paralelo (bundle).
 * Necessario porque uma proposta pode estar vinculada a um lead
 * (funil comercial) ou diretamente a um cliente (expansao).
 *
 * Usado por: Proposals.tsx (tab CRM), ProposalDetail.tsx
 * Cache: 2min stale, 10min garbage collection
 *
 * @example
 * const { data } = useAdminProposals();
 * // data.proposals, data.clients, data.leads
 */

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
