import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AgileMono, Clock, Shield, Target } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import StatusBadge from "@/components/portal/StatusBadge";
import { Button, Card, CardContent, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  PROJECT_STATUS_META,
  formatPortalDate,
  getClientDisplayName,
  getProjectCurrentPhase,
} from "@/lib/portal";

type ProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  | "id"
  | "client_id"
  | "name"
  | "status"
  | "current_stage"
  | "expected_delivery_date"
  | "started_at"
  | "delivered_at"
  | "solution_type"
>;

type ClientRow = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "full_name" | "client_type" | "nome_fantasia"
>;

type PipelineProject = ProjectRow & { client: ClientRow; isOverdue: boolean };

type ColumnKey = "negociacao" | "em_andamento" | "pausado" | "concluido";

const COLUMNS: {
  key: ColumnKey;
  label: string;
  tone: "secondary" | "accent" | "warning" | "success";
}[] = [
  { key: "negociacao", label: "Negociacao", tone: "secondary" },
  { key: "em_andamento", label: "Em desenvolvimento", tone: "accent" },
  { key: "pausado", label: "Pausado", tone: "warning" },
  { key: "concluido", label: "Concluido", tone: "success" },
];

const COLUMN_ACCENT: Record<ColumnKey, string> = {
  negociacao: "border-t-secondary",
  em_andamento: "border-t-accent",
  pausado: "border-t-warning",
  concluido: "border-t-success",
};

const COLUMN_COUNT_BG: Record<ColumnKey, string> = {
  negociacao: "bg-secondary/15 text-secondary-foreground",
  em_andamento: "bg-accent/15 text-accent",
  pausado: "bg-warning/15 text-warning",
  concluido: "bg-success/15 text-success",
};

function Skeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[400px] animate-pulse rounded-2xl border border-border/70 bg-card/70"
        />
      ))}
    </div>
  );
}

function ProjectCard({ project }: { project: PipelineProject }) {
  const statusMeta = PROJECT_STATUS_META[project.status as keyof typeof PROJECT_STATUS_META];

  return (
    <Link
      to={`/portal/admin/projetos/${project.id}`}
      className="block rounded-xl border border-border/60 bg-background/70 p-3 transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
            {project.name}
          </h4>
          {project.isOverdue && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
              <Clock size={10} />
              Atrasado
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{getClientDisplayName(project.client)}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          {statusMeta && <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />}
          {project.solution_type && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {project.solution_type}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Etapa: {getProjectCurrentPhase(project)}</span>
          {project.expected_delivery_date && (
            <span>Prev: {formatPortalDate(project.expected_delivery_date)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Pipeline() {
  const [projects, setProjects] = useState<PipelineProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [projectsRes, clientsRes] = await Promise.all([
      supabase
        .from("projects")
        .select(
          "id, client_id, name, status, current_stage, expected_delivery_date, started_at, delivered_at, solution_type"
        )
        .neq("status", "cancelado"),
      supabase.from("clients").select("id, full_name, client_type, nome_fantasia"),
    ]);

    const hardError = projectsRes.error ?? clientsRes.error;
    if (hardError) {
      setError(hardError.message);
      setLoading(false);
      return;
    }

    const projectsData = (projectsRes.data ?? []) as ProjectRow[];
    const clientsData = (clientsRes.data ?? []) as ClientRow[];
    const clientMap = new Map(clientsData.map((c) => [c.id, c]));
    const todayStr = new Date().toISOString().slice(0, 10);

    const merged: PipelineProject[] = projectsData.map((project) => ({
      ...project,
      client: clientMap.get(project.client_id) ?? {
        id: project.client_id,
        full_name: "Cliente desconhecido",
        client_type: "pf" as const,
        nome_fantasia: null,
      },
      isOverdue:
        project.status === "em_andamento" &&
        !!project.expected_delivery_date &&
        project.expected_delivery_date < todayStr &&
        !project.delivered_at,
    }));

    setProjects(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const grouped = useMemo(() => {
    const map: Record<ColumnKey, PipelineProject[]> = {
      negociacao: [],
      em_andamento: [],
      pausado: [],
      concluido: [],
    };

    for (const project of projects) {
      const key = project.status as ColumnKey;
      if (key in map) {
        map[key].push(project);
      }
    }

    return map;
  }, [projects]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <AdminEmptyState
        icon={Target}
        title="Erro ao carregar pipeline"
        description={error}
        action={
          <Button type="button" onClick={() => void loadData()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  if (projects.length === 0) {
    return (
      <AdminEmptyState
        icon={AgileMono}
        title="Nenhum projeto cadastrado"
        description="Cadastre projetos para visualizar o pipeline de entregas."
        action={
          <Button asChild>
            <Link to="/portal/admin/projetos/novo">Novo projeto</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <Card className="rounded-2xl border-border/80 bg-card/95">
        <CardContent className="flex flex-wrap items-center gap-4 p-3 sm:p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {projects.length} projeto(s) no pipeline
          </span>
          <span className="h-4 w-px bg-border/60" />
          {COLUMNS.map((col) => (
            <span key={col.key} className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                  COLUMN_COUNT_BG[col.key]
                )}
              >
                {grouped[col.key].length}
              </span>
              <span className="text-muted-foreground">{col.label}</span>
            </span>
          ))}
        </CardContent>
      </Card>

      {/* Kanban board */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={cn(
              "flex flex-col rounded-2xl border border-border/70 border-t-[3px] bg-card/60",
              COLUMN_ACCENT[col.key]
            )}
          >
            {/* Column header */}
            <div className="flex items-center justify-between p-3 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {col.label}
              </h3>
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                  COLUMN_COUNT_BG[col.key]
                )}
              >
                {grouped[col.key].length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 px-2 pb-3">
              {grouped[col.key].length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl bg-muted/20 p-6">
                  <p className="text-center text-xs text-muted-foreground">Nenhum projeto</p>
                </div>
              ) : (
                grouped[col.key].map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
