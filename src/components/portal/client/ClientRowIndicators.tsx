import { cn } from "@/design-system";
import type { AdminClientIndicators } from "@/hooks/useAdminClients";

interface ClientRowIndicatorsProps {
  indicators?: AdminClientIndicators;
  className?: string;
}

interface IndicatorDef {
  key: keyof AdminClientIndicators;
  icon: string;
  label: string;
  title: string;
  classes: string;
}

/**
 * Cada indicador e um mini badge com emoji + label curto, com title
 * tooltip detalhando a situacao. A cor classes usa tokens do design
 * system (destructive, success, accent, warning) para manter coerencia
 * com o restante do portal.
 */
const INDICATOR_DEFS: IndicatorDef[] = [
  {
    key: "hasOverdueCharges",
    icon: "🔴",
    label: "Inadimplente",
    title: "Cliente tem cobranças em atraso ou vencidas não quitadas",
    classes: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  {
    key: "hasActiveProject",
    icon: "🟢",
    label: "Projeto ativo",
    title: "Pelo menos um projeto em andamento para este cliente",
    classes: "border-success/30 bg-success/10 text-success",
  },
  {
    key: "hasPendingProposal",
    icon: "⏳",
    label: "Proposta pendente",
    title: "Cliente tem proposta enviada aguardando aprovação",
    classes: "border-accent/30 bg-accent/10 text-accent",
  },
  {
    key: "contractExpiringSoon",
    icon: "📄",
    label: "Contrato vencendo",
    title: "Contrato termina nos próximos 30 dias — considere renovação",
    classes: "border-warning/30 bg-warning/10 text-warning",
  },
];

/**
 * Renderiza uma linha compacta de badges operacionais sobre um cliente,
 * calculados a partir das flags de useAdminClients. Exibe apenas os
 * indicadores verdadeiros para nao poluir a leitura — clientes "limpos"
 * nao mostram nada.
 */
export default function ClientRowIndicators({ indicators, className }: ClientRowIndicatorsProps) {
  if (!indicators) return null;
  const active = INDICATOR_DEFS.filter((def) => indicators[def.key]);
  if (active.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {active.map((def) => (
        <span
          key={def.key}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
            def.classes
          )}
          title={def.title}
        >
          <span aria-hidden="true">{def.icon}</span>
          <span>{def.label}</span>
        </span>
      ))}
    </div>
  );
}
