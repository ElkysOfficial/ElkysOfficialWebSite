import { cn } from "@/design-system";

interface RecurringBadgeProps {
  className?: string;
  /**
   * Quando true, exibe apenas o icone (compacto). Default e false,
   * mostra icone + label "Recorrente".
   */
  iconOnly?: boolean;
}

/**
 * Icone inline de "ciclo recorrente" — duas setas em loop. Inline SVG
 * para nao depender de biblioteca de icones nem aumentar bundle.
 */
function RecurringIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 8a6 6 0 0 1 10.5-3.9" />
      <path d="M14 8a6 6 0 0 1-10.5 3.9" />
      <path d="M12.5 2v2.5h-2.5" />
      <path d="M3.5 14v-2.5h2.5" />
    </svg>
  );
}

/**
 * Badge visualmente distinto do StatusBadge padrao para sinalizar que
 * um projeto tem mensalidade/subscription ativa. Usa tom accent (ciano)
 * em vez de cinza secondary, com icone de ciclo e ring sutil pra
 * diferenciar de outros badges na mesma linha.
 *
 * Antes, o badge "Recorrente" era um StatusBadge generico cinza
 * indistinguivel do badge "Em andamento" ou outros status. Agora o
 * admin bate o olho e sabe imediatamente que aquele projeto gera
 * receita recorrente mensal.
 */
export default function RecurringBadge({ className, iconOnly = false }: RecurringBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent",
        "shadow-[0_0_0_1px_hsl(var(--elk-accent)/0.08)]",
        className
      )}
      title="Projeto com mensalidade recorrente ativa"
    >
      <RecurringIcon className="h-3 w-3" />
      {iconOnly ? null : <span>Recorrente</span>}
    </span>
  );
}
