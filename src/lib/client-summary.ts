/**
 * Cliente 360 — resumo calculado em tempo real.
 *
 * Le da view client_financial_summary (PROBLEMAs P-006 + P10) que
 * computa monthly_value, project_total_value, contract_status,
 * contract_type, contract_start, contract_end, scope_summary,
 * payment_due_day a partir dos dados primarios em project_contracts,
 * project_subscriptions e charges. Substitui os snapshots driftados
 * em clients (que ficam como legado ate todos os consumidores migrarem).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ClientFinancialSummary = Database["public"]["Views"]["client_financial_summary"]["Row"];

/**
 * Carrega resumo calculado de um cliente. Retorna `null` em caso de
 * erro ou se o cliente nao existe — o caller deve fallback para os
 * snapshots legados em clients.* se preciso.
 */
export async function getClientFinancialSummary(
  clientId: string
): Promise<ClientFinancialSummary | null> {
  const { data, error } = await supabase
    .from("client_financial_summary")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) return null;
  return (data as ClientFinancialSummary | null) ?? null;
}
