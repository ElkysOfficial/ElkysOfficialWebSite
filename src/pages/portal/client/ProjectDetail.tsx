import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { FileText } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import StatusBadge from "@/components/portal/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle, buttonVariants, cn } from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import {
  CHARGE_STATUS_META,
  DOCUMENT_TYPE_LABEL,
  NEXT_STEP_OWNER_LABEL,
  PROJECT_STATUS_META,
  formatPortalDate,
  formatPortalDateTime,
  getProjectSummary,
} from "@/lib/portal";
import {
  loadChargesForProject,
  loadDocumentsForProject,
  loadNextStepsForProject,
  loadProjectById,
  loadSubscriptionsForProject,
  loadTimelineForProject,
  resolveClientForUser,
} from "@/lib/portal-data";
import { formatBRL } from "@/lib/masks";

type ClientProjectTab = "detalhes" | "pagamentos" | "documentos" | "historico";

function getNonRedundantProjectSummary(project: {
  name: string;
  solution_type?: string | null;
  client_visible_summary?: string | null;
  description?: string | null;
}) {
  const summary = getProjectSummary(project).trim();
  const normalizedSummary = summary.toLowerCase();
  const normalizedName = project.name.trim().toLowerCase();
  const normalizedSolutionType = (project.solution_type ?? "").trim().toLowerCase();

  if (!summary) return null;
  if (normalizedSummary === normalizedName) return null;
  if (normalizedSolutionType && normalizedSummary === normalizedSolutionType) return null;

  return summary;
}

export default function ClientProjectDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [project, setProject] =
    useState<Awaited<ReturnType<typeof loadProjectById>>["project"]>(null);
  const [charges, setCharges] = useState<
    Awaited<ReturnType<typeof loadChargesForProject>>["charges"]
  >([]);
  const [subscriptions, setSubscriptions] = useState<
    Awaited<ReturnType<typeof loadSubscriptionsForProject>>["subscriptions"]
  >([]);
  const [nextSteps, setNextSteps] = useState<
    Awaited<ReturnType<typeof loadNextStepsForProject>>["nextSteps"]
  >([]);
  const [timeline, setTimeline] = useState<
    Awaited<ReturnType<typeof loadTimelineForProject>>["events"]
  >([]);
  const [documents, setDocuments] = useState<
    Awaited<ReturnType<typeof loadDocumentsForProject>>["documents"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [tab, setTab] = useState<ClientProjectTab>("detalhes");

  const financialItems = useMemo(
    () =>
      charges
        .filter((charge) => charge.origin_type !== "mensalidade" && !charge.installment_id)
        .map((charge) => ({
          id: charge.id,
          label: charge.description,
          amount: charge.amount,
          dueDate: charge.due_date,
          status: CHARGE_STATUS_META[charge.status],
        })),
    [charges]
  );

  useEffect(() => {
    const loadProject = async () => {
      if (!user?.id || !id) {
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

      const projectRes = await loadProjectById(id);
      if (
        projectRes.error ||
        !projectRes.project ||
        projectRes.project.client_id !== clientRes.client.id
      ) {
        setPageError(projectRes.error?.message ?? "Projeto nao encontrado.");
        setLoading(false);
        return;
      }

      const [chargesRes, subscriptionsRes, nextStepsRes, timelineRes, docsRes] = await Promise.all([
        loadChargesForProject(projectRes.project.id, clientRes.client.id),
        loadSubscriptionsForProject(projectRes.project.id),
        loadNextStepsForProject(projectRes.project.id, true),
        loadTimelineForProject(projectRes.project.id, true),
        loadDocumentsForProject(clientRes.client.id, projectRes.project.id),
      ]);

      const queryError =
        chargesRes.error ??
        subscriptionsRes.error ??
        nextStepsRes.error ??
        timelineRes.error ??
        docsRes.error;

      if (queryError) {
        setPageError(queryError.message);
        setLoading(false);
        return;
      }

      setProject(projectRes.project);
      setCharges(chargesRes.charges);
      setSubscriptions(subscriptionsRes.subscriptions);
      setNextSteps(nextStepsRes.nextSteps);
      setTimeline(timelineRes.events);
      setDocuments(docsRes.documents);
      setLoading(false);
    };

    void loadProject();
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[72px] animate-pulse rounded-xl border border-border/50 bg-card/60"
          />
        ))}
      </div>
    );
  }

  if (!project || pageError) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="Projeto nao encontrado"
        description={pageError ?? "Nao foi possivel localizar este projeto no seu portal."}
        action={
          <Link to="/portal/cliente/projetos" className={buttonVariants({ variant: "default" })}>
            Voltar para projetos
          </Link>
        }
      />
    );
  }

  const statusMeta = PROJECT_STATUS_META[project.status];
  const projectSummary = getNonRedundantProjectSummary(project);
  const projectTabs: { key: ClientProjectTab; label: string }[] = [
    { key: "detalhes", label: "Detalhes" },
    { key: "pagamentos", label: "Pagamentos" },
    { key: "documentos", label: `Anexos (${documents.length})` },
    { key: "historico", label: `Historico (${timeline.length})` },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/92">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
              </div>
              <p className="text-sm text-muted-foreground">Etapa atual: {project.current_stage}</p>
            </div>

            <Link to="/portal/cliente/projetos" className={buttonVariants({ variant: "outline" })}>
              Voltar
            </Link>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-6 text-sm text-muted-foreground md:flex-row md:flex-wrap md:items-center md:gap-4">
          <p>Inicio em {formatPortalDate(project.started_at)}</p>
          <span className="hidden h-1 w-1 rounded-full bg-border md:block" />
          <p>Entrega prevista em {formatPortalDate(project.expected_delivery_date)}</p>
          {projectSummary ? (
            <>
              <span className="hidden h-1 w-1 rounded-full bg-border md:block" />
              <p className="text-foreground/90">{projectSummary}</p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border/60 bg-card p-1">
        {projectTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`min-w-fit rounded-md px-3 py-2 text-sm font-medium transition-all ${
              tab === item.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "detalhes" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/70 bg-card/92">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base">Visao do projeto</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <div className="rounded-xl border border-border/50 bg-background/60 px-5 py-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Situacao atual
                </p>
                <p className="mt-2 text-sm text-foreground leading-relaxed">
                  {projectSummary ??
                    "O projeto segue disponivel no portal com acompanhamento ativo da Elkys."}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Inicio
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatPortalDate(project.started_at)}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Entrega prevista
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatPortalDate(project.expected_delivery_date)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/92">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base">Proximos passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {nextSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum proximo passo compartilhado no momento.
                </p>
              ) : (
                nextSteps.map((stepItem) => (
                  <div
                    key={stepItem.id}
                    className="rounded-xl border border-border/50 bg-background/60 px-5 py-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{stepItem.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Responsavel: {NEXT_STEP_OWNER_LABEL[stepItem.owner]}
                    </p>
                    {stepItem.description ? (
                      <p className="mt-2 text-sm text-foreground">{stepItem.description}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "pagamentos" ? (
        <div className="space-y-5">
          {/* Summary metric tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-card/80 p-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Assinaturas ativas
              </p>
              <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
                {subscriptions.filter((s) => s.status === "ativa").length}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/80 p-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Próxima cobrança
              </p>
              <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
                {(() => {
                  const next = charges
                    .filter(
                      (c) =>
                        c.origin_type !== "mensalidade" &&
                        (c.status === "pendente" || c.status === "agendada")
                    )
                    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))[0];
                  return next?.due_date ? formatPortalDate(next.due_date) : "—";
                })()}
              </p>
            </div>
            {(() => {
              const openCount = charges.filter(
                (c) =>
                  c.origin_type !== "mensalidade" &&
                  (c.status === "pendente" || c.status === "atrasado")
              ).length;
              return (
                <div
                  className={cn(
                    "col-span-2 rounded-xl border bg-card/80 p-4 sm:col-span-1",
                    openCount > 0 ? "border-destructive/40" : "border-border/50"
                  )}
                >
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Cobranças em aberto
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-xl font-bold tabular-nums",
                      openCount > 0 ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {openCount}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Subscriptions + Charges */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="border-border/70 bg-card/92">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base">Assinaturas mensais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {subscriptions.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">
                    Nenhuma assinatura recorrente vinculada a este projeto.
                  </p>
                ) : (
                  subscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/60 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {subscription.label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatBRL(Number(subscription.amount))} · todo dia {subscription.due_day}
                        </p>
                      </div>
                      <StatusBadge
                        label={subscription.status}
                        tone={
                          subscription.status === "ativa"
                            ? "success"
                            : subscription.status === "pausada"
                              ? "warning"
                              : subscription.status === "agendada"
                                ? "accent"
                                : "secondary"
                        }
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/92">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base">Cobranças do projeto</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {financialItems.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">
                    Nenhuma cobrança vinculada a este projeto.
                  </p>
                ) : (
                  <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
                    {financialItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/60 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Vence {formatPortalDate(item.dueDate)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                          {formatBRL(Number(item.amount))}
                        </p>
                        <StatusBadge label={item.status.label} tone={item.status.tone} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "documentos" ? (
        <Card className="border-border/70 bg-card/92">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">Anexos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum anexo disponivel neste projeto.
              </p>
            ) : (
              <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                {documents.map((document) => (
                  <a
                    key={document.id}
                    href={document.external_url ?? document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-border/50 bg-background/60 px-5 py-4 transition-all hover:border-primary/25 hover:bg-card"
                  >
                    <p className="text-sm font-semibold text-foreground">{document.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {DOCUMENT_TYPE_LABEL[document.type]}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "historico" ? (
        <Card className="border-border/70 bg-card/92">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">Historico resumido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda nao ha eventos relevantes publicados para este projeto.
              </p>
            ) : (
              <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                {timeline.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-border/50 bg-background/60 px-5 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPortalDateTime(event.occurred_at)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{event.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
