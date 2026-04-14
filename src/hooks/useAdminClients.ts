import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CLIENTS_SELECT =
  "id, user_id, full_name, nome_fantasia, client_type, email, cpf, phone, is_active, client_since, monthly_value, project_total_value, contract_status, contract_end, client_origin, tags, created_at";

/**
 * Flags operacionais calculadas por cliente a partir de charges,
 * projects e proposals. Permitem renderizar indicadores inline na
 * listagem sem precisar fazer N+1 queries — tudo agregado em memória
 * após um único batch de leituras.
 */
export interface AdminClientIndicators {
  hasOverdueCharges: boolean;
  hasActiveProject: boolean;
  hasPendingProposal: boolean;
  contractExpiringSoon: boolean;
}

async function fetchClients() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [clientsRes, contractsRes, chargesRes, projectsRes, proposalsRes] = await Promise.all([
    supabase
      .from("clients")
      .select(CLIENTS_SELECT)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("project_contracts").select("client_id, total_amount"),
    // Só o que precisamos para detectar inadimplencia: cobranças não quitadas
    // e não canceladas. Comparamos due_date contra hoje no cliente para
    // decidir se entram em "atrasado".
    supabase
      .from("charges")
      .select("client_id, status, due_date")
      .in("status", ["pendente", "atrasado"]),
    supabase.from("projects").select("client_id, status").eq("status", "em_andamento"),
    supabase.from("proposals").select("client_id, status").eq("status", "enviada"),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (contractsRes.error) throw contractsRes.error;
  if (chargesRes.error) throw chargesRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (proposalsRes.error) throw proposalsRes.error;

  const contractTotals = new Map<string, number>();
  for (const c of contractsRes.data ?? []) {
    contractTotals.set(
      c.client_id,
      (contractTotals.get(c.client_id) ?? 0) + Number(c.total_amount)
    );
  }

  const overdueClientIds = new Set<string>();
  for (const charge of chargesRes.data ?? []) {
    // "atrasado" já é explícito; "pendente" só conta se o vencimento já passou
    if (charge.status === "atrasado" || charge.due_date < todayStr) {
      overdueClientIds.add(charge.client_id);
    }
  }

  const activeProjectClientIds = new Set<string>();
  for (const project of projectsRes.data ?? []) {
    activeProjectClientIds.add(project.client_id);
  }

  const pendingProposalClientIds = new Set<string>();
  for (const proposal of proposalsRes.data ?? []) {
    if (proposal.client_id) pendingProposalClientIds.add(proposal.client_id);
  }

  // Janela de 30 dias para "contrato vencendo"
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringCutoff = thirtyDaysFromNow.toISOString().slice(0, 10);

  return (clientsRes.data ?? []).map((client) => {
    const contractEnd = client.contract_end;
    const contractExpiringSoon =
      typeof contractEnd === "string" && contractEnd >= todayStr && contractEnd <= expiringCutoff;

    const indicators: AdminClientIndicators = {
      hasOverdueCharges: overdueClientIds.has(client.id),
      hasActiveProject: activeProjectClientIds.has(client.id),
      hasPendingProposal: pendingProposalClientIds.has(client.id),
      contractExpiringSoon,
    };

    return {
      ...client,
      project_total_value: contractTotals.get(client.id) ?? Number(client.project_total_value),
      indicators,
    };
  });
}

export function useAdminClients() {
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: fetchClients,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
