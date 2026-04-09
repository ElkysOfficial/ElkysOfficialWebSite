import { useQuery } from "@tanstack/react-query";
import {
  loadChargesForClient,
  loadProjectsForClient,
  loadSupportTicketsForClient,
} from "@/lib/portal-data";

export function useClientOverview(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ["client-overview", clientId],
    queryFn: async () => {
      if (!clientId) throw new Error("Client ID is required");

      const [projectsRes, chargesRes, ticketsRes] = await Promise.all([
        loadProjectsForClient(clientId),
        loadChargesForClient(clientId),
        loadSupportTicketsForClient(clientId),
      ]);

      const queryError = projectsRes.error ?? chargesRes.error ?? ticketsRes.error;
      if (queryError) throw queryError;

      return {
        projects: projectsRes.projects,
        charges: chargesRes.charges,
        openTickets: ticketsRes.tickets.filter((t) => !["resolvido", "fechado"].includes(t.status))
          .length,
      };
    },
    enabled: !!clientId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
}
