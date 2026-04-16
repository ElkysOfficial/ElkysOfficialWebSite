/**
 * Hook de despesas para o admin portal.
 *
 * Carrega todas as despesas operacionais (software, infra, pessoal, etc.)
 * ordenadas por data. Usado no calculo de burn rate e margem operacional.
 *
 * Usado por: Finance.tsx (aba despesas), Overview.tsx (metricas)
 * Cache: 2min stale, 10min garbage collection
 *
 * @example
 * const { data: expenses, isLoading } = useAdminExpenses();
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchExpenses() {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, description, category, amount, expense_date, notes, created_at")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function useAdminExpenses() {
  return useQuery({
    queryKey: ["admin-expenses"],
    queryFn: fetchExpenses,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
