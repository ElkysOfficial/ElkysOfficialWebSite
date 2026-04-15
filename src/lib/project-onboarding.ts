/**
 * Onboarding/Kickoff de projeto — schema TS espelhando
 * projects.onboarding_checklist jsonb no DB.
 *
 * Auditoria PROBLEMA 6: o handoff Comercial → Dev nao tinha estrutura
 * para consolidar escopo/materiais/acessos antes de liberar execucao.
 * Esta lib + as colunas projects.onboarding_checklist + onboarding_completed_at
 * (migration 20260416150000) estruturam essa fase.
 */

export type OnboardingItemKey =
  | "scope_confirmed"
  | "materials_received"
  | "access_provided"
  | "schedule_aligned"
  | "team_assigned";

export type OnboardingOwner = "elkys" | "cliente" | "compartilhado";

export type OnboardingItem = {
  done: boolean;
  owner: OnboardingOwner;
  note: string;
};

export type OnboardingChecklist = Partial<Record<OnboardingItemKey, OnboardingItem>>;

export const ONBOARDING_ITEM_KEYS: OnboardingItemKey[] = [
  "scope_confirmed",
  "materials_received",
  "access_provided",
  "schedule_aligned",
  "team_assigned",
];

export const ONBOARDING_ITEM_LABEL: Record<OnboardingItemKey, string> = {
  scope_confirmed: "Escopo final confirmado",
  materials_received: "Materiais recebidos",
  access_provided: "Acessos liberados",
  schedule_aligned: "Cronograma alinhado",
  team_assigned: "Time interno definido",
};

export const ONBOARDING_ITEM_HINT: Record<OnboardingItemKey, string> = {
  scope_confirmed:
    "Reconfirmar com o cliente o escopo aprovado na proposta. Bloqueia mudanças tardias.",
  materials_received: "Brand kit, conteúdos, referências e qualquer asset necessário para começar.",
  access_provided: "Domínio, hospedagem, repositórios, contas de terceiros, integrações.",
  schedule_aligned: "Datas-chave, marcos de validação, janelas de disponibilidade do cliente.",
  team_assigned: "Designar responsáveis internos (PM, dev, design) e canais de comunicação.",
};

export const ONBOARDING_OWNER_LABEL: Record<OnboardingOwner, string> = {
  elkys: "Elkys",
  cliente: "Cliente",
  compartilhado: "Compartilhado",
};

const DEFAULT_OWNER: Record<OnboardingItemKey, OnboardingOwner> = {
  scope_confirmed: "elkys",
  materials_received: "cliente",
  access_provided: "cliente",
  schedule_aligned: "compartilhado",
  team_assigned: "elkys",
};

/**
 * Normaliza um jsonb cru vindo do Supabase em um checklist tipado.
 * Itens ausentes ganham valores default. Garante que a UI sempre tem
 * os 5 itens, mesmo se o projeto for antigo (pre-PROBLEMA-6) ou se
 * algum item foi removido manualmente.
 */
export function parseOnboardingChecklist(raw: unknown): OnboardingChecklist {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result: OnboardingChecklist = {};
  for (const key of ONBOARDING_ITEM_KEYS) {
    const item = obj[key];
    if (item && typeof item === "object") {
      const i = item as Partial<OnboardingItem>;
      result[key] = {
        done: Boolean(i.done),
        owner: (["elkys", "cliente", "compartilhado"] as const).includes(i.owner as OnboardingOwner)
          ? (i.owner as OnboardingOwner)
          : DEFAULT_OWNER[key],
        note: typeof i.note === "string" ? i.note : "",
      };
    } else {
      result[key] = { done: false, owner: DEFAULT_OWNER[key], note: "" };
    }
  }
  return result;
}

export function isOnboardingComplete(checklist: OnboardingChecklist): boolean {
  return ONBOARDING_ITEM_KEYS.every((key) => checklist[key]?.done === true);
}

export function countCompletedItems(checklist: OnboardingChecklist): number {
  return ONBOARDING_ITEM_KEYS.filter((key) => checklist[key]?.done === true).length;
}
