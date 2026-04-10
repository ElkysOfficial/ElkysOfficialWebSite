import { useQuery } from "@tanstack/react-query";
import {
  loadChargesForClient,
  loadProjectsForClient,
  loadSupportTicketsForClient,
} from "@/lib/portal-data";
import { isTicketOpen } from "@/lib/portal";

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

      // If ALL queries failed, throw so React Query shows error state
      if (projectsRes.error && chargesRes.error && ticketsRes.error) {
        throw projectsRes.error;
      }

      // Return partial data — consumers already fallback with ?? [] / ?? 0
      return {
        projects: projectsRes.projects,
        charges: chargesRes.charges,
        openTickets: ticketsRes.tickets.filter((t) => isTicketOpen(t.status)).length,
      };
    },
    enabled: !!clientId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
}
