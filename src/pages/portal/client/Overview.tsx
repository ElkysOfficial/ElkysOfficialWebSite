import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Clock, Folder, Headphones, Receipt } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import MetricTile from "@/components/portal/MetricTile";
import StatusBadge from "@/components/portal/StatusBadge";
import { buttonVariants, cn } from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { PROJECT_STATUS_META } from "@/lib/portal";
import {
  loadChargesForClient,
  loadProjectsForClient,
  loadSupportTicketsForClient,
  resolveClientForUser,
} from "@/lib/portal-data";
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
  const { user } = useAuth();
  const [projects, setProjects] = useState<
    Awaited<ReturnType<typeof loadProjectsForClient>>["projects"]
  >([]);
  const [charges, setCharges] = useState<
    Awaited<ReturnType<typeof loadChargesForClient>>["charges"]
  >([]);
  const [openTickets, setOpenTickets] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const financialItems = useMemo(
    () =>
      charges.map((charge) => ({
        id: charge.id,
        amount: charge.amount,
        dueDate: charge.due_date,
        description: charge.description,
        status: charge.status,
      })),
    [charges]
  );

  const nextFinancialItem = useMemo(
    () =>
      [...financialItems]
        .filter((item) => ["pendente", "atrasado"].includes(item.status))
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0] ?? null,
    [financialItems]
  );

  useEffect(() => {
    const loadOverview = async (background = false) => {
      if (!user?.id) {
        setProjects([]);
        setCharges([]);
        setOpenTickets(0);
        setHasLoaded(true);
        setLoading(false);
        return;
      }

      if (!background || !hasLoaded) {
        setLoading(true);
        setPageError(null);
      }

      const clientRes = await resolveClientForUser(user.id);
      if (clientRes.error || !clientRes.client) {
        if (!hasLoaded) {
          setPageError(clientRes.error?.message ?? "Cadastro do cliente nao encontrado.");
          setLoading(false);
        }
        return;
      }

      const [projectsRes, chargesRes, ticketsRes] = await Promise.all([
        loadProjectsForClient(clientRes.client.id),
        loadChargesForClient(clientRes.client.id),
        loadSupportTicketsForClient(clientRes.client.id),
      ]);

      const queryError = projectsRes.error ?? chargesRes.error ?? ticketsRes.error;
      if (queryError) {
        if (!hasLoaded) {
          setPageError(queryError.message);
          setLoading(false);
        }
        return;
      }

      setProjects(projectsRes.projects);
      setCharges(chargesRes.charges);
      setOpenTickets(
        ticketsRes.tickets.filter((ticket) => !["resolvido", "fechado"].includes(ticket.status))
          .length
      );
      setHasLoaded(true);
      setLoading(false);
    };

    const refreshOverview = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadOverview(true);
    };

    void loadOverview();

    const interval = window.setInterval(refreshOverview, 60000);
    window.addEventListener("focus", refreshOverview);
    document.addEventListener("visibilitychange", refreshOverview);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOverview);
      document.removeEventListener("visibilitychange", refreshOverview);
    };
  }, [hasLoaded, user?.id]);

  /* ── Loading skeleton ── */

  if (loading && !hasLoaded) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
        description={pageError}
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
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
          value={nextFinancialItem ? formatBRL(Number(nextFinancialItem.amount)) : "—"}
          icon={Receipt}
          tone={nextFinancialItem ? "warning" : "secondary"}
        />
        <MetricTile
          label="Tickets abertos"
          value={openTickets.toString()}
          icon={Headphones}
          tone={openTickets > 0 ? "accent" : "secondary"}
        />
      </div>

      {/* ── Next charge detail ── */}
      {nextFinancialItem && (
        <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Detalhe da proxima cobranca
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Vencimento dia {formatPortalDateLong(nextFinancialItem.dueDate)}.
            {nextFinancialItem.description ? ` ${nextFinancialItem.description}` : ""}
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
                  className="group grid grid-cols-1 items-center gap-x-6 gap-y-3 rounded-xl border border-border/50 bg-background/60 px-5 py-4 transition-all hover:border-primary/25 hover:bg-card md:grid-cols-[1fr_140px_120px]"
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
