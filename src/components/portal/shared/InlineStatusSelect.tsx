import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ChevronRight } from "@/assets/icons";
import { cn } from "@/design-system";

export type InlineStatusTone =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive"
  | "secondary"
  | "muted";

const TONE_CLASS: Record<InlineStatusTone, string> = {
  primary: "bg-primary/10 text-primary hover:bg-primary/15",
  accent: "bg-accent/10 text-accent hover:bg-accent/15",
  success: "bg-success/10 text-success hover:bg-success/15",
  warning: "bg-warning/10 text-warning hover:bg-warning/15",
  destructive: "bg-destructive/10 text-destructive hover:bg-destructive/15",
  secondary: "bg-secondary text-muted-foreground hover:bg-secondary/80",
  muted: "bg-muted text-muted-foreground hover:bg-muted/80",
};

const TONE_DOT_CLASS: Record<InlineStatusTone, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  secondary: "bg-muted-foreground",
  muted: "bg-muted-foreground",
};

export type InlineStatusOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  tone: InlineStatusTone;
  /** Optional: hide this option dynamically (eg. invalid transition). */
  disabled?: boolean;
  /** Optional second line in the dropdown (eg. "Marca como recebido"). */
  hint?: string;
};

interface InlineStatusSelectProps<TValue extends string> {
  value: TValue;
  options: InlineStatusOption<TValue>[];
  onSelect: (value: TValue) => void | Promise<void>;
  /** When true, trigger fica desabilitado e nao abre o dropdown. */
  disabled?: boolean;
  /** Mostra um pulso sutil enquanto a mutation roda. */
  loading?: boolean;
  /** Stops row-click handlers from firing when used within a clickable row. */
  stopPropagation?: boolean;
  size?: "sm" | "md";
  className?: string;
  /** Optional aria-label override (default: "Mudar status"). */
  ariaLabel?: string;
}

/**
 * Trigger compacto estilo StatusBadge com chevron de affordance. Ao clicar,
 * abre um dropdown ancorado abaixo (ou acima, conforme espaco) listando as
 * opcoes permitidas. Selecao chama onSelect e fecha o popover.
 *
 * O componente nao executa mutation — o parent decide o que fazer com o
 * novo valor (ex: supabase.update + queryClient.invalidateQueries). Isso
 * mantem o componente puro e reutilizavel em qualquer entidade.
 */
export function InlineStatusSelect<TValue extends string>({
  value,
  options,
  onSelect,
  disabled = false,
  loading = false,
  stopPropagation = true,
  size = "sm",
  className,
  ariaLabel = "Mudar status",
}: InlineStatusSelectProps<TValue>) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"below" | "above">("below");
  const popoverId = useId();

  const current = options.find((opt) => opt.value === value);

  const closePopover = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePopover();
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, closePopover]);

  // Decide se o popover sobe ou desce com base no espaco disponivel no
  // viewport. Evita popover cortado em rows perto do final da tela.
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(options.length * 44 + 16, 280);
    setPosition(spaceBelow < estimatedHeight && rect.top > estimatedHeight ? "above" : "below");
  }, [open, options.length]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (disabled || loading) return;
    setOpen((v) => !v);
  };

  const handleOptionClick = async (e: React.MouseEvent, optValue: TValue) => {
    if (stopPropagation) e.stopPropagation();
    if (optValue === value) {
      setOpen(false);
      return;
    }
    setOpen(false);
    await onSelect(optValue);
  };

  const tone = current?.tone ?? "secondary";
  const label = current?.label ?? value;

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={`${ariaLabel}: atualmente ${label}`}
        title={disabled ? undefined : "Clique para mudar o status"}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide transition-colors",
          size === "sm" ? "min-h-[28px] px-2.5 text-xs" : "min-h-[32px] px-3 text-sm",
          TONE_CLASS[tone],
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          loading && "animate-pulse"
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT_CLASS[tone])} />
        <span className="truncate">{label}</span>
        <ChevronRight
          size={10}
          className={cn(
            "shrink-0 opacity-60 transition-transform duration-150",
            open ? "rotate-90" : position === "above" ? "-rotate-90" : "rotate-90"
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          id={popoverId}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute left-0 z-40 min-w-[200px] rounded-xl border border-border/75 bg-card p-1 shadow-xl",
            position === "below" ? "top-full mt-1.5" : "bottom-full mb-1.5"
          )}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            const optDisabled = opt.disabled === true;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={(e) => !optDisabled && handleOptionClick(e, opt.value)}
                disabled={optDisabled}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                  optDisabled
                    ? "cursor-not-allowed opacity-50"
                    : selected
                      ? "bg-background"
                      : "hover:bg-background/65"
                )}
              >
                <span
                  className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", TONE_DOT_CLASS[opt.tone])}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-xs font-semibold",
                      selected ? "text-foreground" : "text-foreground/90"
                    )}
                  >
                    {opt.label}
                  </span>
                  {opt.hint ? (
                    <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
                      {opt.hint}
                    </span>
                  ) : null}
                </span>
                {selected ? (
                  <span className="mt-1 text-[10px] font-semibold text-primary" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default InlineStatusSelect;
