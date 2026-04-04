import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Folder } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import StatusBadge from "@/components/portal/StatusBadge";
import { cn } from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { PROJECT_STATUS_META, formatPortalDate } from "@/lib/portal";
import { loadProjectsForClient, resolveClientForUser } from "@/lib/portal-data";

type ProjectListTab = "todos" | "em_curso" | "concluidos" | "pausados";

export default function ClientProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<
    Awaited<ReturnType<typeof loadProjectsForClient>>["projects"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [tab, setTab] = useState<ProjectListTab>("todos");

  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.id) {
        setProjects([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError(null);

      const clientRes = await resolveClientForUser(user.id);
      if (clientRes.error || !clientRes.client) {
        setPageError(clientRes.error?.message ?? "Cadastro do cliente nao encontrado.");
        setLoading(false);
        return;
      }

      const projectsRes = await loadProjectsForClient(clientRes.client.id);
      if (projectsRes.error) {
        setPageError(projectsRes.error.message);
        setLoading(false);
        return;
      }

      setProjects(projectsRes.projects);
      setLoading(false);
    };

    void loadProjects();
  }, [user?.id]);

  const orderedProjects = useMemo(() => projects, [projects]);
  const projectTabs = useMemo(
    () => [
      { key: "todos" as const, label: `Todos (${orderedProjects.length})` },
      {
        key: "em_curso" as const,
        label: `Em curso (${
          orderedProjects.filter((project) =>
            ["negociacao", "em_andamento"].includes(project.status)
          ).length
        })`,
      },
      {
        key: "concluidos" as const,
        label: `Concluidos (${orderedProjects.filter((project) => project.status === "concluido").length})`,
      },
      {
        key: "pausados" as const,
        label: `Pausados (${orderedProjects.filter((project) => project.status === "pausado").length})`,
      },
    ],
    [orderedProjects]
  );
  const filteredProjects = useMemo(() => {
    if (tab === "em_curso") {
      return orderedProjects.filter((project) =>
        ["negociacao", "em_andamento"].includes(project.status)
      );
    }
    if (tab === "concluidos") {
      return orderedProjects.filter((project) => project.status === "concluido");
    }
    if (tab === "pausados") {
      return orderedProjects.filter((project) => project.status === "pausado");
    }
    return orderedProjects;
  }, [orderedProjects, tab]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border border-border/50 bg-background/60"
          />
        ))}
      </div>
    );
  }

  if (pageError) {
    return (
      <AdminEmptyState
        icon={Folder}
        title="Nao foi possivel carregar seus projetos"
        description={pageError}
      />
    );
  }

  if (orderedProjects.length === 0) {
    return (
      <AdminEmptyState
        icon={Folder}
        title="Nenhum projeto vinculado"
        description="Quando novos projetos forem vinculados a sua conta, eles aparecerao aqui com status, andamento e proximos passos."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Meus projetos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe cada projeto como uma unidade separada, com status, etapa atual e contexto
            claro.
          </p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border/60 bg-card p-1">
        {projectTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "min-h-[40px] min-w-fit whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all",
              tab === item.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <AdminEmptyState
          icon={Folder}
          title="Nenhum projeto nesta guia"
          description="Quando houver projetos nesta categoria, eles aparecerao aqui."
        />
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => {
            const statusMeta = PROJECT_STATUS_META[project.status];

            return (
              <Link
                key={project.id}
                to={`/portal/cliente/projetos/${project.id}`}
                className="group grid grid-cols-1 items-center gap-x-6 gap-y-2 rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-all hover:border-primary/25 hover:bg-card sm:px-5 sm:py-4 md:grid-cols-[1fr_auto] md:gap-y-3"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </p>
                    <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Etapa atual: {project.current_stage}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inicio em {formatPortalDate(project.started_at)} · entrega prevista em{" "}
                    {formatPortalDate(project.expected_delivery_date)}
                  </p>
                </div>

                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">
                  Abrir projeto &rarr;
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
