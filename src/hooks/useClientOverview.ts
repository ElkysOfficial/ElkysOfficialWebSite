/**
 * Hook para o dashboard (Overview) do portal do cliente.
 *
 * Carrega em paralelo tudo que o cliente precisa ver na tela inicial:
 * - Projetos ativos e seus status
 * - Cobrancas pendentes e atrasadas
 * - Tickets de suporte abertos
 * - Propostas enviadas aguardando aceite
 * - Contratos pendentes de assinatura
 *
 * Agrega metricas (totais, contagens) para os cards do dashboard.
 *
 * Usado por: portal/client/Overview.tsx
 * Cache: 2min stale, 10min garbage collection
 *
 * @example
 * const { data } = useClientOverview(clientId);
 * // data.projects, data.pendingCharges, data.openTickets, etc.
 */

import { useQuery } from "@tanstack/react-query";
import {
  loadChargesForClient,
  loadProjectsForClient,
  loadSupportTicketsForClient,
} from "@/lib/portal-data";
import { isTicketOpen } from "@/lib/portal";
import { supabase } from "@/integrations/supabase/client";

export function useClientOverview(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ["client-overview", clientId],
    queryFn: async () => {
      if (!clientId) throw new Error("Client ID is required");

      const [projectsRes, chargesRes, ticketsRes, proposalsRes, contractsRes] = await Promise.all([
        loadProjectsForClient(clientId),
        loadChargesForClient(clientId),
        loadSupportTicketsForClient(clientId),
        supabase
          .from("proposals")
          .select("id, title, status, total_amount")
          .eq("client_id", clientId)
          .eq("status", "enviada"),
        supabase
          .from("project_contracts")
          .select("id, status, accepted_at")
          .eq("client_id", clientId)
          .eq("status", "em_validacao")
          .is("accepted_at", null),
      ]);

      // If ALL queries failed, throw so React Query shows error state
      if (projectsRes.error && chargesRes.error && ticketsRes.error) {
        throw projectsRes.error;
      }

      return {
        projects: projectsRes.projects,
        charges: chargesRes.charges,
        openTickets: ticketsRes.tickets.filter((t) => isTicketOpen(t.status)).length,
        pendingProposals: (proposalsRes.data ?? []) as Array<{
          id: string;
          title: string;
          status: string;
          total_amount: number;
        }>,
        pendingContracts: (contractsRes.data ?? []) as Array<{
          id: string;
          status: string;
          accepted_at: string | null;
        }>,
      };
    },
    enabled: !!clientId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
}
