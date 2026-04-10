import type { ComponentType } from "react";

import type { IconProps } from "@/assets/icons";
import { Card, CardContent, cn } from "@/design-system";

type MetricTone = "primary" | "accent" | "success" | "warning" | "destructive" | "secondary";

interface AdminMetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<IconProps>;
  tone?: MetricTone;
  className?: string;
}

const toneStyles: Record<MetricTone, { label: string; iconWrap: string }> = {
  primary: {
    label: "text-primary",
    iconWrap: "bg-primary-soft text-primary dark:bg-primary/15",
  },
  accent: {
    label: "text-accent",
    iconWrap: "bg-accent/10 text-accent",
  },
  success: {
    label: "text-success",
    iconWrap: "bg-success/15 text-success",
  },
  warning: {
    label: "text-warning",
    iconWrap: "bg-warning/15 text-warning",
  },
  destructive: {
    label: "text-destructive",
    iconWrap: "bg-destructive/15 text-destructive",
  },
  secondary: {
    label: "text-secondary",
    iconWrap: "bg-secondary/15 text-secondary",
  },
};

export default function AdminMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  className,
}: AdminMetricCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className={cn("border-border/70 bg-card shadow-card", className)}>
      <CardContent className="flex items-start justify-between gap-4 pt-5">
        <div className="min-w-0 space-y-2">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", styles.label)}>
            {label}
          </p>
          <p className="whitespace-nowrap text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-[28px]">
            {value}
          </p>
          {hint ? <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p> : null}
        </div>

        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60",
            styles.iconWrap
          )}
        >
          <Icon size={16} />
        </div>
      </CardContent>
    </Card>
  );
}
