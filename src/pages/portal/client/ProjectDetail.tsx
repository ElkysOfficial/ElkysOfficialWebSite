import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { toast } from "sonner";

import { FileText } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import Pagination from "@/components/portal/Pagination";
import PortalLoading from "@/components/portal/PortalLoading";
import ProjectSiteLink from "@/components/portal/ProjectSiteLink";
import ProjectStageJourney from "@/components/portal/ProjectStageJourney";
import StatusBadge from "@/components/portal/StatusBadge";
import useResponsivePageSize from "@/hooks/useResponsivePageSize";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
  buttonVariants,
  cn,
} from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { insertTimelineEvent } from "@/lib/timeline";
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
  const listPageSize = useResponsivePageSize(3, 5, 8);
  const [chargesPage, setChargesPage] = useState(0);
  const [docsPage, setDocsPage] = useState(0);
  const [tlPage, setTlPage] = useState(0);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [respondingId, setRespondingId] = useState<string | null>(null);

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
    let cancelled = false;

    const loadProject = async () => {
      if (!user?.id || !id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError(null);

      const clientRes = await resolveClientForUser(user.id);
      if (cancelled) return;
      if (clientRes.error || !clientRes.client) {
        setPageError(clientRes.error?.message ?? "Cadastro do cliente não encontrado.");
        setLoading(false);
        return;
      }

      const projectRes = await loadProjectById(id);
      if (cancelled) return;
      if (
        projectRes.error ||
        !projectRes.project ||
        projectRes.project.client_id !== clientRes.client.id
      ) {
        setPageError(projectRes.error?.message ?? "Projeto não encontrado.");
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

      if (cancelled) return;
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
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  const handleRespondToStep = async (stepId: string) => {
    const responseText = (responseTexts[stepId] ?? "").trim();
    if (!responseText) {
      toast.error("Escreva sua resposta antes de enviar.");
      return;
    }

    setRespondingId(stepId);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("project_next_steps")
      .update({
        client_response: responseText,
        client_responded_at: now,
        updated_at: now,
      })
      .eq("id", stepId);

    if (error) {
      setRespondingId(null);
      toast.error("Erro ao enviar resposta.", { description: error.message });
      return;
    }

    // Update local state
    setNextSteps((current) =>
      current.map((step) =>
        step.id === stepId
          ? { ...step, client_response: responseText, client_responded_at: now }
          : step
      )
    );
    setResponseTexts((current) => ({ ...current, [stepId]: "" }));

    // Timeline event (non-blocking)
    const step = nextSteps.find((s) => s.id === stepId);
    if (project && step) {
      void insertTimelineEvent({
        client_id: project.client_id,
        project_id: project.id,
        event_type: "next_step_updated",
        title: "Cliente respondeu a solicitação",
        summary: `Resposta enviada para "${step.title}".`,
        visibility: "ambos",
        source_table: "project_next_steps",
        source_id: stepId,
        metadata: { responded_at: now },
      });

      // Notify admin team about client response
      void supabase.from("admin_notifications").insert({
        type: "pendência_respondida",
        title: `Cliente respondeu pendência`,
        body: `O cliente respondeu a pendência "${step.title}" no projeto "${project.name}".`,
        severity: "action_required",
        target_roles: ["admin_super", "admin"],
        entity_type: "project_next_step",
        entity_id: stepId,
        action_url: `/portal/admin/projetos/${project.id}`,
      });
    }

    setRespondingId(null);
    toast.success("Resposta enviada com sucesso!");
  };

  if (loading) return <PortalLoading />;

  if (!project || pageError) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="Projeto não encontrado"
        description={pageError ?? "Não foi possível localizar este projeto no seu portal."}
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
    { key: "historico", label: `Histórico (${timeline.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* Pause reason banner */}
      {project.status === "pausado" && project.pause_reason && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
          <span className="text-sm font-medium text-warning">Projeto pausado</span>
          <span className="text-sm text-muted-foreground">
            {project.pause_reason === "dependência_cliente"
              ? "Aguardando informações ou acao do cliente."
              : project.pause_reason === "financeiro"
                ? "Pendência financeira em aberto."
                : project.pause_reason === "escopo"
                  ? "Aguardando definicao de escopo."
                  : project.pause_reason === "interno"
                    ? "Reorganizacao interna da equipe."
                    : "Motivo informado pela equipe."}
          </span>
        </div>
      )}

      <Card className="border-border/70 bg-card/92">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
              </div>
              <p className="text-sm text-muted-foreground">Etapa atual: {project.current_stage}</p>
              <ProjectSiteLink url={project.production_url} />
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

      <ProjectStageJourney currentStage={project.current_stage} />

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
              <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 sm:px-5 sm:py-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Situacao atual
                </p>
                <p className="mt-2 text-sm text-foreground leading-relaxed">
                  {projectSummary ??
                    "O projeto segue disponivel no portal com acompanhamento ativo da Elkys."}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 sm:px-5 sm:py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Inicio
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatPortalDate(project.started_at)}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 sm:px-5 sm:py-4">
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
              <CardTitle className="text-base">Próximos passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {nextSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum próximo passo compartilhado no momento.
                </p>
              ) : (
                nextSteps.map((stepItem) => {
                  const needsResponse =
                    stepItem.requires_client_action && !stepItem.client_responded_at;
                  const hasResponded =
                    stepItem.requires_client_action && Boolean(stepItem.client_responded_at);

                  return (
                    <div
                      key={stepItem.id}
                      className={cn(
                        "rounded-xl border px-4 py-3 sm:px-5 sm:py-4",
                        needsResponse
                          ? "border-accent/40 bg-accent/5"
                          : "border-border/50 bg-background/60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{stepItem.title}</p>
                        {needsResponse && <StatusBadge label="Acao necessaria" tone="accent" />}
                        {hasResponded && <StatusBadge label="Respondido" tone="success" />}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Responsavel: {NEXT_STEP_OWNER_LABEL[stepItem.owner]}
                      </p>
                      {stepItem.due_date ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Prazo: {formatPortalDate(stepItem.due_date)}
                        </p>
                      ) : null}
                      {stepItem.description ? (
                        <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">
                          {stepItem.description}
                        </p>
                      ) : null}

                      {/* Already responded */}
                      {hasResponded && stepItem.client_response && (
                        <div className="mt-3 rounded-lg border border-success/30 bg-success/5 p-3">
                          <p className="text-[10px] font-semibold uppercase text-success mb-1">
                            Sua resposta
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {stepItem.client_response}
                          </p>
                        </div>
                      )}

                      {/* Response form */}
                      {needsResponse && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            id={`response_${stepItem.id}`}
                            name={`response_${stepItem.id}`}
                            rows={3}
                            value={responseTexts[stepItem.id] ?? ""}
                            onChange={(e) =>
                              setResponseTexts((current) => ({
                                ...current,
                                [stepItem.id]: e.target.value,
                              }))
                            }
                            placeholder="Escreva sua resposta aqui..."
                            aria-label="Resposta ao próximo passo"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={
                              respondingId === stepItem.id ||
                              !(responseTexts[stepItem.id] ?? "").trim()
                            }
                            onClick={() => void handleRespondToStep(stepItem.id)}
                          >
                            {respondingId === stepItem.id ? "Enviando..." : "Enviar resposta"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
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
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Assinaturas ativas
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                {subscriptions.filter((s) => s.status === "ativa").length}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Próxima cobrança
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
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
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Cobranças em aberto
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-xl font-semibold tabular-nums",
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
                          <span className="whitespace-nowrap">
                            {formatBRL(Number(subscription.amount))}
                          </span>{" "}
                          · todo dia {subscription.due_day}
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
                  <>
                    <div className="space-y-1.5">
                      {financialItems
                        .slice(chargesPage * listPageSize, (chargesPage + 1) * listPageSize)
                        .map((item) => (
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
                            <p className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">
                              {formatBRL(Number(item.amount))}
                            </p>
                            <StatusBadge label={item.status.label} tone={item.status.tone} />
                          </div>
                        ))}
                    </div>
                    <Pagination
                      page={chargesPage}
                      totalPages={Math.ceil(financialItems.length / listPageSize)}
                      totalItems={financialItems.length}
                      pageSize={listPageSize}
                      onPageChange={setChargesPage}
                    />
                  </>
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
              <>
                <div className="space-y-3">
                  {documents
                    .slice(docsPage * listPageSize, (docsPage + 1) * listPageSize)
                    .map((document) => (
                      <a
                        key={document.id}
                        href={document.external_url ?? document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl border border-border/50 bg-background/60 px-4 py-3 sm:px-5 sm:py-4 transition-all hover:border-primary/25 hover:bg-card"
                      >
                        <p className="text-sm font-semibold text-foreground">{document.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {DOCUMENT_TYPE_LABEL[document.type]}
                        </p>
                      </a>
                    ))}
                </div>
                <Pagination
                  page={docsPage}
                  totalPages={Math.ceil(documents.length / listPageSize)}
                  totalItems={documents.length}
                  pageSize={listPageSize}
                  onPageChange={setDocsPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "historico" ? (
        <Card className="border-border/70 bg-card/92">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">Histórico resumido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há eventos relevantes publicados para este projeto.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {timeline
                    .slice(tlPage * listPageSize, (tlPage + 1) * listPageSize)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 sm:px-5 sm:py-4"
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
                <Pagination
                  page={tlPage}
                  totalPages={Math.ceil(timeline.length / listPageSize)}
                  totalItems={timeline.length}
                  pageSize={listPageSize}
                  onPageChange={setTlPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
