/**
 * Diagnostico estruturado de lead — schema TS espelhando leads.diagnosis
 * jsonb no DB. Inclui helper para gerar template de scope_summary que
 * pre-popula propostas criadas a partir do lead.
 *
 * Auditoria PROBLEMA 5: a etapa de Diagnostico do fluxo CRM nao tinha
 * onde guardar contexto/problema/objetivo. Esta lib + a coluna
 * leads.diagnosis (migration 20260416140000) preenchem esse buraco sem
 * criar nova tabela — schema bem definido em jsonb.
 */

export type LeadUrgency = "baixa" | "media" | "alta" | "critica";

export type LeadDiagnosis = {
  context?: string | null;
  problem?: string | null;
  objective?: string | null;
  urgency?: LeadUrgency | null;
  expectation?: string | null;
  initial_scope?: string | null;
  constraints?: string | null;
  business_impact?: string | null;
  concluded_at?: string | null;
};

export const URGENCY_OPTIONS: { value: LeadUrgency; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export const URGENCY_LABEL: Record<LeadUrgency, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export function isDiagnosisConcluded(diagnosis: LeadDiagnosis | null | undefined): boolean {
  return Boolean(diagnosis?.concluded_at);
}

/**
 * True quando o diagnostico tem ao menos os campos minimos preenchidos
 * para ser considerado "consolidado" — contexto + problema + objetivo.
 */
export function hasMinimalDiagnosis(diagnosis: LeadDiagnosis | null | undefined): boolean {
  if (!diagnosis) return false;
  return Boolean(
    diagnosis.context?.trim() && diagnosis.problem?.trim() && diagnosis.objective?.trim()
  );
}

/**
 * Gera template de scope_summary a partir do diagnostico.
 * Usado para pre-popular o campo de escopo quando uma proposta e criada
 * a partir de um lead com diagnostico concluido.
 */
export function buildScopeSummaryFromDiagnosis(
  diagnosis: LeadDiagnosis | null | undefined
): string {
  if (!diagnosis) return "";
  const sections: string[] = [];
  if (diagnosis.context?.trim()) {
    sections.push(`Contexto:\n${diagnosis.context.trim()}`);
  }
  if (diagnosis.problem?.trim()) {
    sections.push(`Problema identificado:\n${diagnosis.problem.trim()}`);
  }
  if (diagnosis.objective?.trim()) {
    sections.push(`Objetivo:\n${diagnosis.objective.trim()}`);
  }
  if (diagnosis.initial_scope?.trim()) {
    sections.push(`Escopo inicial:\n${diagnosis.initial_scope.trim()}`);
  }
  if (diagnosis.business_impact?.trim()) {
    sections.push(`Impacto no negocio:\n${diagnosis.business_impact.trim()}`);
  }
  if (diagnosis.constraints?.trim()) {
    sections.push(`Restricoes:\n${diagnosis.constraints.trim()}`);
  }
  return sections.join("\n\n");
}

/**
 * Type guard: parsing seguro do jsonb vindo do Supabase.
 */
export function parseLeadDiagnosis(raw: unknown): LeadDiagnosis | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as LeadDiagnosis;
}
