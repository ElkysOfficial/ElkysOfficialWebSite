import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchExpenses() {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, description, category, amount, expense_date, receipt_url, notes, created_at")
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
