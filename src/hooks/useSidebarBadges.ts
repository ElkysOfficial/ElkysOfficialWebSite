/**
 * Hook que calcula contadores de pendencia visiveis nos items do sidebar admin.
 *
 * Faz tres queries paralelas (tarefas, tickets, contratos) e agrega em numeros
 * que viram badges inline. O RLS do Supabase ja filtra por role — entao cada
 * role ve apenas os contadores que lhe cabem. Admins veem tudo.
 *
 * Revalida a cada 2 minutos e no foco da janela.
 */

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface SidebarBadges {
  tasksByCategory: Record<string, number>;
  tasksOverdueAll: number;
  ticketsSlaRisk: number;
  contractsValidating: number;
}

const EMPTY: SidebarBadges = {
  tasksByCategory: {},
  tasksOverdueAll: 0,
  ticketsSlaRisk: 0,
  contractsValidating: 0,
};

export function useSidebarBadges() {
  const { user } = useAuth();

  return useQuery<SidebarBadges>({
    queryKey: ["sidebar-badges", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const slaThreshold = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

      const [tasksRes, ticketsRes, contractsRes] = await Promise.all([
        supabase
          .from("team_tasks")
          .select("id, category")
          .lt("due_date", today)
          .neq("status", "concluida"),
        supabase
          .from("support_tickets")
          .select("id")
          .not("sla_deadline", "is", null)
          .lt("sla_deadline", slaThreshold)
          .in("status", ["aberto", "em_andamento"]),
        supabase.from("project_contracts").select("id").eq("status", "em_validacao"),
      ]);

      const tasks = (tasksRes.data ?? []) as Array<{ id: string; category: string }>;
      const tasksByCategory: Record<string, number> = {};
      for (const t of tasks) {
        tasksByCategory[t.category] = (tasksByCategory[t.category] ?? 0) + 1;
      }

      return {
        tasksByCategory,
        tasksOverdueAll: tasks.length,
        ticketsSlaRisk: (ticketsRes.data ?? []).length,
        contractsValidating: (contractsRes.data ?? []).length,
      };
    },
    enabled: !!user?.id,
    placeholderData: EMPTY,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function resolveBadgeValue(badges: SidebarBadges | undefined, key: string | undefined) {
  if (!badges || !key) return 0;
  if (key === "tasks:all") return badges.tasksOverdueAll;
  if (key.startsWith("tasks:")) return badges.tasksByCategory[key.slice(6)] ?? 0;
  if (key === "tickets:sla") return badges.ticketsSlaRisk;
  if (key === "contracts:validating") return badges.contractsValidating;
  return 0;
}
