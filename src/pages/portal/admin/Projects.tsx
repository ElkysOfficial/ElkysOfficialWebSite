import { useDeferredValue, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Clock, FileText, PiggyBank, Search, Wallet, Zap } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import PortalLoading from "@/components/portal/PortalLoading";
import useMinLoading from "@/hooks/useMinLoading";
import { useAdminProjects } from "@/hooks/useAdminProjects";
import RowActionMenu from "@/components/portal/RowActionMenu";
import StatusBadge from "@/components/portal/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, Button, Card, CardContent, Input, buttonVariants, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  PROJECT_STATUS_META,
  formatPortalDate,
  getClientDisplayName,
  isProjectOperationallyOpen,
} from "@/lib/portal";
import { formatBRL, toCents } from "@/lib/masks";
import type { ComponentType } from "react";
import type { IconProps } from "@/assets/icons";

const PAGE_SIZE = 8;

type PortalProject = Database["public"]["Tables"]["projects"]["Row"];
type PortalClient = Database["public"]["Tables"]["clients"]["Row"];
type StatusFilter = "all" | Database["public"]["Enums"]["project_status"];

function parseDateStart(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateEnd(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T23:59:59`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isProjectWithinContractWindow(project: PortalProject, referenceDate: Date) {
  const startedAt = parseDateStart(project.started_at);
  if (!startedAt || startedAt > referenceDate) return false;
  if (project.status === "cancelado") return false;

  const deliveredAt = parseDateEnd(project.delivered_at);
  if (deliveredAt) return deliveredAt >= referenceDate;

  return project.status !== "concluido";
}

/* ------------------------------------------------------------------ */
/*  Metric tile — uniform height, Apple-style density                 */
/* ------------------------------------------------------------------ */

type MetricTone = "accent" | "warning" | "primary" | "secondary";

const METRIC_TONE: Record<MetricTone, { text: string; icon: string }> = {
  accent: { text: "text-accent", icon: "bg-accent/10 text-accent" },
  warning: { text: "text-warning", icon: "bg-warning/10 text-warning" },
  primary: { text: "text-primary", icon: "bg-primary-soft text-primary dark:bg-primary/15" },
  secondary: { text: "text-secondary", icon: "bg-secondary/15 text-secondary" },
};

function MetricTile({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: ComponentType<IconProps>;
  tone?: MetricTone;
}) {
  const t = METRIC_TONE[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 sm:gap-4 sm:p-5">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10",
          t.icon
        )}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[11px]">
          {label}
        </p>
        <p className={cn("mt-0.5 text-lg font-semibold tracking-tight sm:text-xl", t.text)}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Row action menu                                                    */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Project row — table-like, uniform columns + action menu            */
/* ------------------------------------------------------------------ */

function ProjectRow({
  project,
  client,
  hasSubscription,
  onDelete,
  canDelete,
}: {
  project: PortalProject;
  client?: PortalClient;
  hasSubscription: boolean;
  onDelete: (project: PortalProject) => void;
  canDelete: boolean;
}) {
  const navigate = useNavigate();
  const meta = PROJECT_STATUS_META[project.status];

  const actions: { label: string; onClick: () => void; destructive?: boolean }[] = [
    {
      label: "Detalhe do projeto",
      onClick: () => navigate(`/portal/admin/projetos/${project.id}`),
    },
    {
      label: "Financeiro",
      onClick: () => navigate(`/portal/admin/projetos/${project.id}?tab=financeiro`),
    },
    {
      label: "Anexos",
      onClick: () => navigate(`/portal/admin/projetos/${project.id}?tab=documentos`),
    },
    {
      label: "Timeline",
      onClick: () => navigate(`/portal/admin/projetos/${project.id}?tab=timeline`),
    },
    ...(canDelete
      ? [{ label: "Excluir projeto", onClick: () => onDelete(project), destructive: true as const }]
      : []),
  ];

  return (
    <div className="group grid grid-cols-1 items-center gap-x-6 gap-y-2 rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-all hover:border-primary/25 hover:bg-card sm:px-5 sm:py-4 md:grid-cols-[1fr_140px_140px_160px_40px] md:gap-y-3">
      {/* Col 1 — Project info + actions (mobile: same row) */}
      <div className="flex items-start justify-between gap-2 md:contents">
        <Link to={`/portal/admin/projetos/${project.id}`} className="min-w-0">
          <p className="truncate text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-[15px]">
            {project.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            {client ? getClientDisplayName(client) : "—"}
            {project.solution_type ? ` · ${project.solution_type}` : ""}
          </p>
          {(project.tags ?? []).length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Link>

        {/* Mobile actions */}
        <div className="shrink-0 md:hidden">
          <RowActionMenu actions={actions} />
        </div>
      </div>

      {/* Mobile: secondary info in a compact layout */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:hidden">
        <StatusBadge label={meta.label} tone={meta.tone} />
        {hasSubscription ? <StatusBadge label="Recorrente" tone="secondary" /> : null}
        <span className="text-xs text-muted-foreground">{project.current_stage || "—"}</span>
        <span className="text-xs font-medium text-foreground">
          {formatPortalDate(project.expected_delivery_date)}
        </span>
      </div>

      {/* Col 2 — Status (desktop) */}
      <div className="hidden flex-wrap items-center gap-1.5 md:flex">
        <StatusBadge label={meta.label} tone={meta.tone} />
        {hasSubscription ? <StatusBadge label="Recorrente" tone="secondary" /> : null}
      </div>

      {/* Col 3 — Stage (desktop) */}
      <p className="hidden text-sm text-muted-foreground md:block">
        {project.current_stage || "—"}
      </p>

      {/* Col 4 — Dates (desktop) */}
      <div className="hidden md:block">
        <p className="whitespace-nowrap text-sm font-medium text-foreground">
          {formatPortalDate(project.expected_delivery_date)}
        </p>
        <p className="whitespace-nowrap text-xs text-muted-foreground">
          Inicio {formatPortalDate(project.started_at)}
        </p>
      </div>

      {/* Col 5 — Actions (desktop) */}
      <div className="hidden md:block">
        <RowActionMenu actions={actions} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Column header (table-like)                                        */
/* ------------------------------------------------------------------ */

function ColumnHeader() {
  return (
    <div className="hidden md:grid md:grid-cols-[1fr_140px_140px_160px_40px] gap-x-6 px-5 pb-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Projeto
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Status
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Etapa
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Entrega
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function AdminProjects() {
  const { isSuperAdmin } = useAuth();
  const {
    data: bundle,
    isLoading: loading,
    error: queryError,
    refetch: refetchProjects,
  } = useAdminProjects();
  const showLoading = useMinLoading(loading);
  const pageError = queryError?.message ?? null;

  const projects = useMemo(() => (bundle?.projects ?? []) as PortalProject[], [bundle?.projects]);
  const clientsMap = useMemo(
    () => Object.fromEntries(((bundle?.clients ?? []) as PortalClient[]).map((c) => [c.id, c])),
    [bundle?.clients]
  );
  const { subscriptionProjectIds, contractedValue } = useMemo(() => {
    if (!bundle) return { subscriptionProjectIds: new Set<string>(), contractedValue: 0 };
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const latestContractByProject = new Map<
      string,
      { total_amount: number | string; status: string }
    >();
    for (const contract of bundle.contracts as {
      project_id: string;
      total_amount: number | string;
      status: string;
    }[]) {
      if (!latestContractByProject.has(contract.project_id)) {
        latestContractByProject.set(contract.project_id, contract);
      }
    }
    const today = new Date();
    const cv =
      Array.from(latestContractByProject.entries())
        .filter(([projectId, contract]) => {
          if (contract.status === "cancelado") return false;
          const relatedProject = projectMap.get(projectId);
          if (!relatedProject) return false;
          return isProjectWithinContractWindow(relatedProject, today);
        })
        .reduce((sum, [, contract]) => sum + toCents(contract.total_amount), 0) / 100;
    const subs = new Set(
      ((bundle.subscriptions as { project_id: string; status: string }[]) ?? [])
        .filter((s) => ["agendada", "ativa", "pausada"].includes(s.status))
        .map((s) => s.project_id)
    );
    return { subscriptionProjectIds: subs, contractedValue: cv };
  }, [bundle, projects]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [projectToDelete, setProjectToDelete] = useState<PortalProject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, statusFilter, tagFilter]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const project of projects) {
      for (const tag of project.tags ?? []) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [projects]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const client = clientsMap[project.client_id];
        const clientName = client ? getClientDisplayName(client) : "";
        const matchesSearch =
          deferredSearch.length === 0 ||
          project.name.toLowerCase().includes(deferredSearch) ||
          (project.solution_type ?? "").toLowerCase().includes(deferredSearch) ||
          (project.current_stage ?? "").toLowerCase().includes(deferredSearch) ||
          clientName.toLowerCase().includes(deferredSearch);

        const matchesStatus = statusFilter === "all" || project.status === statusFilter;
        const matchesTag = !tagFilter || (project.tags ?? []).includes(tagFilter);

        return matchesSearch && matchesStatus && matchesTag;
      }),
    [clientsMap, deferredSearch, projects, statusFilter, tagFilter]
  );

  const visibleProjects = filteredProjects.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));

  const { totalProjects, activeProjects, pausedProjects } = useMemo(
    () => ({
      totalProjects: projects.length,
      activeProjects: projects.filter(isProjectOperationallyOpen).length,
      pausedProjects: projects.filter((project) => project.status === "pausado").length,
    }),
    [projects]
  );

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeleteLoading(true);

    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectToDelete.id);

      if (error) {
        toast.error("Nao foi possivel excluir o projeto.", { description: error.message });
        return;
      }

      toast.success("Projeto excluido. Contratos, financeiro e dados vinculados foram removidos.");
      setProjectToDelete(null);
      void refetchProjects();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nao foi possivel excluir o projeto.";
      toast.error("Erro ao excluir projeto.", { description: message });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (showLoading) return <PortalLoading />;

  return (
    <div className="space-y-8">
      <AlertDialog
        open={projectToDelete !== null}
        title="Excluir projeto"
        description={`Tem certeza que deseja excluir "${projectToDelete?.name ?? ""}"? Esta acao nao pode ser desfeita. Contratos, parcelas, mensalidades, documentos e toda a timeline vinculada serao removidos permanentemente.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        loading={deleteLoading}
        loadingLabel="Excluindo..."
        onConfirm={() => void handleDeleteProject()}
        onCancel={() => setProjectToDelete(null)}
      />

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Projetos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalProjects} projeto{totalProjects !== 1 ? "s" : ""} registrado
            {totalProjects !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/portal/admin/projetos/novo" className={buttonVariants({ variant: "default" })}>
          Novo projeto
        </Link>
      </div>

      {/* ── Metrics — uniform 4-col grid ── */}
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <MetricTile label="Ativos" value={activeProjects.toString()} icon={Zap} tone="accent" />
        <MetricTile
          label="Pausados"
          value={pausedProjects.toString()}
          icon={Clock}
          tone="warning"
        />
        <MetricTile
          label="Carteira"
          value={totalProjects.toString()}
          icon={Wallet}
          tone="primary"
        />
        <MetricTile
          label="Valor contratado"
          value={formatBRL(contractedValue)}
          icon={PiggyBank}
          tone="secondary"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar projeto, cliente ou etapa..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-48"
        >
          <option value="all">Todos os status</option>
          {Object.entries(PROJECT_STATUS_META).map(([status, meta]) => (
            <option key={status} value={status}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mr-1">
            Tags:
          </span>
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              tagFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Todas
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                tagFilter === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* ── Project list ── */}
      {pageError ? (
        <AdminEmptyState
          icon={FileText}
          title="Nao foi possivel carregar os projetos"
          description={`${pageError} Atualize a pagina ou tente novamente em instantes.`}
          action={
            <Button type="button" onClick={() => void refetchProjects()}>
              Tentar novamente
            </Button>
          }
        />
      ) : filteredProjects.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="Nenhum projeto encontrado"
          description="Ajuste os filtros ou crie um novo projeto para um cliente existente."
          action={
            <Link
              to="/portal/admin/projetos/novo"
              className={buttonVariants({ variant: "default" })}
            >
              Criar projeto
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          <ColumnHeader />

          {visibleProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              client={clientsMap[project.client_id]}
              hasSubscription={subscriptionProjectIds.has(project.id)}
              onDelete={setProjectToDelete}
              canDelete={isSuperAdmin}
            />
          ))}

          {/* ── Pagination ── */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                {page + 1} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Proxima
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
