import { useState } from "react";
import { CheckCircle, Clock, FileText, TrendingUp } from "@/assets/icons";
import { Button, cn } from "@/design-system";
import { formatPortalDateTime, type PortalTimelineEvent } from "@/lib/portal";

const PAGE_SIZE = 5;

const EVENT_META: Record<
  string,
  {
    icon: typeof Clock;
    accent: string;
    badge: string;
  }
> = {
  project_created: { icon: FileText, accent: "from-primary/30 to-primary/10", badge: "Projeto" },
  project_updated: {
    icon: FileText,
    accent: "from-primary/30 to-primary/10",
    badge: "Atualizacao",
  },
  project_stage_changed: {
    icon: TrendingUp,
    accent: "from-accent/30 to-accent/10",
    badge: "Etapa",
  },
  project_status_changed: { icon: Clock, accent: "from-warning/30 to-warning/10", badge: "Status" },
  next_step_created: { icon: Clock, accent: "from-warning/30 to-warning/10", badge: "Pendencia" },
  next_step_updated: { icon: Clock, accent: "from-warning/30 to-warning/10", badge: "Pendencia" },
  installment_updated: {
    icon: TrendingUp,
    accent: "from-primary/30 to-primary/10",
    badge: "Financeiro",
  },
  contract_created: { icon: FileText, accent: "from-primary/30 to-primary/10", badge: "Contrato" },
  subscription_created: {
    icon: CheckCircle,
    accent: "from-success/30 to-success/10",
    badge: "Mensalidade",
  },
  document_created: { icon: FileText, accent: "from-primary/30 to-primary/10", badge: "Documento" },
};

export default function ProjectTimelineFeed({
  events,
  emptyMessage,
}: {
  events: PortalTimelineEvent[];
  emptyMessage: string;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const shown = events.slice(0, visible);
  const hasMore = visible < events.length;

  return (
    <div className="space-y-4">
      <div className="relative space-y-4 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-8px)] before:w-px before:bg-border/70">
        {shown.map((event) => {
          const meta = EVENT_META[event.event_type] ?? EVENT_META.project_updated;
          const Icon = meta.icon;

          return (
            <article key={event.id} className="relative pl-12">
              <div className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-card">
                <div
                  className={cn(
                    "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-80",
                    meta.accent
                  )}
                />
                <Icon size={16} className="relative text-foreground" />
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/75 shadow-card">
                <div className="flex flex-col gap-3 border-b border-border/60 bg-card/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {meta.badge}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatPortalDateTime(event.occurred_at)}
                  </p>
                </div>
                <div className="px-4 py-4">
                  <p className="text-sm leading-relaxed text-foreground">{event.summary}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Carregar mais ({events.length - visible} restante
            {events.length - visible !== 1 ? "s" : ""})
          </Button>
        </div>
      )}
    </div>
  );
}
