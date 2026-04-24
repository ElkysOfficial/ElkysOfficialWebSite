import type { TicketStatus } from "./portal";

export type SlaBadge = {
  label: string;
  className: string;
  title: string;
};

/**
 * Calcula o badge de SLA de um ticket a partir do deadline absoluto,
 * do status e do timestamp da primeira resposta.
 *
 * Comportamento:
 *  - tickets sem deadline, resolvidos ou fechados => sem badge
 *  - se firstResponseAt ainda e null, o deadline mede o SLA de primeira
 *    resposta; caso contrario, mede o SLA de resolucao
 *  - tonalidade escala com a proximidade do vencimento
 *    (verde > 24h, amarelo < 24h, vermelho < 2h ou vencido)
 */
export function getSlaBadge(
  deadline: string | null,
  status: TicketStatus,
  firstResponseAt: string | null
): SlaBadge | null {
  if (!deadline) return null;
  if (status === "resolvido" || status === "fechado") return null;

  const deadlineMs = new Date(deadline).getTime();
  const nowMs = Date.now();
  const diffMs = deadlineMs - nowMs;
  const diffHours = diffMs / 3600000;

  const prefix = firstResponseAt ? "SLA resolução" : "SLA 1ª resposta";

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    const label =
      overdueHours < 24
        ? `${Math.round(overdueHours)}h atrasado`
        : `${Math.floor(overdueHours / 24)}d atrasado`;
    return {
      label: `SLA vencido · ${label}`,
      className: "bg-destructive/10 text-destructive",
      title: `${prefix} venceu há ${label}`,
    };
  }

  if (diffHours < 2) {
    return {
      label: `SLA em ${Math.max(1, Math.round(diffHours * 60))}min`,
      className: "bg-destructive/10 text-destructive",
      title: `${prefix} vence em menos de 2h`,
    };
  }

  if (diffHours < 24) {
    return {
      label: `SLA em ${Math.round(diffHours)}h`,
      className: "bg-warning/10 text-warning",
      title: `${prefix} vence hoje`,
    };
  }

  const days = Math.floor(diffHours / 24);
  return {
    label: `SLA em ${days}d`,
    className: "bg-success/10 text-success",
    title: `${prefix} vence em ${days} dia(s)`,
  };
}

/**
 * Texto explicativo mostrado ao cliente antes de abrir um ticket.
 * Usa o SLA contratado em `clients.sla_hours`, caindo no texto padrao
 * "em até 1 dia útil" quando a coluna nao esta preenchida.
 */
export function formatSlaPromise(slaHours: number | null | undefined): string {
  if (slaHours == null || slaHours <= 0) return "Respondemos em até 1 dia útil.";
  if (slaHours < 24) return `Respondemos em até ${slaHours}h úteis conforme seu contrato.`;
  const days = Math.round(slaHours / 24);
  return `Respondemos em até ${days} dia${days > 1 ? "s" : ""} útil${days > 1 ? "eis" : ""} conforme seu contrato.`;
}
