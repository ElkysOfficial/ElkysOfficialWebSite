import type { ComponentType, ReactNode } from "react";

import type { IconProps } from "@/assets/icons";
import { Card, CardContent, cn } from "@/design-system";

export type AlertTone = "warning" | "destructive" | "info";

const TONE_STYLES: Record<
  AlertTone,
  { container: string; title: string; iconWrap: string; iconText: string }
> = {
  warning: {
    container: "border-warning/40 bg-warning/5",
    title: "text-warning",
    iconWrap: "bg-warning/10",
    iconText: "text-warning",
  },
  destructive: {
    container: "border-destructive/40 bg-destructive/5",
    title: "text-destructive",
    iconWrap: "bg-destructive/10",
    iconText: "text-destructive",
  },
  info: {
    container: "border-primary/40 bg-primary/5",
    title: "text-primary",
    iconWrap: "bg-primary/10",
    iconText: "text-primary",
  },
};

interface AlertBannerProps {
  tone: AlertTone;
  title: string;
  description?: string;
  /** Icone opcional a esquerda do titulo. */
  icon?: ComponentType<IconProps>;
  /** Botao ou conjunto de botoes a direita. Em mobile ocupa largura total. */
  action?: ReactNode;
  className?: string;
}

/**
 * Banner de alerta padronizado. Substitui padroes divergentes espalhados
 * (Contracts, Projects, ClientOverview). Responsivo: empilha em mobile e
 * vira flex-row a partir de sm. Acao ocupa largura total em mobile.
 * Icone opcional segue o tone automaticamente.
 */
export default function AlertBanner({
  tone,
  title,
  description,
  icon: Icon,
  action,
  className,
}: AlertBannerProps) {
  const styles = TONE_STYLES[tone];
  return (
    <Card className={cn(styles.container, className)}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                styles.iconWrap
              )}
            >
              <Icon size={18} className={styles.iconText} />
            </div>
          )}
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold", styles.title)}>{title}</p>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </CardContent>
    </Card>
  );
}
