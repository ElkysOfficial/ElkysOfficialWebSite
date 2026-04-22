import { type ComponentType } from "react";

import { cn } from "@/design-system";
import type { IconProps } from "@/assets/icons";

export type MetricTone = "accent" | "warning" | "primary" | "secondary" | "success" | "destructive";

const METRIC_TONE: Record<MetricTone, { text: string; icon: string }> = {
  accent: { text: "text-accent", icon: "bg-accent/10 text-accent" },
  warning: { text: "text-warning", icon: "bg-warning/15 text-warning" },
  primary: { text: "text-primary", icon: "bg-primary-soft text-primary dark:bg-primary/15" },
  secondary: { text: "text-secondary", icon: "bg-secondary/15 text-secondary" },
  success: { text: "text-success", icon: "bg-success/15 text-success" },
  destructive: { text: "text-destructive", icon: "bg-destructive/15 text-destructive" },
};

export default function MetricTile({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  className,
}: {
  label: string;
  value: string;
  icon: ComponentType<IconProps>;
  tone?: MetricTone;
  hint?: string;
  className?: string;
}) {
  const t = METRIC_TONE[tone];
  return (
    <div
      className={cn(
        "flex min-h-[84px] items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:gap-4 sm:p-5",
        className
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", t.icon)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[11px]">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-lg font-semibold tabular-nums tracking-tight sm:text-xl",
            t.text
          )}
        >
          {value}
        </p>
        {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
