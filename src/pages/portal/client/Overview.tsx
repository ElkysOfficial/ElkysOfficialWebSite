import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Clock, Folder, Headphones, Receipt } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import MetricTile from "@/components/portal/MetricTile";
import StatusBadge from "@/components/portal/StatusBadge";
import { buttonVariants } from "@/design-system";
import { useClientId } from "@/hooks/useClientId";
import { useClientOverview } from "@/hooks/useClientOverview";
import { PROJECT_STATUS_META } from "@/lib/portal";
import { formatBRL } from "@/lib/masks";

/* ------------------------------------------------------------------ */
/*  Formatting helper                                                  */
/* ------------------------------------------------------------------ */

function formatPortalDateLong(date?: string | null) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ClientOverview() {
  const { data: client, isLoading: loadingClient, error: clientError } = useClientId();
  const { data, isLoading: loadingOverview, error: overviewError } = useClientOverview(client?.id);

  const projects = data?.projects ?? [];
  const charges = data?.charges ?? [];
  const openTickets = data?.openTickets ?? 0;

  const loading = loadingClient || loadingOverview;
  const pageError = clientError ?? overviewError;

  const nextCharge = useMemo(() => {
    const actionable = charges
      .filter((c) => ["pendente", "atrasado"].includes(c.status))
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    return actionable[0] ?? null;
  }, [charges]);

  /* ── Loading skeleton ── */

  if (loading && !data) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[76px] animate-pulse rounded-2xl border border-border/60 bg-card"
            />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[72px] animate-pulse rounded-xl border border-border/50 bg-card/60"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ── */

  if (pageError) {
    return (
      <AdminEmptyState
        icon={Folder}
        title="Nao foi possivel carregar sua visao geral"
        description={pageError instanceof Error ? pageError.message : String(pageError)}
      />
    );
  }

  /* ── Derived data ── */

  const activeProjects = projects.filter((project) => project.status !== "cancelado").length;
  const pausedProjects = projects.filter((project) => project.status === "pausado").length;
  const visibleProjects = projects.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* ── Metrics ── */}
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <MetricTile
          label="Projetos ativos"
          value={activeProjects.toString()}
          icon={Folder}
          tone="primary"
        />
        <MetricTile
          label="Pausados"
          value={pausedProjects.toString()}
          icon={Clock}
          tone={pausedProjects > 0 ? "warning" : "success"}
        />
        <MetricTile
          label="Proxima cobranca"
          value={nextCharge ? formatBRL(Number(nextCharge.amount)) : "—"}
          icon={Receipt}
          tone={nextCharge ? "warning" : "secondary"}
        />
        <MetricTile
          label="Tickets abertos"
          value={openTickets.toString()}
          icon={Headphones}
          tone={openTickets > 0 ? "accent" : "secondary"}
        />
      </div>

      {/* ── Next charge detail ── */}
      {nextCharge && (
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Detalhe da proxima cobranca
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Vencimento dia {formatPortalDateLong(nextCharge.due_date)}.
            {nextCharge.description ? ` ${nextCharge.description}` : ""}
          </p>
        </div>
      )}

      {/* ── Projects section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Meus projetos
          </p>
          <Link
            to="/portal/cliente/projetos"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todos
          </Link>
        </div>

        {visibleProjects.length === 0 ? (
          <AdminEmptyState
            icon={Folder}
            title="Nenhum projeto vinculado"
            description="Quando um projeto for associado a sua conta, ele aparecera aqui com andamento e proximos passos."
          />
        ) : (
          <div className="space-y-3">
            {visibleProjects.map((project) => {
              const statusMeta = PROJECT_STATUS_META[project.status];
              return (
                <Link
                  key={project.id}
                  to={`/portal/cliente/projetos/${project.id}`}
                  className="group grid grid-cols-1 items-center gap-x-6 gap-y-2 rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-all hover:border-primary/25 hover:bg-card sm:px-5 sm:py-4 md:grid-cols-[1fr_140px_120px] md:gap-y-3"
                >
                  {/* Col 1 — Project info */}
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {project.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      Etapa atual: {project.current_stage}
                    </p>
                  </div>

                  {/* Col 2 — Status */}
                  <div className="flex md:justify-center">
                    <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                  </div>

                  {/* Col 3 — Action */}
                  <div className="flex md:justify-end">
                    <span className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Abrir projeto
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
