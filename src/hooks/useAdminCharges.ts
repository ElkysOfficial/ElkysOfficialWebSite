/**
 * Hook de cobrancas (charges) para o admin portal.
 *
 * Carrega todas as cobrancas do sistema ordenadas por vencimento.
 * Inclui parcelas de projeto, mensalidades e cobrancas manuais.
 *
 * Usado por: Finance.tsx, Overview.tsx, ClientDetail.tsx
 * Cache: 1min stale, 10min garbage collection
 *
 * @example
 * const { data: charges, isLoading } = useAdminCharges();
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CHARGES_SELECT =
  "id, client_id, project_id, contract_id, subscription_id, installment_id, description, amount, due_date, paid_at, status, origin_type, is_historical, is_blocking";

async function fetchCharges() {
  const { data, error } = await supabase
    .from("charges")
    .select(CHARGES_SELECT)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function useAdminCharges() {
  return useQuery({
    queryKey: ["admin-charges"],
    queryFn: fetchCharges,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
