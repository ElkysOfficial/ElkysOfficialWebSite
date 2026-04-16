import type { ComponentType, ReactNode } from "react";

import type { IconProps } from "@/assets/icons";
import { Card, CardContent, cn } from "@/design-system";

export type AdminEmptyStateVariant = "first-time" | "filtered" | "error";

interface AdminEmptyStateProps {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
  action?: ReactNode;
  /**
   * Ação secundária, tipicamente "Limpar filtros" quando variant é "filtered".
   * Renderizada ao lado da ação principal com estilo mais sutil.
   */
  secondaryAction?: ReactNode;
  /**
   * Controla o tratamento visual e a semântica do estado vazio.
   * - first-time (default): primeira visita, sem registros cadastrados
   * - filtered: filtros aplicados não retornaram resultado
   * - error: falha ao carregar dados
   */
  variant?: AdminEmptyStateVariant;
  className?: string;
}

const VARIANT_STYLES: Record<
  AdminEmptyStateVariant,
  { border: string; iconWrap: string; hint?: string }
> = {
  "first-time": {
    border: "border-dashed border-border/80 bg-card/80",
    iconWrap: "bg-primary-soft text-primary dark:bg-primary/15",
  },
  filtered: {
    border: "border-dashed border-border/60 bg-muted/20",
    iconWrap: "bg-muted/40 text-muted-foreground",
    hint: "Ajuste os filtros ou limpe a busca para ver mais resultados.",
  },
  error: {
    border: "border-dashed border-destructive/30 bg-destructive/5",
    iconWrap: "bg-destructive/10 text-destructive",
  },
};

export default function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "first-time",
  className,
}: AdminEmptyStateProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <Card className={cn("overflow-hidden", styles.border, className)}>
      <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-10 text-center">
        <div
          className={cn("flex h-14 w-14 items-center justify-center rounded-lg", styles.iconWrap)}
        >
          <Icon size={24} />
        </div>
        <div className="mx-auto space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {styles.hint && variant === "filtered" ? (
            <p className="mx-auto max-w-md text-xs text-muted-foreground/80">{styles.hint}</p>
          ) : null}
        </div>
        {action || secondaryAction ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {action}
            {secondaryAction}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
