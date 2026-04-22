import type { ReactNode } from "react";

import { Card, CardContent, cn } from "@/design-system";

export type AlertTone = "warning" | "destructive" | "info";

const TONE_STYLES: Record<AlertTone, { container: string; title: string }> = {
  warning: { container: "border-warning/40 bg-warning/5", title: "text-warning" },
  destructive: {
    container: "border-destructive/40 bg-destructive/5",
    title: "text-destructive",
  },
  info: { container: "border-primary/40 bg-primary/5", title: "text-primary" },
};

interface AlertBannerProps {
  tone: AlertTone;
  title: string;
  description?: string;
  /** Botao ou conjunto de botoes a direita. Em mobile ocupa largura total. */
  action?: ReactNode;
  className?: string;
}

/**
 * Banner de alerta padronizado. Substitui padroes divergentes espalhados
 * (Contracts, Projects, ClientOverview). Responsivo: empilha em mobile e
 * vira flex-row a partir de sm. Acao ocupa largura total em mobile.
 */
export default function AlertBanner({
  tone,
  title,
  description,
  action,
  className,
}: AlertBannerProps) {
  const styles = TONE_STYLES[tone];
  return (
    <Card className={cn(styles.container, className)}>
      <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-5">
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold", styles.title)}>{title}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </CardContent>
    </Card>
  );
}
