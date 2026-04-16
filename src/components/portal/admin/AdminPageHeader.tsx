import type { ReactNode } from "react";

import { Hexagon } from "@/assets/icons";
import { Card, CardDescription, CardHeader, CardTitle, cn } from "@/design-system";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export default function AdminPageHeader({
  eyebrow = "Portal administrativo",
  title,
  description,
  action,
  className,
}: AdminPageHeaderProps) {
  return (
    <Card className={cn("overflow-hidden border-border/70 bg-card/90 shadow-card", className)}>
      <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Hexagon size={14} />
            <span>{eyebrow}</span>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed md:text-base">
              {description}
            </CardDescription>
          </div>
        </div>

        {action ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{action}</div> : null}
      </CardHeader>
    </Card>
  );
}
