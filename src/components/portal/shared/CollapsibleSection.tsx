import { useState, type ReactNode } from "react";
import { cn } from "@/design-system";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  /** Contador opcional exibido ao lado do título (ex: "4/6 campos preenchidos") */
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Seção colapsável acessível para dividir formulários densos em blocos
 * temáticos. Usa um <details>/<summary> nativo por baixo de uma camada
 * de estilos ELKYS, o que garante suporte a teclado e leitores de tela
 * sem JavaScript extra, ao mesmo tempo em que mantém o visual coerente
 * com os outros Cards do portal.
 */
export default function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  badge,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen((event.target as HTMLDetailsElement).open)}
      className={cn(
        "group overflow-hidden rounded-xl border border-border/60 bg-card/80",
        className
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition-colors",
          "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "[&::-webkit-details-marker]:hidden"
        )}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground transition-transform",
              "group-open:rotate-180"
            )}
          >
            ▾
          </span>
        </div>
      </summary>
      <div className="border-t border-border/60 px-4 py-4">{children}</div>
    </details>
  );
}
