import type { ComponentType, ReactNode } from "react";

import type { IconProps } from "@/assets/icons";
import { Card, CardContent, cn } from "@/design-system";

interface AdminEmptyStateProps {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export default function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <Card className={cn("overflow-hidden border-dashed border-border/80 bg-card/80", className)}>
      <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-soft text-primary dark:bg-primary/15">
          <Icon size={24} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
