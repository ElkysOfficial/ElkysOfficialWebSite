import type { Database } from "@/integrations/supabase/types";

export type PortalClient = Database["public"]["Tables"]["clients"]["Row"];
export type PortalProject = Database["public"]["Tables"]["projects"]["Row"];
export type PortalCharge = Database["public"]["Tables"]["charges"]["Row"];
export type PortalDocument = Database["public"]["Tables"]["documents"]["Row"];
export type PortalNextStep = Database["public"]["Tables"]["project_next_steps"]["Row"];
export type PortalTimelineEvent = Database["public"]["Tables"]["timeline_events"]["Row"];
export type PortalProjectContract = Database["public"]["Tables"]["project_contracts"]["Row"];
export type PortalProjectInstallment = Database["public"]["Tables"]["project_installments"]["Row"];
export type PortalProjectSubscription =
  Database["public"]["Tables"]["project_subscriptions"]["Row"];

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
type DocumentType = Database["public"]["Enums"]["document_type"];
type NextStepOwner = Database["public"]["Enums"]["next_step_owner"];
type NextStepStatus = Database["public"]["Enums"]["next_step_status"];
type ProjectInstallmentStatus = Database["public"]["Enums"]["project_installment_status"];

export type TicketStatus = "aberto" | "em_andamento" | "resolvido" | "fechado";
export type TicketPriority = "baixa" | "media" | "alta";
export type TicketCategory = "bug" | "duvida" | "acesso" | "financeiro" | "conteudo" | "outro";

export const PROJECT_STAGE_OPTIONS = [
  {
    order: 1,
    value: "Imersao e Diagnostico",
    label: "Imersao e Diagnostico",
    duration: "3 a 7 dias",
    summary: "Mapeamento do contexto, objetivos e restricoes do projeto.",
  },
  {
    order: 2,
    value: "Acordo Formal",
    label: "Acordo Formal",
    duration: "2 a 3 dias",
    summary: "Escopo validado, decisores alinhados e acordo formal confirmado.",
  },
  {
    order: 3,
    value: "Arquitetura",
    label: "Arquitetura",
    duration: "5 a 10 dias",
    summary: "Definicao da estrutura funcional, tecnica e da experiencia principal.",
  },
  {
    order: 4,
    value: "Engenharia",
    label: "Engenharia",
    duration: "Ciclos de 14 dias",
    summary: "Implementacao, refinamento e integracoes da solucao contratada.",
  },
  {
    order: 5,
    value: "Validacao & ativacao",
    label: "Validacao & ativacao",
    duration: "5 a 10 dias",
    summary: "Testes, ajustes finais, ativacao e preparo para entrada em operacao.",
  },
  {
    order: 6,
    value: "Evolucao",
    label: "Evolucao",
    duration: "Continuo",
    summary: "Melhorias, manutencao, iteracoes e crescimento continuo da entrega.",
  },
] as const;

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: "accent" | "success" | "warning" | "destructive" | "secondary" }
> = {
  negociacao: { label: "Negociacao", tone: "secondary" },
  em_andamento: { label: "Em desenvolvimento", tone: "accent" },
  concluido: { label: "Concluido", tone: "success" },
  pausado: { label: "Pausado", tone: "warning" },
  cancelado: { label: "Cancelado", tone: "destructive" },
};

export const CHARGE_STATUS_META: Record<
  InvoiceStatus,
  { label: string; tone: "accent" | "success" | "warning" | "destructive" | "secondary" }
> = {
  agendada: { label: "Futura", tone: "secondary" },
  pendente: { label: "Em aberto", tone: "warning" },
  pago: { label: "Pago", tone: "success" },
  atrasado: { label: "Em atraso", tone: "destructive" },
  cancelado: { label: "Cancelado", tone: "secondary" },
};

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  contrato: "Contrato",
  aditivo: "Aditivo",
  nota_fiscal: "Nota fiscal",
  codigo_fonte: "Material tecnico",
  outro: "Anexo",
};

export const NEXT_STEP_OWNER_LABEL: Record<NextStepOwner, string> = {
  elkys: "Elkys",
  cliente: "Cliente",
  compartilhado: "Compartilhado",
};

export const NEXT_STEP_STATUS_LABEL: Record<NextStepStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluido",
  cancelado: "Cancelado",
};

export const PROJECT_INSTALLMENT_STATUS_LABEL: Record<ProjectInstallmentStatus, string> = {
  agendada: "Agendada",
  pendente: "Pendente",
  paga: "Paga",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
};

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; tone: "accent" | "success" | "warning" | "destructive" | "secondary" }
> = {
  aberto: { label: "Aberto", tone: "warning" },
  em_andamento: { label: "Em andamento", tone: "accent" },
  resolvido: { label: "Resolvido", tone: "success" },
  fechado: { label: "Fechado", tone: "secondary" },
};

export const TICKET_PRIORITY_META: Record<
  TicketPriority,
  { label: string; tone: "accent" | "success" | "warning" | "destructive" | "secondary" }
> = {
  baixa: { label: "Baixa", tone: "secondary" },
  media: { label: "Media", tone: "warning" },
  alta: { label: "Alta", tone: "destructive" },
};

export const TICKET_CATEGORY_LABEL: Record<TicketCategory, string> = {
  bug: "Bug",
  duvida: "Duvida",
  acesso: "Acesso",
  financeiro: "Financeiro",
  conteudo: "Conteudo",
  outro: "Outro",
};

/**
 * Maps feminine installment status to the masculine charge status (invoice_status enum).
 * Used when displaying installment data alongside charge data.
 */
export function installmentStatusToChargeStatus(status: ProjectInstallmentStatus): InvoiceStatus {
  const map: Record<ProjectInstallmentStatus, InvoiceStatus> = {
    agendada: "agendada",
    pendente: "pendente",
    paga: "pago",
    atrasada: "atrasado",
    cancelada: "cancelado",
  };
  return map[status];
}

export function getClientDisplayName(
  client: Pick<PortalClient, "client_type" | "nome_fantasia" | "full_name">
) {
  if (client.client_type === "pj" && client.nome_fantasia) return client.nome_fantasia;
  return client.full_name;
}

export function formatPortalDate(date?: string | null) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatPortalDateTime(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getProjectSummary(
  project: Pick<PortalProject, "solution_type" | "client_visible_summary" | "description">
) {
  return (
    project.client_visible_summary ??
    project.description ??
    project.solution_type ??
    "Sem resumo disponivel."
  );
}

export function getProjectCurrentPhase(project: Pick<PortalProject, "current_stage">) {
  return project.current_stage?.trim() || "Sem etapa definida";
}

export function getProjectStageIndex(stage?: string | null) {
  if (!stage) return -1;
  return PROJECT_STAGE_OPTIONS.findIndex(
    (item) => item.value.toLowerCase() === stage.trim().toLowerCase()
  );
}

export function getProjectStageMeta(stage?: string | null) {
  const index = getProjectStageIndex(stage);
  return index >= 0 ? PROJECT_STAGE_OPTIONS[index] : null;
}

export function getProjectStatusForStage(stage?: string | null): ProjectStatus {
  const index = getProjectStageIndex(stage);

  if (index >= 0 && index <= 1) return "negociacao";
  if (index >= 2 && index <= 3) return "em_andamento";
  if (index >= 4) return "concluido";

  return "negociacao";
}

export function getStageStatusLabel(stage?: string | null) {
  return PROJECT_STATUS_META[getProjectStatusForStage(stage)].label;
}

export function syncProjectStatusWithStage(
  stage?: string | null,
  currentStatus?: ProjectStatus | null
): ProjectStatus {
  if (currentStatus === "pausado" || currentStatus === "cancelado") {
    return currentStatus;
  }

  return getProjectStatusForStage(stage);
}

export function getChargeDisplayDate(charge: Pick<PortalCharge, "due_date">) {
  return formatPortalDate(charge.due_date);
}

/**
 * Returns true if a project is operationally open (active workload).
 * Includes negociacao, em_andamento, pausado, and Evolucao-stage projects
 * (ongoing maintenance/hosting) even when their formal status is "concluido".
 */
export function isProjectOperationallyOpen(
  project: Pick<PortalProject, "status" | "current_stage">
): boolean {
  if (["negociacao", "em_andamento", "pausado"].includes(project.status)) return true;
  if (project.status === "concluido" && project.current_stage?.toLowerCase() === "evolucao")
    return true;
  return false;
}

/**
 * Returns the effective bucket for a project, treating Evolucao-concluido as em_andamento.
 */
export function getProjectEffectiveBucket(
  project: Pick<PortalProject, "status" | "current_stage">
): ProjectStatus {
  if (project.status === "concluido" && project.current_stage?.toLowerCase() === "evolucao") {
    return "em_andamento";
  }
  return project.status;
}
