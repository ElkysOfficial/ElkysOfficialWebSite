/**
 * Sincronização explícita de charges de mensalidade.
 *
 * Esta função NUNCA deve ser chamada em useEffect/load de tela.
 * Auditoria 2026-04-15 identificou que rodar isso automaticamente ao
 * abrir Finance.tsx ou ProjectDetail.tsx fazia mutações silenciosas no
 * banco a cada navegação — admin não tinha visibilidade do que estava
 * sendo criado/atualizado e ainda foi a origem do bug do Ramiro
 * (charges historicas ressuscitando após delete).
 *
 * Use APENAS via ação manual explícita (botão "Sincronizar mensalidades")
 * ou idealmente via cron server-side futura.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { getSubscriptionCoverageEnd, listSubscriptionDueDates } from "./subscription-charges";

type SubscriptionRow = Pick<
  Database["public"]["Tables"]["project_subscriptions"]["Row"],
  | "id"
  | "client_id"
  | "project_id"
  | "amount"
  | "status"
  | "starts_on"
  | "due_day"
  | "ends_on"
  | "is_blocking"
  | "label"
>;

type ContractRow = Pick<
  Database["public"]["Tables"]["project_contracts"]["Row"],
  "id" | "project_id" | "ends_at"
>;

type ChargeRow = Pick<
  Database["public"]["Tables"]["charges"]["Row"],
  "id" | "subscription_id" | "due_date" | "status" | "is_historical"
>;

export type SyncResult = {
  inserted: number;
  scheduledFromPendente: number;
  pendenteFromScheduled: number;
};

/**
 * Reconcilia charges de mensalidade contra as subscriptions ativas:
 * - cria charges futuras faltando (mode="sync", nunca backfilla histórico);
 * - corrige status de charges futuras erroneamente marcadas como "pendente"
 *   para "agendada", e vice-versa para charges já vencidas marcadas como
 *   "agendada".
 *
 * Retorna contagem do que foi alterado, para o caller exibir feedback ao admin.
 */
export async function syncSubscriptionCharges(
  supabase: SupabaseClient<Database>,
  input: {
    subscriptions: SubscriptionRow[];
    contracts: ContractRow[];
    existingCharges: ChargeRow[];
  }
): Promise<SyncResult> {
  const { subscriptions, contracts, existingCharges } = input;

  const result: SyncResult = {
    inserted: 0,
    scheduledFromPendente: 0,
    pendenteFromScheduled: 0,
  };

  const syncableSubs = subscriptions.filter((s) => ["agendada", "ativa"].includes(s.status));
  if (syncableSubs.length === 0) return result;

  const todayStr = new Date().toISOString().slice(0, 10);

  const latestContractByProject = new Map<string, ContractRow>();
  for (const c of contracts) {
    if (!latestContractByProject.has(c.project_id)) {
      latestContractByProject.set(c.project_id, c);
    }
  }

  const existingKeys = new Set(
    existingCharges
      .filter((ch) => ch.subscription_id)
      .map((ch) => `${ch.subscription_id}__${ch.due_date}`)
  );

  const toInsert: {
    client_id: string;
    project_id: string;
    contract_id: string | null;
    subscription_id: string;
    origin_type: "mensalidade";
    description: string;
    amount: number;
    due_date: string;
    status: "agendada" | "pendente";
    is_blocking: boolean;
  }[] = [];

  for (const sub of syncableSubs) {
    const contract = latestContractByProject.get(sub.project_id) ?? null;
    const coverageEnd = getSubscriptionCoverageEnd(sub.ends_on, contract?.ends_at ?? null);
    const dueDates = listSubscriptionDueDates({
      startsOn: sub.starts_on,
      dueDay: sub.due_day,
      endsOn: coverageEnd,
      mode: "sync",
    });

    for (const dd of dueDates) {
      if (existingKeys.has(`${sub.id}__${dd}`)) continue;
      toInsert.push({
        client_id: sub.client_id,
        project_id: sub.project_id,
        contract_id: contract?.id ?? null,
        subscription_id: sub.id,
        origin_type: "mensalidade",
        description: sub.label,
        amount: Number(sub.amount),
        due_date: dd,
        status: dd > todayStr ? "agendada" : "pendente",
        is_blocking: sub.is_blocking,
      });
    }
  }

  // Corrige charges futuras marcadas como "pendente" → devem ser "agendada".
  const chargesToFixStatus = existingCharges.filter(
    (ch) =>
      ch.subscription_id && ch.status === "pendente" && ch.due_date > todayStr && !ch.is_historical
  );
  if (chargesToFixStatus.length > 0) {
    await supabase
      .from("charges")
      .update({ status: "agendada" })
      .in(
        "id",
        chargesToFixStatus.map((c) => c.id)
      );
    result.scheduledFromPendente = chargesToFixStatus.length;
  }

  // Corrige charges vencidas marcadas como "agendada" → devem ser "pendente".
  const chargesToMarkPendente = existingCharges.filter(
    (ch) =>
      ch.subscription_id && ch.status === "agendada" && ch.due_date <= todayStr && !ch.is_historical
  );
  if (chargesToMarkPendente.length > 0) {
    await supabase
      .from("charges")
      .update({ status: "pendente" })
      .in(
        "id",
        chargesToMarkPendente.map((c) => c.id)
      );
    result.pendenteFromScheduled = chargesToMarkPendente.length;
  }

  // Insere charges futuras faltando. Upsert + unique index garantem que
  // duplicatas são impossíveis mesmo em corrida.
  if (toInsert.length > 0) {
    const { error: upsertError } = await supabase
      .from("charges")
      .upsert(toInsert, { onConflict: "subscription_id,due_date", ignoreDuplicates: true });
    if (upsertError) {
      throw new Error(`Falha ao sincronizar mensalidades: ${upsertError.message}`);
    }
    result.inserted = toInsert.length;
  }

  return result;
}
