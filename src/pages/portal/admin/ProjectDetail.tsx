import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { FileText, Search, TrendingUp } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/admin/AdminEmptyState";
import AdminPageHeader from "@/components/portal/admin/AdminPageHeader";
import ContractAcceptanceStatusCard from "@/components/portal/contract/ContractAcceptanceStatusCard";
import ContractVersionHistory from "@/components/portal/contract/ContractVersionHistory";
import ProjectAcceptanceCard from "@/components/portal/project/ProjectAcceptanceCard";
import ProjectOnboardingChecklist from "@/components/portal/project/ProjectOnboardingChecklist";
import ProjectSupportCard from "@/components/portal/project/ProjectSupportCard";
import ProjectValidationRounds from "@/components/portal/project/ProjectValidationRounds";
import ProjectSiteLink from "@/components/portal/project/ProjectSiteLink";
import CopyLinkButton from "@/components/portal/shared/CopyLinkButton";
import PortalLoading from "@/components/portal/shared/PortalLoading";
import Pagination from "@/components/portal/shared/Pagination";
import ProjectStageJourney from "@/components/portal/project/ProjectStageJourney";
import ProjectTimelineFeed from "@/components/portal/project/ProjectTimelineFeed";
import StatusBadge from "@/components/portal/shared/StatusBadge";
import useResponsivePageSize from "@/hooks/useResponsivePageSize";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Label,
  Textarea,
  buttonVariants,
  cn,
} from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  CHARGE_STATUS_META,
  DOCUMENT_TYPE_LABEL,
  type NextStepActionType,
  NEXT_STEP_ACTION_TYPE_LABEL,
  NEXT_STEP_OWNER_LABEL,
  PROJECT_INSTALLMENT_STATUS_LABEL,
  NEXT_STEP_STATUS_LABEL,
  PROJECT_STAGE_OPTIONS,
  PROJECT_STATUS_META,
  formatPortalDate,
  getClientDisplayName,
  getProjectStageMeta,
  getProjectStatusForStage,
  getProjectSummary,
  installmentStatusToChargeStatus,
  syncProjectStatusWithStage,
} from "@/lib/portal";
import {
  loadChargesForProject,
  loadContractsForProject,
  loadDocumentsForProject,
  loadInstallmentsForProject,
  loadNextStepsForProject,
  loadProjectById,
  loadSubscriptionsForProject,
  loadTimelineForProject,
} from "@/lib/portal-data";
import {
  formatBRL,
  formatDateInput,
  getLocalDateIso,
  maskCurrency,
  maskDate,
  parseFormDate,
  sanitizeInteger,
  toCents,
  unmaskCurrency,
} from "@/lib/masks";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";
import { insertTimelineEvent, insertTimelineEvents } from "@/lib/timeline";

type PortalClient = Database["public"]["Tables"]["clients"]["Row"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type NextStepStatus = Database["public"]["Enums"]["next_step_status"];
type NextStepOwner = Database["public"]["Enums"]["next_step_owner"];
type InstallmentStatus = Database["public"]["Enums"]["project_installment_status"];
type DocumentType = Database["public"]["Enums"]["document_type"];
type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
type ProjectTab = "detalhes" | "financeiro" | "documentos" | "timeline";

type NextStepFormState = {
  title: string;
  description: string;
  owner: NextStepOwner;
  status: NextStepStatus;
  due_date: string;
  client_visible: boolean;
  requires_client_action: boolean;
  action_type: NextStepActionType;
  meeting_link: string;
};

type InstallmentFormState = {
  percentage: string;
  due_date: string;
  status: InstallmentStatus;
};

function getNextStepFormDefaults(
  step?: Database["public"]["Tables"]["project_next_steps"]["Row"]
): NextStepFormState {
  return {
    title: step?.title ?? "",
    description: step?.description ?? "",
    owner: step?.owner ?? "elkys",
    status: step?.status ?? "pendente",
    due_date: formatDateInput(step?.due_date ?? null),
    client_visible: step?.client_visible ?? true,
    requires_client_action: step?.requires_client_action ?? false,
    action_type: ((step as Record<string, unknown>)?.action_type as NextStepActionType) ?? "geral",
    meeting_link: ((step as Record<string, unknown>)?.meeting_link as string) ?? "",
  };
}

function getInstallmentFormDefaults(
  installment: Database["public"]["Tables"]["project_installments"]["Row"]
): InstallmentFormState {
  return {
    percentage: String(installment.percentage),
    due_date: formatDateInput(installment.effective_due_date ?? installment.expected_due_date),
    status: installment.status,
  };
}

const selectClass =
  "flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  agendada: "Agendada",
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
};

function getManagedSubscription(
  subscriptions: Database["public"]["Tables"]["project_subscriptions"]["Row"][]
) {
  return (
    subscriptions.find((subscription) =>
      ["agendada", "ativa", "pausada"].includes(subscription.status)
    ) ??
    subscriptions[0] ??
    null
  );
}

function getNextStepTone(
  status: NextStepStatus
): "accent" | "success" | "warning" | "destructive" | "secondary" {
  if (status === "concluido") return "success";
  if (status === "em_andamento") return "accent";
  if (status === "cancelado") return "secondary";
  return "warning";
}

function getInstallmentTone(
  status: InstallmentStatus
): "accent" | "success" | "warning" | "destructive" | "secondary" {
  if (status === "paga") return "success";
  if (status === "atrasada") return "destructive";
  if (status === "cancelada") return "secondary";
  if (status === "agendada") return "accent";
  return "warning";
}

const getChargeStatusFromInstallmentStatus = installmentStatusToChargeStatus;

function AddProjectDocumentForm({
  clientId,
  projectId,
  actorUserId,
  allowContractType,
  onAdded,
}: {
  clientId: string;
  projectId: string;
  actorUserId?: string | null;
  /**
   * PA19: quando false, oculta 'contrato' do select. Link do contrato
   * e responsabilidade do juridico — anexado via AddContractLinkForm
   * na tela /portal/admin/contratos.
   */
  allowContractType: boolean;
  onAdded: () => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<DocumentType>(allowContractType ? "contrato" : "briefing");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!label.trim() || !url.trim()) {
      toast.error("Preencha o nome e o link do documento.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from("documents")
      .insert({
        client_id: clientId,
        project_id: projectId,
        label: label.trim(),
        url: url.trim(),
        type,
        uploaded_by: actorUserId ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast.error("Erro ao adicionar documento.", {
        description: error?.message ?? "Não foi possível salvar o documento.",
      });
      return;
    }

    try {
      await insertTimelineEvent({
        client_id: clientId,
        project_id: projectId,
        actor_user_id: actorUserId ?? null,
        event_type: "document_created",
        title: "Novo documento disponivel",
        summary: `${label.trim()} foi adicionado aos anexos do projeto.`,
        visibility: "ambos",
        source_table: "documents",
        source_id: data.id,
        metadata: {
          document_type: type,
        },
      });
    } catch {
      // timeline log is non-critical
    }

    try {
      const authHeaders = await getSupabaseFunctionAuthHeaders();
      const { error: notifyError } = await supabase.functions.invoke("send-document-added", {
        body: {
          client_id: clientId,
          project_id: projectId,
          document_label: label.trim(),
          document_type: type,
          document_url: url.trim(),
        },
        headers: authHeaders,
      });

      if (notifyError) {
        toast.error("Documento salvo, mas o e-mail não foi enviado.", {
          description: notifyError.message,
        });
      }
    } catch (notifyError) {
      const message =
        notifyError instanceof Error
          ? notifyError.message
          : "Não foi possível enviar a notificação por e-mail.";
      toast.error("Documento salvo, mas o e-mail não foi enviado.", { description: message });
    }

    setLabel("");
    setUrl("");
    setType(allowContractType ? "contrato" : "briefing");
    await onAdded();
    setSubmitting(false);
    toast.success("Documento adicionado ao projeto.");
  };

  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto] sm:items-end">
        <Field>
          <Label htmlFor="doc_label">Nome</Label>
          <Input
            id="doc_label"
            name="doc_label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ex: Briefing do projeto"
          />
        </Field>

        <Field>
          <Label htmlFor="doc_url">Link</Label>
          <Input
            id="doc_url"
            name="doc_url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </Field>

        <Field>
          <Label htmlFor="doc_type">Tipo</Label>
          <select
            id="doc_type"
            name="doc_type"
            value={type}
            onChange={(event) => setType(event.target.value as DocumentType)}
            className={selectClass}
          >
            {(Object.keys(DOCUMENT_TYPE_LABEL) as DocumentType[])
              .filter((docType) => allowContractType || docType !== "contrato")
              .map((docType) => (
                <option key={docType} value={docType}>
                  {DOCUMENT_TYPE_LABEL[docType]}
                </option>
              ))}
          </select>
        </Field>
        <Button
          type="button"
          disabled={submitting}
          onClick={() => void handleAdd()}
          className="min-h-[44px]"
        >
          {submitting ? "Adicionando..." : "Adicionar"}
        </Button>
      </div>
    </div>
  );
}

function OverlayPanel({
  open,
  title,
  description,
  onClose,
  widthClass = "max-w-3xl",
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  widthClass?: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={`flex w-full flex-col ${widthClass} max-h-[calc(100vh-2rem)] rounded-2xl border border-border/60 bg-card shadow-2xl`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminProjectDetail() {
  const { user, roles, isAdmin } = useAuth();
  const allowContractType = isAdmin || roles.includes("juridico");
  const { id } = useParams();
  const [project, setProject] = useState<Database["public"]["Tables"]["projects"]["Row"] | null>(
    null
  );
  const [client, setClient] = useState<PortalClient | null>(null);
  const [contracts, setContracts] = useState<
    Database["public"]["Tables"]["project_contracts"]["Row"][]
  >([]);
  const [installments, setInstallments] = useState<
    Database["public"]["Tables"]["project_installments"]["Row"][]
  >([]);
  const [subscriptions, setSubscriptions] = useState<
    Database["public"]["Tables"]["project_subscriptions"]["Row"][]
  >([]);
  const [charges, setCharges] = useState<Database["public"]["Tables"]["charges"]["Row"][]>([]);
  const [nextSteps, setNextSteps] = useState<
    Database["public"]["Tables"]["project_next_steps"]["Row"][]
  >([]);
  const [timeline, setTimeline] = useState<
    Database["public"]["Tables"]["timeline_events"]["Row"][]
  >([]);
  const [documents, setDocuments] = useState<Database["public"]["Tables"]["documents"]["Row"][]>(
    []
  );
  const [projectDiagnosis, setProjectDiagnosis] = useState<Record<string, string | null> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nextStepForms, setNextStepForms] = useState<Record<string, NextStepFormState>>({});
  const [newNextStepForm, setNewNextStepForm] =
    useState<NextStepFormState>(getNextStepFormDefaults());
  const [stepSavingId, setStepSavingId] = useState<string | null>(null);
  const [creatingStep, setCreatingStep] = useState(false);
  const [installmentForms, setInstallmentForms] = useState<Record<string, InstallmentFormState>>(
    {}
  );
  const [savingInstallments, setSavingInstallments] = useState(false);
  const [savingInstallmentId, setSavingInstallmentId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as ProjectTab | null;
  const validTabs: ProjectTab[] = ["detalhes", "financeiro", "documentos", "timeline"];
  const tab: ProjectTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "detalhes";
  const setTab = (next: ProjectTab) => {
    if (next === "detalhes") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", next);
    }
    setSearchParams(searchParams, { replace: true });
  };
  const chargesPageSize = useResponsivePageSize(3, 5, 8);
  const [chargesPage, setChargesPage] = useState(0);
  const [docsPage, setDocsPage] = useState(0);
  const [docsTypeFilter, setDocsTypeFilter] = useState<"all" | DocumentType>("all");
  const [showStageJourney, setShowStageJourney] = useState(false);
  const [projectUpdateOpen, setProjectUpdateOpen] = useState(false);
  const [nextStepsOpen, setNextStepsOpen] = useState(false);
  const [nextStepsTab, setNextStepsTab] = useState<"pendências" | "historico">("pendências");
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [projectForm, setProjectForm] = useState({
    name: "",
    solution_type: "",
    description: "",
    internal_notes: "",
    status: "negociacao" as ProjectStatus,
    current_stage: "",
    started_at: "",
    delivered_at: "",
    expected_delivery_date: "",
    client_visible_summary: "",
    production_url: "",
    has_subscription: false,
    subscription_id: "",
    subscription_label: "Manutenção e hospedagem",
    subscription_amount: "",
    subscription_due_day: "10",
    subscription_starts_on: "",
    subscription_ends_on: "",
    subscription_status: "ativa" as SubscriptionStatus,
  });

  const visibleCharges = useMemo(
    () => charges.filter((charge) => charge.status !== "pago" && charge.status !== "cancelado"),
    [charges]
  );
  const subscriptionChargeById = useMemo(() => {
    const orderedCharges = [...visibleCharges].sort((a, b) => a.due_date.localeCompare(b.due_date));
    return orderedCharges.reduce<Record<string, Database["public"]["Tables"]["charges"]["Row"]>>(
      (accumulator, charge) => {
        if (charge.subscription_id && !accumulator[charge.subscription_id]) {
          accumulator[charge.subscription_id] = charge;
        }
        return accumulator;
      },
      {}
    );
  }, [visibleCharges]);
  const financialItems = useMemo(
    () =>
      visibleCharges
        .filter((charge) => charge.origin_type !== "mensalidade" && !charge.installment_id)
        .map((charge) => ({
          id: charge.id,
          label: charge.description,
          amount: charge.amount,
          dueDate: charge.due_date,
          statusKey: charge.status,
          status: CHARGE_STATUS_META[charge.status],
        })),
    [visibleCharges]
  );
  const visibleInstallments = useMemo(
    () =>
      installments.filter(
        (installment) => installment.status !== "paga" && installment.status !== "cancelada"
      ),
    [installments]
  );
  const stageOptions = useMemo(() => {
    if (
      projectForm.current_stage &&
      !PROJECT_STAGE_OPTIONS.some((stage) => stage.value === projectForm.current_stage)
    ) {
      return [
        ...PROJECT_STAGE_OPTIONS,
        {
          order: PROJECT_STAGE_OPTIONS.length + 1,
          value: projectForm.current_stage,
          label: `${projectForm.current_stage} (legado)`,
          duration: "Sem referencia padrao",
          summary: "Etapa anterior mantida para compatibilidade com o histórico do projeto.",
        },
      ];
    }

    return PROJECT_STAGE_OPTIONS;
  }, [projectForm.current_stage]);
  const derivedStageStatus = useMemo(
    () => getProjectStatusForStage(projectForm.current_stage),
    [projectForm.current_stage]
  );
  const stageStatusMeta = PROJECT_STATUS_META[derivedStageStatus];
  const projectStatusOptions = useMemo(() => {
    const optionKeys: ProjectStatus[] = [
      derivedStageStatus,
      projectForm.status,
      "pausado",
      "cancelado",
    ];
    return Array.from(new Set(optionKeys));
  }, [derivedStageStatus, projectForm.status]);
  const contractAmount = Number(contracts[0]?.total_amount ?? 0);
  const stageMeta = getProjectStageMeta(project?.current_stage);
  const managedSubscription = useMemo(() => getManagedSubscription(subscriptions), [subscriptions]);
  const hasActiveManagedSubscription = Boolean(
    managedSubscription && managedSubscription.status !== "encerrada"
  );

  const loadProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setPageError(null);

    const projectRes = await loadProjectById(id);

    if (projectRes.error || !projectRes.project) {
      setPageError(projectRes.error?.message ?? "Projeto não encontrado.");
      setLoading(false);
      return;
    }

    const clientRes = await supabase
      .from("clients")
      .select("*")
      .eq("id", projectRes.project.client_id)
      .maybeSingle();

    const [
      contractsRes,
      installmentsRes,
      subscriptionsRes,
      chargesRes,
      nextStepsRes,
      timelineRes,
      docsRes,
    ] = await Promise.all([
      loadContractsForProject(projectRes.project.id),
      loadInstallmentsForProject(projectRes.project.id),
      loadSubscriptionsForProject(projectRes.project.id),
      loadChargesForProject(projectRes.project.id, projectRes.project.client_id),
      loadNextStepsForProject(projectRes.project.id),
      loadTimelineForProject(projectRes.project.id),
      loadDocumentsForProject(projectRes.project.client_id, projectRes.project.id),
    ]);

    const queryError =
      clientRes.error ??
      contractsRes.error ??
      installmentsRes.error ??
      subscriptionsRes.error ??
      chargesRes.error ??
      nextStepsRes.error ??
      timelineRes.error ??
      docsRes.error;

    if (queryError) {
      setPageError(queryError.message);
      setLoading(false);
      return;
    }

    // Auditoria 2026-04-15: REMOVIDO auto-sync de mensalidades em load.
    // Sync agora e exclusivamente disparado pela tela Financeira via botao
    // manual. Abrir o detalhe do projeto e operacao 100% READ ONLY.
    const nextCharges = chargesRes.charges;

    const managedProjectSubscription = getManagedSubscription(subscriptionsRes.subscriptions);

    setProject(projectRes.project);

    // Carregar diagnóstico do lead vinculado à proposta (se houver)
    const projProposalId = (projectRes.project as { proposal_id?: string | null }).proposal_id;
    if (projProposalId) {
      const { data: proposalData } = await supabase
        .from("proposals")
        .select("lead_id")
        .eq("id", projProposalId)
        .maybeSingle();
      if (proposalData?.lead_id) {
        const { data: leadData } = await supabase
          .from("leads")
          .select("diagnosis")
          .eq("id", proposalData.lead_id)
          .maybeSingle();
        setProjectDiagnosis((leadData?.diagnosis as Record<string, string | null> | null) ?? null);
      } else {
        setProjectDiagnosis(null);
      }
    } else {
      setProjectDiagnosis(null);
    }

    setClient((clientRes.data as PortalClient | null) ?? null);
    setContracts(contractsRes.contracts);
    setInstallments(installmentsRes.installments);
    setSubscriptions(subscriptionsRes.subscriptions);
    setCharges(nextCharges);
    setNextSteps(nextStepsRes.nextSteps);
    setTimeline(timelineRes.events);
    setDocuments(docsRes.documents);
    setNextStepForms(
      Object.fromEntries(
        nextStepsRes.nextSteps.map((stepItem) => [stepItem.id, getNextStepFormDefaults(stepItem)])
      )
    );
    setNewNextStepForm(getNextStepFormDefaults());
    setInstallmentForms(
      Object.fromEntries(
        installmentsRes.installments.map((installment) => [
          installment.id,
          getInstallmentFormDefaults(installment),
        ])
      )
    );
    setProjectForm({
      name: projectRes.project.name,
      solution_type: projectRes.project.solution_type ?? "",
      description: projectRes.project.description ?? "",
      internal_notes: projectRes.project.internal_notes ?? "",
      status: projectRes.project.status,
      current_stage: projectRes.project.current_stage,
      started_at: formatDateInput(projectRes.project.started_at),
      delivered_at: formatDateInput(projectRes.project.delivered_at),
      expected_delivery_date: formatDateInput(projectRes.project.expected_delivery_date),
      client_visible_summary: projectRes.project.client_visible_summary ?? "",
      production_url: projectRes.project.production_url ?? "",
      has_subscription: Boolean(
        managedProjectSubscription && managedProjectSubscription.status !== "encerrada"
      ),
      subscription_id: managedProjectSubscription?.id ?? "",
      subscription_label: managedProjectSubscription?.label ?? "Manutenção e hospedagem",
      subscription_amount: managedProjectSubscription
        ? formatBRL(Number(managedProjectSubscription.amount))
        : "",
      subscription_due_day: managedProjectSubscription
        ? String(managedProjectSubscription.due_day)
        : "10",
      subscription_starts_on: formatDateInput(managedProjectSubscription?.starts_on ?? null),
      subscription_ends_on: formatDateInput(managedProjectSubscription?.ends_on ?? null),
      subscription_status: managedProjectSubscription?.status ?? "ativa",
    });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const handleSaveProject = async () => {
    if (!project || !client) return;
    const startedAtIso = parseFormDate(projectForm.started_at);
    const deliveredAtIso = parseFormDate(projectForm.delivered_at);
    const expectedDeliveryIso = parseFormDate(projectForm.expected_delivery_date);
    const subscriptionStartsOnIso = parseFormDate(projectForm.subscription_starts_on);
    const subscriptionEndsOnIso = parseFormDate(projectForm.subscription_ends_on);
    const todayIso = getLocalDateIso();

    if (projectForm.name.trim().length < 3) {
      toast.error("Informe um nome valido para o projeto.");
      return;
    }

    if (projectForm.solution_type.trim().length < 3) {
      toast.error("Informe o tipo de solucao.");
      return;
    }

    if (projectForm.current_stage.trim().length < 3) {
      toast.error("Informe a etapa atual.");
      return;
    }

    if (!startedAtIso) {
      toast.error("Informe uma data valida para inicio.");
      return;
    }

    if (projectForm.expected_delivery_date && !expectedDeliveryIso) {
      toast.error("Informe uma data valida para entrega prevista.");
      return;
    }

    if (expectedDeliveryIso && expectedDeliveryIso < startedAtIso) {
      toast.error("A entrega prevista não pode ser anterior ao início do projeto.");
      return;
    }

    if (projectForm.delivered_at && !deliveredAtIso) {
      toast.error("Informe uma data valida para entrega realizada.");
      return;
    }

    if (deliveredAtIso && deliveredAtIso < startedAtIso) {
      toast.error("A entrega realizada não pode ser anterior ao início do projeto.");
      return;
    }

    if (!hasActiveManagedSubscription && projectForm.has_subscription) {
      if (!projectForm.subscription_label.trim()) {
        toast.error("Informe o nome da manutenção/hospedagem.");
        return;
      }

      if (
        !projectForm.subscription_amount ||
        unmaskCurrency(projectForm.subscription_amount) <= 0
      ) {
        toast.error("Informe um valor mensal valido para manutenção/hospedagem.");
        return;
      }

      const dueDay = Number(projectForm.subscription_due_day);
      if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        toast.error("Informe um dia de vencimento entre 1 e 31.");
        return;
      }

      if (!subscriptionStartsOnIso) {
        toast.error("Informe a data de inicio da manutenção/hospedagem.");
        return;
      }

      if (projectForm.subscription_ends_on && !subscriptionEndsOnIso) {
        toast.error("Informe uma data valida para encerramento da manutenção/hospedagem.");
        return;
      }

      if (subscriptionEndsOnIso && subscriptionEndsOnIso < subscriptionStartsOnIso) {
        toast.error("O encerramento da manutenção/hospedagem não pode ser anterior ao início.");
        return;
      }
    }

    const previousStage = project.current_stage.trim();
    const nextStage = projectForm.current_stage.trim();
    const previousStatus = project.status;
    const nextStatus = syncProjectStatusWithStage(nextStage, projectForm.status);
    const nextBillingType = projectForm.has_subscription ? "mensal" : "projeto";
    const currentManagedSubscription = managedSubscription;
    const hasCurrentManagedSubscription =
      currentManagedSubscription?.status !== undefined &&
      currentManagedSubscription.status !== "encerrada";

    setSaving(true);

    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("projects")
        .update({
          name: projectForm.name.trim(),
          solution_type: projectForm.solution_type.trim(),
          description: projectForm.description.trim() || null,
          internal_notes: projectForm.internal_notes.trim() || null,
          status: nextStatus,
          current_stage: projectForm.current_stage.trim(),
          started_at: startedAtIso,
          delivered_at: deliveredAtIso,
          expected_delivery_date: expectedDeliveryIso,
          billing_type: nextBillingType,
          client_visible_summary: projectForm.client_visible_summary.trim() || null,
          production_url: projectForm.production_url.trim() || null,
          updated_at: nowIso,
        })
        .eq("id", project.id);

      if (error) throw error;

      const timelineEvents: Database["public"]["Tables"]["timeline_events"]["Insert"][] = [];
      const previousDeliveredAt = project.delivered_at ?? null;

      if (!hasCurrentManagedSubscription && projectForm.has_subscription) {
        const { data: createdSubscription, error: subscriptionError } = await supabase
          .from("project_subscriptions")
          .insert({
            client_id: client.id,
            project_id: project.id,
            label: projectForm.subscription_label.trim(),
            amount: unmaskCurrency(projectForm.subscription_amount),
            due_day: Number(projectForm.subscription_due_day),
            starts_on: subscriptionStartsOnIso,
            ends_on: subscriptionEndsOnIso,
            status: "ativa",
            is_blocking: true,
          })
          .select("id")
          .single();

        if (subscriptionError || !createdSubscription) {
          throw subscriptionError ?? new Error("Não foi possível ativar a manutenção/hospedagem.");
        }

        timelineEvents.push({
          client_id: client.id,
          project_id: project.id,
          actor_user_id: user?.id ?? null,
          event_type: "subscription_created",
          title: "Manutenção/hospedagem ativada",
          summary: `${projectForm.subscription_label.trim()} foi ativada para continuidade do projeto apos a entrega.`,
          visibility: "ambos",
          source_table: "project_subscriptions",
          source_id: createdSubscription.id,
          metadata: {
            amount: unmaskCurrency(projectForm.subscription_amount),
            due_day: Number(projectForm.subscription_due_day),
            starts_on: subscriptionStartsOnIso,
          },
        });
      }

      if (
        hasCurrentManagedSubscription &&
        !projectForm.has_subscription &&
        currentManagedSubscription
      ) {
        const { error: subscriptionError } = await supabase
          .from("project_subscriptions")
          .update({
            status: "encerrada",
            ends_on: currentManagedSubscription.ends_on ?? deliveredAtIso ?? todayIso,
            updated_at: nowIso,
          })
          .eq("id", currentManagedSubscription.id);

        if (subscriptionError) {
          throw subscriptionError;
        }

        timelineEvents.push({
          client_id: client.id,
          project_id: project.id,
          actor_user_id: user?.id ?? null,
          event_type: "subscription_updated",
          title: "Manutenção/hospedagem encerrada",
          summary:
            "A continuidade recorrente de manutenção/hospedagem deste projeto foi encerrada.",
          visibility: "ambos",
          source_table: "project_subscriptions",
          source_id: currentManagedSubscription.id,
          metadata: {
            status: "encerrada",
            ends_on: currentManagedSubscription.ends_on ?? deliveredAtIso ?? todayIso,
          },
        });
      }

      if (previousStage !== nextStage) {
        timelineEvents.push({
          client_id: client.id,
          project_id: project.id,
          actor_user_id: user?.id ?? null,
          event_type: "project_stage_changed",
          title: "Etapa do projeto atualizada",
          summary: `A etapa atual do projeto passou de ${previousStage || "Sem etapa"} para ${nextStage}.`,
          visibility: "ambos",
          source_table: "projects",
          source_id: project.id,
          metadata: {
            from_stage: previousStage,
            to_stage: nextStage,
          },
        });
      }

      if (previousStatus !== nextStatus) {
        timelineEvents.push({
          client_id: client.id,
          project_id: project.id,
          actor_user_id: user?.id ?? null,
          event_type: "project_status_changed",
          title: "Status do projeto atualizado",
          summary: `O status do projeto mudou de ${PROJECT_STATUS_META[previousStatus].label} para ${PROJECT_STATUS_META[nextStatus].label}.`,
          visibility: "ambos",
          source_table: "projects",
          source_id: project.id,
          metadata: {
            from_status: previousStatus,
            to_status: nextStatus,
          },
        });
      }

      if (previousDeliveredAt !== deliveredAtIso) {
        timelineEvents.push({
          client_id: client.id,
          project_id: project.id,
          actor_user_id: user?.id ?? null,
          event_type: "project_delivery_updated",
          title: "Entrega do projeto atualizada",
          summary: deliveredAtIso
            ? `A entrega realizada do projeto foi registrada para ${formatDateInput(deliveredAtIso)}.`
            : "A data de entrega realizada foi removida da operação do projeto.",
          visibility: "ambos",
          source_table: "projects",
          source_id: project.id,
          metadata: {
            from_delivered_at: previousDeliveredAt,
            to_delivered_at: deliveredAtIso,
          },
        });
      }

      timelineEvents.push({
        client_id: client.id,
        project_id: project.id,
        actor_user_id: user?.id ?? null,
        event_type: "project_updated",
        title: "Projeto atualizado",
        summary: "Informações principais do projeto foram revisadas e atualizadas pela Elkys.",
        visibility: "ambos",
        source_table: "projects",
        source_id: project.id,
        metadata: {
          current_stage: nextStage,
          status: nextStatus,
          billing_type: nextBillingType,
          delivered_at: deliveredAtIso,
        },
      });

      await insertTimelineEvents(timelineEvents);

      // Notify client about stage or status change (fire-and-forget)
      if (
        previousStage !== nextStage ||
        (previousStatus !== nextStatus && nextStatus !== "concluido")
      ) {
        try {
          const progressHeaders = await getSupabaseFunctionAuthHeaders();
          const isStageChange = previousStage !== nextStage;
          void supabase.functions.invoke("send-project-stage-changed", {
            body: {
              client_id: client.id,
              project_id: project.id,
              project_name: projectForm.name.trim(),
              change_type: isStageChange ? "stage" : "status",
              from_value: isStageChange ? previousStage : PROJECT_STATUS_META[previousStatus].label,
              to_value: isStageChange ? nextStage : PROJECT_STATUS_META[nextStatus].label,
              client_visible_summary: projectForm.client_visible_summary.trim() || undefined,
            },
            headers: progressHeaders,
          });
        } catch {
          // Non-blocking
        }
      }

      // Notify client when project is delivered (fire-and-forget)
      if (previousStatus !== "concluido" && nextStatus === "concluido") {
        try {
          const completedHeaders = await getSupabaseFunctionAuthHeaders();
          void supabase.functions.invoke("send-project-completed", {
            body: {
              client_id: client.id,
              project_name: projectForm.name.trim(),
              delivered_at: deliveredAtIso ?? undefined,
            },
            headers: completedHeaders,
          });
        } catch {
          // Non-blocking
        }
      }

      // ── Tarefas automáticas em transições de stage/status ──

      // Stage → Validação: criar tarefa para solicitar validação
      if (previousStage !== nextStage && nextStage === "Validacao & ativacao") {
        void supabase.from("team_tasks").insert({
          title: `Solicitar validação do cliente - ${projectForm.name.trim()}`,
          description: `O projeto "${projectForm.name.trim()}" entrou na etapa de validação. Solicite a aprovação do cliente para os entregáveis.`,
          category: "desenvolvimento",
          status: "pendente",
          priority: "alta",
          project_id: project.id,
          client_id: client.id,
          role_visibility: ["admin_super", "admin", "developer", "po"],
          due_date: getLocalDateIso(new Date(Date.now() + 5 * 86400000)),
          created_by: user?.id ?? null,
        });

        // L8: Email ao cliente informando que projeto entrou em validação
        try {
          const validationHeaders = await getSupabaseFunctionAuthHeaders();
          void supabase.functions.invoke("send-client-action-required", {
            body: {
              client_id: client.id,
              project_id: project.id,
              project_name: projectForm.name.trim(),
              step_title: "Validação do projeto",
              step_description:
                "O projeto entrou na etapa de validação. Acesse o portal para revisar e aprovar os entregáveis.",
              action_type: "aprovacao",
            },
            headers: validationHeaders,
          });
        } catch {
          // Fire-and-forget
        }
      }

      // Status → Concluído: tarefas para marketing e comercial
      if (previousStatus !== "concluido" && nextStatus === "concluido") {
        void supabase.from("team_tasks").insert([
          {
            title: `Criar case de sucesso - ${projectForm.name.trim()}`,
            description: `O projeto "${projectForm.name.trim()}" foi concluído. Avalie se pode ser transformado em case para o portfólio da Elkys.`,
            category: "marketing",
            status: "pendente",
            priority: "media",
            project_id: project.id,
            client_id: client.id,
            role_visibility: ["admin_super", "admin", "marketing"],
            due_date: getLocalDateIso(new Date(Date.now() + 15 * 86400000)),
            created_by: user?.id ?? null,
          },
          {
            title: `Identificar expansão - ${projectForm.name.trim()}`,
            description: `O projeto "${projectForm.name.trim()}" foi entregue. Verifique oportunidades de upsell ou novos projetos com este cliente.`,
            category: "comercial",
            status: "pendente",
            priority: "media",
            project_id: project.id,
            client_id: client.id,
            role_visibility: ["admin_super", "admin", "comercial"],
            due_date: getLocalDateIso(new Date(Date.now() + 30 * 86400000)),
            created_by: user?.id ?? null,
          },
        ]);
      }

      // Status → Pausado: notificação para admin e financeiro
      if (previousStatus !== "pausado" && nextStatus === "pausado") {
        void supabase.from("admin_notifications").insert({
          type: "projeto_pausado",
          title: `Projeto pausado: ${projectForm.name.trim()}`,
          body: `O projeto "${projectForm.name.trim()}" foi pausado. Verifique impacto em cobranças e cronograma.`,
          severity: "warning",
          target_roles: ["admin_super", "admin", "financeiro"],
          entity_type: "project",
          entity_id: project.id,
          action_url: `/portal/admin/projetos/${project.id}`,
        });
      }

      toast.success("Projeto atualizado.");
      await loadProject();
      setProjectUpdateOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível atualizar o projeto.";
      toast.error("Não foi possível atualizar o projeto.", { description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNextStep = async (stepId: string) => {
    if (!project || !client) return;
    const form = nextStepForms[stepId];
    if (!form || form.title.trim().length < 3) {
      toast.error("Informe um titulo valido para a pendência.");
      return;
    }

    setStepSavingId(stepId);

    const dueDateIso = parseFormDate(form.due_date);
    const { error } = await supabase
      .from("project_next_steps")
      .update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        owner: form.owner,
        status: form.status,
        due_date: dueDateIso,
        client_visible: form.client_visible,
        requires_client_action: form.requires_client_action,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stepId);

    if (error) {
      setStepSavingId(null);
      toast.error("Não foi possível atualizar a pendência.", { description: error.message });
      return;
    }

    try {
      await insertTimelineEvent({
        client_id: client.id,
        project_id: project.id,
        actor_user_id: user?.id ?? null,
        event_type: "next_step_updated",
        title: "Pendência atualizada",
        summary: `${form.title.trim()} agora esta como ${NEXT_STEP_STATUS_LABEL[form.status].toLowerCase()}.`,
        visibility: form.client_visible ? "ambos" : "interno",
        source_table: "project_next_steps",
        source_id: stepId,
        metadata: {
          status: form.status,
          due_date: dueDateIso,
        },
      });
    } catch {
      // timeline log is non-critical
    }

    setStepSavingId(null);
    toast.success("Pendência atualizada.");
    await loadProject();
  };

  const handleCloseNextStep = async (stepId: string) => {
    if (!project || !client) return;
    setStepSavingId(stepId);

    const { error } = await supabase
      .from("project_next_steps")
      .update({
        status: "concluido",
        updated_at: new Date().toISOString(),
      })
      .eq("id", stepId);

    if (error) {
      setStepSavingId(null);
      toast.error("Não foi possível concluir a pendência.", { description: error.message });
      return;
    }

    setStepSavingId(null);
    toast.success("Pendência concluida.");
    await loadProject();
  };

  const handleCreateNextStep = async () => {
    if (!project || !client) return;
    if (newNextStepForm.title.trim().length < 3) {
      toast.error("Informe um titulo valido para a pendência.");
      return;
    }

    setCreatingStep(true);
    const dueDateIso = parseFormDate(newNextStepForm.due_date);

    const { data, error } = await supabase
      .from("project_next_steps")
      .insert({
        client_id: client.id,
        project_id: project.id,
        title: newNextStepForm.title.trim(),
        description: newNextStepForm.description.trim() || null,
        owner: newNextStepForm.owner,
        status: newNextStepForm.status,
        due_date: dueDateIso,
        client_visible: newNextStepForm.client_visible,
        requires_client_action: newNextStepForm.requires_client_action,
        action_type: newNextStepForm.action_type,
        meeting_link:
          newNextStepForm.action_type === "reuniao" && newNextStepForm.meeting_link.trim()
            ? newNextStepForm.meeting_link.trim()
            : null,
        sort_order: nextSteps.length,
      } as Record<string, unknown>)
      .select("id")
      .single();

    if (error || !data) {
      setCreatingStep(false);
      toast.error("Não foi possível criar a pendência.", {
        description: error?.message ?? "Falha ao salvar o registro.",
      });
      return;
    }

    try {
      await insertTimelineEvent({
        client_id: client.id,
        project_id: project.id,
        actor_user_id: user?.id ?? null,
        event_type: "next_step_created",
        title: newNextStepForm.requires_client_action
          ? "Solicitação enviada ao cliente"
          : "Nova pendência registrada",
        summary: newNextStepForm.requires_client_action
          ? `Solicitação "${newNextStepForm.title.trim()}" enviada ao cliente para acao.`
          : `${newNextStepForm.title.trim()} foi adicionada ao plano de acao do projeto.`,
        visibility: newNextStepForm.client_visible ? "ambos" : "interno",
        source_table: "project_next_steps",
        source_id: data.id,
        metadata: {
          status: newNextStepForm.status,
          due_date: dueDateIso,
          requires_client_action: newNextStepForm.requires_client_action,
        },
      });
    } catch {
      // timeline log is non-critical
    }

    // Notify client by email when action is required (fire-and-forget)
    if (newNextStepForm.requires_client_action && newNextStepForm.client_visible) {
      try {
        const actionHeaders = await getSupabaseFunctionAuthHeaders();
        void supabase.functions.invoke("send-client-action-required", {
          body: {
            client_id: client.id,
            project_id: project.id,
            project_name: project.name,
            step_title: newNextStepForm.title.trim(),
            step_description: newNextStepForm.description.trim() || undefined,
            due_date: dueDateIso || undefined,
            action_type: newNextStepForm.action_type,
            meeting_link:
              newNextStepForm.action_type === "reuniao" && newNextStepForm.meeting_link.trim()
                ? newNextStepForm.meeting_link.trim()
                : undefined,
          },
          headers: actionHeaders,
        });
      } catch {
        // Non-blocking
      }
    }

    setCreatingStep(false);
    toast.success(
      newNextStepForm.requires_client_action
        ? "Solicitação criada e cliente notificado."
        : "Pendência criada."
    );
    await loadProject();
  };

  const handleSaveInstallments = async (targetInstallmentId?: string) => {
    if (!project || !client || installments.length === 0) return;

    setSavingInstallments(true);
    setSavingInstallmentId(targetInstallmentId ?? null);
    const installmentsToSave = targetInstallmentId
      ? installments.filter((installment) => installment.id === targetInstallmentId)
      : installments;

    try {
      for (const installment of installmentsToSave) {
        const draft = installmentForms[installment.id];
        if (!draft) continue;

        const { error: installmentError } = await supabase
          .from("project_installments")
          .update({
            status: draft.status,
            paid_at: draft.status === "paga" ? getLocalDateIso() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", installment.id);

        if (installmentError) throw installmentError;

        const { error: chargeError } = await supabase
          .from("charges")
          .update({
            status: getChargeStatusFromInstallmentStatus(draft.status),
            paid_at: draft.status === "paga" ? getLocalDateIso() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("installment_id", installment.id);

        if (chargeError) throw chargeError;
      }

      await insertTimelineEvent({
        client_id: client.id,
        project_id: project.id,
        actor_user_id: user?.id ?? null,
        event_type: "installment_updated",
        title: targetInstallmentId ? "Parcela atualizada" : "Parcelas atualizadas",
        summary: targetInstallmentId
          ? "Status de uma parcela do projeto foi atualizado."
          : "Status das parcelas do projeto foram atualizados.",
        visibility: "ambos",
        source_table: "project_installments",
        source_id: targetInstallmentId ?? installments[0]?.id ?? null,
        metadata: {
          statuses: installmentsToSave.map((installment) => ({
            installment_type: installment.installment_type,
            status: installmentForms[installment.id]?.status ?? installment.status,
          })),
        },
      });

      // Notify client by email for each installment newly marked as paid
      const paidInstallments = installmentsToSave.filter(
        (inst) => installmentForms[inst.id]?.status === "paga" && inst.status !== "paga"
      );
      if (paidInstallments.length > 0) {
        const authHeaders = await getSupabaseFunctionAuthHeaders();
        for (const inst of paidInstallments) {
          const { error: notifyError } = await supabase.functions.invoke("send-installment-paid", {
            body: {
              installment_id: inst.id,
              client_id: client.id,
              project_id: project.id,
            },
            headers: authHeaders,
          });
          if (notifyError) {
            console.warn("[send-installment-paid] email not sent:", notifyError.message);
          }
        }
      }

      toast.success(targetInstallmentId ? "Parcela atualizada." : "Parcelas atualizadas.");
      await loadProject();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : targetInstallmentId
            ? "Não foi possível atualizar a parcela."
            : "Não foi possível atualizar as parcelas.";
      toast.error(
        targetInstallmentId ? "Erro ao atualizar parcela." : "Erro ao atualizar parcelas.",
        {
          description: message,
        }
      );
    } finally {
      setSavingInstallments(false);
      setSavingInstallmentId(null);
    }
  };

  if (loading) return <PortalLoading />;

  if (!project || pageError) {
    return (
      <AdminEmptyState
        icon={Search}
        title="Projeto não encontrado"
        description={pageError ?? "O projeto pode ter sido removido ou o link esta incorreto."}
        action={
          <Link to="/portal/admin/projetos" className={buttonVariants({ variant: "default" })}>
            Voltar para projetos
          </Link>
        }
      />
    );
  }

  const projectStatusMeta = PROJECT_STATUS_META[project.status];
  const installmentPercentageTotal = installments.reduce((sum, installment) => {
    const draft = installmentForms[installment.id];
    return sum + Number(draft?.percentage || installment.percentage || 0);
  }, 0);
  const openNextStepsCount = nextSteps.filter(
    (step) => step.status !== "concluido" && step.status !== "cancelado"
  ).length;
  const projectTabs: { key: ProjectTab; label: string }[] = [
    {
      key: "detalhes",
      label: `Detalhes do projeto${openNextStepsCount > 0 ? ` (${openNextStepsCount})` : ""}`,
    },
    { key: "financeiro", label: "Financeiro" },
    { key: "documentos", label: `Anexos (${documents.length})` },
    { key: "timeline", label: `Timeline (${timeline.length})` },
  ];
  const summaryCard = (
    <Card className="border-border/70 bg-card/92">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Resumo do projeto</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setProjectUpdateOpen(true)}
          >
            Editar projeto
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/50 bg-background/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Inicio
            </p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">
              {formatPortalDate(project.started_at)}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Entrega prevista
            </p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">
              {formatPortalDate(project.expected_delivery_date)}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Entrega realizada
            </p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">
              {formatPortalDate(project.delivered_at)}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Etapa atual
            </p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{project.current_stage}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/60 p-3 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <div className="mt-2">
              <StatusBadge label={projectStatusMeta.label} tone={projectStatusMeta.tone} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pos-entrega
          </p>
          {hasActiveManagedSubscription && managedSubscription ? (
            <>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Manutenção/hospedagem ativa
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {managedSubscription.label} · {formatBRL(Number(managedSubscription.amount))} por
                mes · dia {managedSubscription.due_day}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Sem continuidade recorrente ativa apos a entrega.
            </p>
          )}
        </div>

        {stageMeta ? (
          <div className="rounded-xl border border-border/50 bg-background/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Referencia da etapa atual
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{stageMeta.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stageMeta.summary}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
              Duracao base: {stageMeta.duration}
            </p>
          </div>
        ) : null}

        <div className="overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Leitura para o cliente
          </p>
          <p className="mt-1 break-words text-sm leading-relaxed text-foreground">
            {getProjectSummary(project)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
  const detailsWorkspaceCard = (
    <Card className="border-border/70 bg-card/92">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Ações operacionais</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setNextStepsOpen(true)}>
            Gerenciar pendências
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="grid grid-cols-2 gap-3">
          <div
            className={cn(
              "min-w-0 overflow-hidden rounded-xl border bg-background/60 p-4",
              openNextStepsCount > 0 ? "border-warning/40" : "border-border/50"
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Pendências em aberto
            </p>
            <p
              className={cn(
                "mt-1.5 text-2xl font-semibold tabular-nums",
                openNextStepsCount > 0 ? "text-warning" : "text-foreground"
              )}
            >
              {openNextStepsCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Atualize status, responsavel e vencimento sem sair do projeto.
            </p>
          </div>
          <div className="min-w-0 overflow-hidden rounded-xl border border-border/50 bg-background/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Ultima leitura para o cliente
            </p>
            <p className="mt-1.5 line-clamp-4 break-words text-sm leading-relaxed text-foreground">
              {project.client_visible_summary?.trim() || "Sem resumo publicado no momento."}
            </p>
          </div>
        </div>

        {/* Open pendências */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Próximas pendências
          </p>

          {nextSteps.filter((s) => s.status !== "concluido" && s.status !== "cancelado").length ===
          0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma pendência em aberto.</p>
          ) : (
            <div className="space-y-2">
              {nextSteps
                .filter((s) => s.status !== "concluido" && s.status !== "cancelado")
                .slice(0, 3)
                .map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "relative flex items-start justify-between gap-3 overflow-hidden rounded-xl border border-border/50 bg-background/60 p-3 pl-4",
                      "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px]",
                      step.status === "em_andamento" ? "before:bg-primary" : "before:bg-warning"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {NEXT_STEP_OWNER_LABEL[step.owner]}
                        {step.due_date ? ` · vence ${formatPortalDate(step.due_date)}` : ""}
                      </p>
                    </div>
                    <StatusBadge
                      label={NEXT_STEP_STATUS_LABEL[step.status]}
                      tone={getNextStepTone(step.status)}
                    />
                  </div>
                ))}

              {nextSteps.filter((s) => s.status !== "concluido" && s.status !== "cancelado")
                .length > 3 ? (
                <button
                  type="button"
                  onClick={() => setNextStepsOpen(true)}
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  Ver todas as{" "}
                  {
                    nextSteps.filter((s) => s.status !== "concluido" && s.status !== "cancelado")
                      .length
                  }{" "}
                  pendências →
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Histórico de pendências concluídas */}
        {nextSteps.filter((s) => s.status === "concluido" || s.status === "cancelado").length >
          0 && (
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Histórico de pendências
            </p>
            <div className="space-y-2">
              {nextSteps
                .filter((s) => s.status === "concluido" || s.status === "cancelado")
                .map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "relative flex items-start justify-between gap-3 overflow-hidden rounded-xl border border-border/50 bg-background/60 p-3 pl-4 opacity-60",
                      "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px]",
                      step.status === "concluido"
                        ? "before:bg-success"
                        : "before:bg-muted-foreground/40"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {NEXT_STEP_OWNER_LABEL[step.owner]}
                        {step.due_date ? ` · ${formatPortalDate(step.due_date)}` : ""}
                      </p>
                    </div>
                    <StatusBadge
                      label={NEXT_STEP_STATUS_LABEL[step.status]}
                      tone={getNextStepTone(step.status)}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const projectUpdateCard = (
    <Card className="border-border/70 bg-card/92">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Atualizacao do projeto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <Field>
          <Label htmlFor="proj_name">Nome do projeto</Label>
          <Input
            id="proj_name"
            name="proj_name"
            value={projectForm.name}
            onChange={(event) =>
              setProjectForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </Field>

        <Field>
          <Label htmlFor="proj_solution_type">Tipo de solucao</Label>
          <Input
            id="proj_solution_type"
            name="proj_solution_type"
            value={projectForm.solution_type}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                solution_type: event.target.value,
              }))
            }
          />
        </Field>

        <Field>
          <Label htmlFor="proj_current_stage">Etapa atual</Label>
          <select
            id="proj_current_stage"
            name="proj_current_stage"
            value={projectForm.current_stage}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                current_stage: event.target.value,
                status: syncProjectStatusWithStage(event.target.value, current.status),
              }))
            }
            className={selectClass}
          >
            {stageOptions.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.order}a etapa - {stage.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-xl border border-border/50 bg-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status sugerido pela etapa
          </p>
          <div className="mt-2">
            <StatusBadge label={stageStatusMeta.label} tone={stageStatusMeta.tone} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            `Pausado` e `Cancelado` continuam podendo ser definidos manualmente.
          </p>
        </div>

        <Field>
          <Label htmlFor="proj_status">Status</Label>
          <select
            id="proj_status"
            name="proj_status"
            value={projectForm.status}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                status: event.target.value as ProjectStatus,
              }))
            }
            className={selectClass}
          >
            {projectStatusOptions.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_META[status].label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="proj_started_at">Inicio</Label>
            <Input
              id="proj_started_at"
              name="proj_started_at"
              value={projectForm.started_at}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  started_at: maskDate(event.target.value),
                }))
              }
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
            />
          </Field>

          <Field>
            <Label htmlFor="proj_expected_delivery_date">Entrega prevista</Label>
            <Input
              id="proj_expected_delivery_date"
              name="proj_expected_delivery_date"
              value={projectForm.expected_delivery_date}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  expected_delivery_date: maskDate(event.target.value),
                }))
              }
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
            />
          </Field>
        </div>

        <Field>
          <Label htmlFor="proj_delivered_at">Entrega realizada</Label>
          <Input
            id="proj_delivered_at"
            name="proj_delivered_at"
            value={projectForm.delivered_at}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                delivered_at: maskDate(event.target.value),
              }))
            }
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
          />
        </Field>

        <div className="rounded-xl border border-border/50 bg-background/60 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={projectForm.has_subscription}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  has_subscription: event.target.checked,
                  subscription_starts_on:
                    event.target.checked && !current.subscription_starts_on
                      ? formatDateInput(project.delivered_at ?? project.started_at)
                      : current.subscription_starts_on,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Continua com manutenção/hospedagem apos a entrega
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use esta opcao quando o projeto ja foi entregue, mas continua com recorrencia de
                sustentacao, manutenção ou hospedagem.
              </p>
            </div>
          </label>

          {hasActiveManagedSubscription && managedSubscription ? (
            <div className="mt-4 rounded-xl border border-border/50 bg-background/70 p-4">
              <p className="text-sm font-semibold text-foreground">Assinatura atual em andamento</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {managedSubscription.label} · {formatBRL(Number(managedSubscription.amount))} por
                mes · dia {managedSubscription.due_day}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Inicio em {formatPortalDate(managedSubscription.starts_on)} · status{" "}
                {SUBSCRIPTION_STATUS_LABEL[managedSubscription.status]}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Desmarque a opcao acima se quiser encerrar essa continuidade recorrente.
              </p>
            </div>
          ) : null}

          {projectForm.has_subscription && !hasActiveManagedSubscription ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field>
                <Label htmlFor="proj_subscription_label" required>
                  Nome da manutenção
                </Label>
                <Input
                  id="proj_subscription_label"
                  name="proj_subscription_label"
                  value={projectForm.subscription_label}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      subscription_label: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field>
                <Label htmlFor="proj_subscription_amount" required>
                  Valor mensal
                </Label>
                <Input
                  id="proj_subscription_amount"
                  name="proj_subscription_amount"
                  value={projectForm.subscription_amount}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      subscription_amount: maskCurrency(event.target.value),
                    }))
                  }
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                />
              </Field>

              <Field>
                <Label htmlFor="proj_subscription_due_day" required>
                  Dia de vencimento
                </Label>
                <Input
                  id="proj_subscription_due_day"
                  name="proj_subscription_due_day"
                  type="number"
                  min={1}
                  max={31}
                  value={projectForm.subscription_due_day}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      subscription_due_day: sanitizeInteger(event.target.value).slice(0, 2),
                    }))
                  }
                />
              </Field>

              <Field>
                <Label htmlFor="proj_subscription_starts_on" required>
                  Inicio da manutenção
                </Label>
                <Input
                  id="proj_subscription_starts_on"
                  name="proj_subscription_starts_on"
                  value={projectForm.subscription_starts_on}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      subscription_starts_on: maskDate(event.target.value),
                    }))
                  }
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              <Field className="sm:col-span-2">
                <Label htmlFor="proj_subscription_ends_on">Encerramento da manutenção</Label>
                <Input
                  id="proj_subscription_ends_on"
                  name="proj_subscription_ends_on"
                  value={projectForm.subscription_ends_on}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      subscription_ends_on: maskDate(event.target.value),
                    }))
                  }
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>
            </div>
          ) : null}
        </div>

        <Field>
          <Label htmlFor="proj_description">Descrição do projeto</Label>
          <Textarea
            id="proj_description"
            name="proj_description"
            rows={3}
            value={projectForm.description}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Descrição geral do projeto (escopo, objetivos, contexto)..."
          />
        </Field>

        <Field>
          <Label htmlFor="proj_client_visible_summary">Resumo visivel para o cliente</Label>
          <Textarea
            id="proj_client_visible_summary"
            name="proj_client_visible_summary"
            rows={5}
            value={projectForm.client_visible_summary}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                client_visible_summary: event.target.value,
              }))
            }
          />
        </Field>

        <Field>
          <Label htmlFor="proj_production_url">Link do site / produto do cliente</Label>
          <Input
            id="proj_production_url"
            name="proj_production_url"
            type="url"
            inputMode="url"
            value={projectForm.production_url}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                production_url: event.target.value,
              }))
            }
            placeholder="https://akproducoes.com.br"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Aparece como botão de acesso direto tanto no portal admin quanto no portal do cliente.
            Use a URL pública do site ou produto entregue.
          </p>
        </Field>

        <Field>
          <Label htmlFor="proj_internal_notes">Notas internas</Label>
          <Textarea
            id="proj_internal_notes"
            name="proj_internal_notes"
            rows={3}
            value={projectForm.internal_notes}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                internal_notes: event.target.value,
              }))
            }
            placeholder="Notas visiveis apenas para a equipe interna..."
          />
          <p className="text-xs text-muted-foreground mt-1">Visivel apenas para administradores.</p>
        </Field>

        <Button type="button" disabled={saving} onClick={() => void handleSaveProject()}>
          {saving ? "Salvando..." : "Salvar atualizacao"}
        </Button>
      </CardContent>
    </Card>
  );
  const openSteps = nextSteps.filter((s) => s.status !== "concluido" && s.status !== "cancelado");
  const closedSteps = nextSteps.filter((s) => s.status === "concluido" || s.status === "cancelado");

  const toggleHistoryExpand = (id: string) => {
    setExpandedHistoryIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const nextStepsCard = (
    <Card className="border-border/70 bg-card/92">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Pendências do projeto</CardTitle>
          {nextSteps.length > 0 && (
            <span className="text-xs text-muted-foreground">{openSteps.length} em aberto</span>
          )}
        </div>
        {/* Tabs */}
        <div className="mt-3 flex gap-1">
          <button
            type="button"
            onClick={() => setNextStepsTab("pendências")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              nextStepsTab === "pendências"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Pendências ({openSteps.length})
          </button>
          <button
            type="button"
            onClick={() => setNextStepsTab("historico")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              nextStepsTab === "historico"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Histórico ({closedSteps.length})
          </button>
        </div>
      </CardHeader>
      <CardContent className="relative pt-5">
        {/* ── Tab: Pendências (open) ── */}
        <div
          className={cn(
            "space-y-3",
            nextStepsTab !== "pendências" && "invisible h-0 overflow-hidden"
          )}
        >
          <>
            {openSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pendência em aberto.</p>
            ) : (
              openSteps.map((step) => {
                const form = nextStepForms[step.id] ?? getNextStepFormDefaults(step);

                return (
                  <div
                    key={step.id}
                    className="rounded-xl border border-border/50 bg-background/60 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Input
                        id={`step_title_${step.id}`}
                        name="step_title"
                        aria-label="Titulo da pendência"
                        value={form.title}
                        onChange={(event) =>
                          setNextStepForms((current) => ({
                            ...current,
                            [step.id]: { ...form, title: event.target.value },
                          }))
                        }
                        className="flex-1 h-9 text-sm font-semibold"
                      />
                      <StatusBadge
                        label={NEXT_STEP_STATUS_LABEL[form.status]}
                        tone={getNextStepTone(form.status)}
                      />
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <Field>
                        <Label htmlFor={`step_owner_${step.id}`}>Responsavel</Label>
                        <select
                          id={`step_owner_${step.id}`}
                          name="step_owner"
                          value={form.owner}
                          onChange={(event) =>
                            setNextStepForms((current) => ({
                              ...current,
                              [step.id]: {
                                ...form,
                                owner: event.target.value as NextStepOwner,
                              },
                            }))
                          }
                          className={selectClass}
                        >
                          {Object.entries(NEXT_STEP_OWNER_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field>
                        <Label htmlFor={`step_status_${step.id}`}>Status</Label>
                        <select
                          id={`step_status_${step.id}`}
                          name="step_status"
                          value={form.status}
                          onChange={(event) =>
                            setNextStepForms((current) => ({
                              ...current,
                              [step.id]: {
                                ...form,
                                status: event.target.value as NextStepStatus,
                              },
                            }))
                          }
                          className={selectClass}
                        >
                          {Object.entries(NEXT_STEP_STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field>
                        <Label htmlFor={`step_due_date_${step.id}`}>Vencimento</Label>
                        <Input
                          id={`step_due_date_${step.id}`}
                          name="step_due_date"
                          value={form.due_date}
                          onChange={(event) =>
                            setNextStepForms((current) => ({
                              ...current,
                              [step.id]: {
                                ...form,
                                due_date: maskDate(event.target.value),
                              },
                            }))
                          }
                          placeholder="DD/MM/AAAA"
                          inputMode="numeric"
                        />
                      </Field>
                    </div>

                    <Field className="mt-3">
                      <Label htmlFor={`step_description_${step.id}`}>Descrição</Label>
                      <Textarea
                        id={`step_description_${step.id}`}
                        name="step_description"
                        rows={2}
                        value={form.description}
                        onChange={(event) =>
                          setNextStepForms((current) => ({
                            ...current,
                            [step.id]: { ...form, description: event.target.value },
                          }))
                        }
                      />
                    </Field>

                    {step.requires_client_action && step.client_response && (
                      <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase text-accent mb-1">
                              Resposta do cliente
                              {step.client_responded_at
                                ? ` — ${new Date(step.client_responded_at).toLocaleDateString("pt-BR")}`
                                : ""}
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {step.client_response}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0 border-success/50 text-success hover:bg-success/10 hover:text-success"
                            disabled={stepSavingId === step.id}
                            onClick={() => void handleCloseNextStep(step.id)}
                          >
                            {stepSavingId === step.id ? "Concluindo..." : "Concluir pendência"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {step.requires_client_action && !step.client_responded_at && (
                      <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
                        <p className="text-xs font-medium text-warning">
                          Aguardando resposta do cliente
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={form.client_visible}
                          onChange={(event) =>
                            setNextStepForms((current) => ({
                              ...current,
                              [step.id]: {
                                ...form,
                                client_visible: event.target.checked,
                                requires_client_action: event.target.checked
                                  ? form.requires_client_action
                                  : false,
                              },
                            }))
                          }
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        Visivel para o cliente
                      </label>

                      {form.client_visible && (
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-accent font-medium">
                          <input
                            type="checkbox"
                            checked={form.requires_client_action}
                            onChange={(event) =>
                              setNextStepForms((current) => ({
                                ...current,
                                [step.id]: {
                                  ...form,
                                  requires_client_action: event.target.checked,
                                },
                              }))
                            }
                            className="h-4 w-4 rounded border-border accent-accent"
                          />
                          Requer acao do cliente
                        </label>
                      )}

                      <div className="ml-auto">
                        <Button
                          type="button"
                          size="sm"
                          disabled={stepSavingId === step.id}
                          onClick={() => void handleSaveNextStep(step.id)}
                        >
                          {stepSavingId === step.id ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Nova pendência */}
            <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nova pendência
              </p>

              <div className="grid gap-3">
                <Field>
                  <Label htmlFor="new_step_title">Titulo</Label>
                  <Input
                    id="new_step_title"
                    name="new_step_title"
                    value={newNextStepForm.title}
                    onChange={(event) =>
                      setNewNextStepForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-4">
                  <Field>
                    <Label htmlFor="new_step_action_type">Tipo</Label>
                    <select
                      id="new_step_action_type"
                      name="new_step_action_type"
                      value={newNextStepForm.action_type}
                      onChange={(event) =>
                        setNewNextStepForm((current) => ({
                          ...current,
                          action_type: event.target.value as NextStepActionType,
                        }))
                      }
                      className={selectClass}
                    >
                      {Object.entries(NEXT_STEP_ACTION_TYPE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <Label htmlFor="new_step_owner">Responsavel</Label>
                    <select
                      id="new_step_owner"
                      name="new_step_owner"
                      value={newNextStepForm.owner}
                      onChange={(event) =>
                        setNewNextStepForm((current) => ({
                          ...current,
                          owner: event.target.value as NextStepOwner,
                        }))
                      }
                      className={selectClass}
                    >
                      {Object.entries(NEXT_STEP_OWNER_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <Label htmlFor="new_step_status">Status</Label>
                    <select
                      id="new_step_status"
                      name="new_step_status"
                      value={newNextStepForm.status}
                      onChange={(event) =>
                        setNewNextStepForm((current) => ({
                          ...current,
                          status: event.target.value as NextStepStatus,
                        }))
                      }
                      className={selectClass}
                    >
                      {Object.entries(NEXT_STEP_STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <Label htmlFor="new_step_due_date">Vencimento</Label>
                    <Input
                      id="new_step_due_date"
                      name="new_step_due_date"
                      value={newNextStepForm.due_date}
                      onChange={(event) =>
                        setNewNextStepForm((current) => ({
                          ...current,
                          due_date: maskDate(event.target.value),
                        }))
                      }
                      placeholder="DD/MM/AAAA"
                      inputMode="numeric"
                    />
                  </Field>
                </div>

                {newNextStepForm.action_type === "reuniao" && (
                  <Field>
                    <Label htmlFor="new_step_meeting_link">Link da reunião (opcional)</Label>
                    <Input
                      id="new_step_meeting_link"
                      name="new_step_meeting_link"
                      value={newNextStepForm.meeting_link}
                      onChange={(event) =>
                        setNewNextStepForm((current) => ({
                          ...current,
                          meeting_link: event.target.value,
                        }))
                      }
                      placeholder="https://calendar.app.google/... ou https://meet.google.com/..."
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Se não informar, será usado o link padrão de agendamento da Elkys.
                    </p>
                  </Field>
                )}

                <Field>
                  <Label htmlFor="new_step_description">Descrição</Label>
                  <Textarea
                    id="new_step_description"
                    name="new_step_description"
                    rows={2}
                    value={newNextStepForm.description}
                    onChange={(event) =>
                      setNewNextStepForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </Field>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={newNextStepForm.client_visible}
                      onChange={(event) =>
                        setNewNextStepForm((current) => ({
                          ...current,
                          client_visible: event.target.checked,
                          requires_client_action: event.target.checked
                            ? current.requires_client_action
                            : false,
                        }))
                      }
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    Visivel para o cliente
                  </label>

                  {newNextStepForm.client_visible && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-accent font-medium">
                      <input
                        type="checkbox"
                        checked={newNextStepForm.requires_client_action}
                        onChange={(event) =>
                          setNewNextStepForm((current) => ({
                            ...current,
                            requires_client_action: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-border accent-accent"
                      />
                      Requer acao do cliente
                    </label>
                  )}

                  <div className="ml-auto">
                    <Button
                      type="button"
                      size="sm"
                      disabled={creatingStep}
                      onClick={() => void handleCreateNextStep()}
                    >
                      {creatingStep ? "Adicionando..." : "Adicionar pendência"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        </div>

        {/* ── Tab: Histórico (concluded/cancelled) ── */}
        <div
          className={cn(
            "space-y-3",
            nextStepsTab !== "historico" && "invisible h-0 overflow-hidden"
          )}
        >
          <>
            {closedSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pendência concluida ainda.</p>
            ) : (
              closedSteps.map((step) => {
                const isExpanded = expandedHistoryIds.has(step.id);

                return (
                  <div key={step.id}>
                    {/* Compact row */}
                    <button
                      type="button"
                      onClick={() => toggleHistoryExpand(step.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        isExpanded && "rounded-b-none border-b-0"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                          className={cn(
                            "shrink-0 text-muted-foreground transition-transform",
                            isExpanded && "rotate-90"
                          )}
                        >
                          <path d="M4 2l4 4-4 4" />
                        </svg>
                        <p className="truncate text-sm font-medium text-foreground">{step.title}</p>
                      </div>
                      <StatusBadge
                        label={NEXT_STEP_STATUS_LABEL[step.status]}
                        tone={getNextStepTone(step.status)}
                      />
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="rounded-b-xl border border-t-0 border-border/50 bg-background/40 px-4 py-3 space-y-2">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Responsavel: {NEXT_STEP_OWNER_LABEL[step.owner]}</span>
                          {step.due_date && (
                            <span>Vencimento: {formatPortalDate(step.due_date)}</span>
                          )}
                        </div>

                        {step.description && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {step.description}
                          </p>
                        )}

                        {step.requires_client_action && step.client_response && (
                          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                            <p className="text-[10px] font-semibold uppercase text-accent mb-1">
                              Resposta do cliente
                              {step.client_responded_at
                                ? ` — ${new Date(step.client_responded_at).toLocaleDateString("pt-BR")}`
                                : ""}
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {step.client_response}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        </div>
      </CardContent>
    </Card>
  );
  const financeOverviewCard = (() => {
    const totalPaid =
      charges
        .filter((c) => c.status === "pago" && !c.is_historical)
        .reduce((sum, c) => sum + toCents(c.amount), 0) / 100;
    const totalOpen =
      visibleCharges
        .filter(
          (c) =>
            !c.is_historical &&
            c.origin_type !== "mensalidade" &&
            (c.status === "pendente" || c.status === "atrasado")
        )
        .reduce((sum, c) => sum + toCents(c.amount), 0) / 100;

    return (
      <div className="space-y-5">
        {/* Summary metric tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-background/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Valor contratado
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
              {contracts[0] ? formatBRL(Number(contracts[0].total_amount)) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total recebido
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
              {formatBRL(totalPaid)}
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl border bg-background/60 p-4",
              totalOpen > 0 ? "border-destructive/40" : "border-border/50"
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Em aberto
            </p>
            <p
              className={cn(
                "mt-2 text-xl font-semibold tabular-nums",
                totalOpen > 0 ? "text-destructive" : "text-foreground"
              )}
            >
              {formatBRL(totalOpen)}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Parcelas abertas
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
              {visibleInstallments.length}
            </p>
          </div>
        </div>

        {/* Main financial card with sections */}
        <Card className="border-border/70 bg-card/92">
          {/* Contract section */}
          {contracts[0] ? (
            <div className="p-3 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Contrato
              </p>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {formatBRL(Number(contracts[0].total_amount))}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Assinado em {formatPortalDate(contracts[0].signed_at)} · {contracts[0].status}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Subscriptions section */}
          {subscriptions.length > 0 ? (
            <div className={cn("p-3 sm:p-5", contracts[0] ? "border-t border-border/50" : "")}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Assinaturas mensais
              </p>
              <div className="mt-3 space-y-2">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/60 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {subscription.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatBRL(Number(subscription.amount))} · todo dia {subscription.due_day}
                        {subscriptionChargeById[subscription.id]
                          ? ` · próx. ${formatPortalDate(subscriptionChargeById[subscription.id].due_date)}`
                          : ""}
                      </p>
                    </div>
                    <select
                      id={`subscription_status_${subscription.id}`}
                      name="subscription_status"
                      aria-label="Status da assinatura"
                      value={subscription.status}
                      onChange={async (e) => {
                        const next = e.target.value;
                        const { error } = await supabase
                          .from("project_subscriptions")
                          .update({ status: next })
                          .eq("id", subscription.id);
                        if (error) {
                          toast.error("Não foi possível atualizar o status.");
                          return;
                        }
                        toast.success("Status da assinatura atualizado.");
                        void loadProject();
                      }}
                      className="h-8 min-w-[120px] rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="agendada">Agendada</option>
                      <option value="ativa">Ativa</option>
                      <option value="pausada">Pausada</option>
                      <option value="encerrada">Encerrada</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Charges section */}
          {financialItems.length > 0 ? (
            <div
              className={cn(
                "p-3 sm:p-5",
                contracts[0] || subscriptions.length > 0 ? "border-t border-border/50" : ""
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Cobranças
                </p>
                <p className="text-xs text-muted-foreground">
                  {financialItems.length} registro{financialItems.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="space-y-1.5">
                {financialItems
                  .slice(chargesPage * chargesPageSize, (chargesPage + 1) * chargesPageSize)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-border/40 bg-background/60 px-4 py-3 sm:grid-cols-[1fr_110px_160px]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Vence {formatPortalDate(item.dueDate)}
                        </p>
                      </div>
                      <p className="hidden text-right text-sm font-semibold tabular-nums text-foreground sm:block">
                        {formatBRL(Number(item.amount))}
                      </p>
                      <select
                        id={`charge_status_${item.id}`}
                        name="charge_status"
                        aria-label="Status da cobrança"
                        value={item.statusKey}
                        onChange={async (e) => {
                          const next = e.target.value as typeof item.statusKey;
                          const paidAt = next === "pago" ? getLocalDateIso() : null;
                          const { error } = await supabase
                            .from("charges")
                            .update({ status: next, paid_at: paidAt })
                            .eq("id", item.id);
                          if (error) {
                            toast.error("Não foi possível atualizar o status.");
                            return;
                          }
                          toast.success("Status atualizado.");
                          void loadProject();
                        }}
                        className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {Object.entries(CHARGE_STATUS_META).map(([key, meta]) => (
                          <option key={key} value={key}>
                            {meta.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
              <Pagination
                page={chargesPage}
                totalPages={Math.ceil(financialItems.length / chargesPageSize)}
                totalItems={financialItems.length}
                pageSize={chargesPageSize}
                onPageChange={setChargesPage}
              />
            </div>
          ) : !contracts[0] && subscriptions.length === 0 ? (
            <div className="p-3 sm:p-5">
              <AdminEmptyState
                icon={TrendingUp}
                title="Sem cobranças avulsas"
                description="Cobranças extras fora do contrato de parcelas aparecerão aqui."
              />
            </div>
          ) : null}
        </Card>

        {contracts[0] ? (
          <ContractVersionHistory
            contractId={contracts[0].id}
            clientId={project?.client_id}
            projectName={project?.name}
            scopeSummary={contracts[0].scope_summary}
          />
        ) : null}

        {project ? (
          <ProjectOnboardingChecklist
            projectId={project.id}
            initialChecklist={(project as { onboarding_checklist?: unknown }).onboarding_checklist}
            initialCompletedAt={
              (project as { onboarding_completed_at?: string | null }).onboarding_completed_at ??
              null
            }
          />
        ) : null}

        {project ? (
          <ProjectValidationRounds
            projectId={project.id}
            acceptedAt={(project as { accepted_at?: string | null }).accepted_at ?? null}
          />
        ) : null}

        {project ? <ContractAcceptanceStatusCard projectId={project.id} /> : null}

        {project ? (
          <ProjectAcceptanceCard
            projectId={project.id}
            clientId={project.client_id}
            projectName={project.name}
            acceptedAt={(project as { accepted_at?: string | null }).accepted_at ?? null}
            acceptedBy={(project as { accepted_by?: string | null }).accepted_by ?? null}
            acceptanceNotes={
              (project as { acceptance_notes?: string | null }).acceptance_notes ?? null
            }
            deliveredAt={project.delivered_at}
            onAccepted={() => void loadProject()}
          />
        ) : null}

        {project ? (
          <ProjectSupportCard
            projectId={project.id}
            acceptedAt={(project as { accepted_at?: string | null }).accepted_at ?? null}
            warrantyPeriodDays={
              (project as { warranty_period_days?: number }).warranty_period_days ?? 90
            }
          />
        ) : null}
      </div>
    );
  })();

  const installmentsCard =
    visibleInstallments.length === 0 ? null : (
      <Card className="border-border/70 bg-card/92">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-base">
            Parcelas do projeto{" "}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              ({visibleInstallments.length} em aberto)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          <p className="text-xs text-muted-foreground">
            Percentual e vencimento são definidos em contrato. Atualize apenas o status de cada
            parcela.
          </p>

          {visibleInstallments.map((installment) => {
            const draft =
              installmentForms[installment.id] ?? getInstallmentFormDefaults(installment);
            const percentage = Number(installment.percentage || 0);
            const amountValue = Math.round(contractAmount * percentage) / 100;
            const dueDate = installment.effective_due_date ?? installment.expected_due_date ?? null;

            return (
              <div
                key={installment.id}
                className="rounded-xl border border-border/50 bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold capitalize text-foreground">
                      {installment.installment_type}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {percentage}% · {formatBRL(amountValue)}
                      {dueDate ? ` · vence ${formatPortalDate(dueDate)}` : ""}
                    </p>
                  </div>
                  <StatusBadge
                    label={PROJECT_INSTALLMENT_STATUS_LABEL[draft.status]}
                    tone={getInstallmentTone(draft.status)}
                  />
                </div>

                {percentage > 0 ? (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 flex items-center gap-2">
                  <select
                    id={`installment_status_${installment.id}`}
                    name="installment_status"
                    aria-label="Status da parcela"
                    value={draft.status}
                    onChange={(event) =>
                      setInstallmentForms((current) => ({
                        ...current,
                        [installment.id]: {
                          ...draft,
                          status: event.target.value as InstallmentStatus,
                        },
                      }))
                    }
                    className="h-10 min-h-[44px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {Object.entries(PROJECT_INSTALLMENT_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingInstallments}
                    onClick={() => void handleSaveInstallments(installment.id)}
                  >
                    {savingInstallmentId === installment.id ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  const documentsCard = (
    <Card className="border-border/70 bg-card/92">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Anexos do projeto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {client ? (
          <AddProjectDocumentForm
            clientId={client.id}
            projectId={project.id}
            actorUserId={user?.id ?? null}
            allowContractType={allowContractType}
            onAdded={async () => {
              await loadProject();
            }}
          />
        ) : null}

        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há anexos vinculados a este projeto.
          </p>
        ) : (
          (() => {
            // PA15: filtro por tipo de documento (contrato, proposta etc).
            // Pills sobre a lista — padrao identico ao filtro de status em
            // Contracts.tsx. 'Todos' quando sem filtro.
            const filteredDocs =
              docsTypeFilter === "all"
                ? documents
                : documents.filter((d) => d.type === docsTypeFilter);
            const totalPages = Math.max(1, Math.ceil(filteredDocs.length / chargesPageSize));
            const currentPage = Math.min(docsPage, totalPages - 1);
            return (
              <>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["all", ...(Object.keys(DOCUMENT_TYPE_LABEL) as DocumentType[])] as Array<
                      "all" | DocumentType
                    >
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setDocsTypeFilter(t);
                        setDocsPage(0);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        docsTypeFilter === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {t === "all" ? "Todos" : DOCUMENT_TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>

                {filteredDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum anexo desse tipo neste projeto.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredDocs
                      .slice(currentPage * chargesPageSize, (currentPage + 1) * chargesPageSize)
                      .map((document) => (
                        <a
                          key={document.id}
                          href={document.external_url ?? document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl border border-border/50 bg-background/60 p-4 transition-colors hover:border-primary/30"
                        >
                          <p className="text-sm font-semibold text-foreground">{document.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {DOCUMENT_TYPE_LABEL[document.type]}
                          </p>
                        </a>
                      ))}
                  </div>
                )}

                {filteredDocs.length > chargesPageSize ? (
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredDocs.length}
                    pageSize={chargesPageSize}
                    onPageChange={setDocsPage}
                  />
                ) : null}
              </>
            );
          })()
        )}
      </CardContent>
    </Card>
  );

  const timelineCard = (
    <Card className="border-border/70 bg-card/92">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <ProjectTimelineFeed
          events={timeline}
          emptyMessage="A timeline ainda não possui eventos registrados."
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Projeto"
        title={project.name}
        description={`${client ? getClientDisplayName(client) : "Cliente não encontrado"} · ${project.solution_type ?? "Tipo não definido"} · ${project.current_stage}`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <ProjectSiteLink url={project.production_url} />
            {client ? (
              <Link
                to={`/portal/admin/clientes/${client.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Ver cliente
              </Link>
            ) : null}
            <CopyLinkButton />
            <Link
              to={`/portal/admin/audit-log?entity=project&entityId=${project.id}`}
              className={buttonVariants({ variant: "outline" })}
              title="Ver historico de alteracoes deste projeto"
            >
              Ver histórico
            </Link>
            <Link to="/portal/admin/projetos" className={buttonVariants({ variant: "outline" })}>
              Voltar
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge label={projectStatusMeta.label} tone={projectStatusMeta.tone} />
        {project.solution_type ? (
          <StatusBadge label={project.solution_type} tone="secondary" />
        ) : null}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border/50 bg-background/40 p-1">
        {projectTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "detalhes" ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2 [&>*>*]:h-full">
            <div className="space-y-6">{summaryCard}</div>
            <div className="space-y-6">{detailsWorkspaceCard}</div>
          </div>

          {/* Diagnóstico do lead — contexto herdado da negociação */}
          {projectDiagnosis && Object.values(projectDiagnosis).some(Boolean) && (
            <Card className="mt-6 rounded-2xl border-accent/20 bg-accent/5">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
                  Contexto do diagnóstico comercial
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {projectDiagnosis.context && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Contexto
                      </p>
                      <p className="text-xs text-foreground">{projectDiagnosis.context}</p>
                    </div>
                  )}
                  {projectDiagnosis.problem && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Problema
                      </p>
                      <p className="text-xs text-foreground">{projectDiagnosis.problem}</p>
                    </div>
                  )}
                  {projectDiagnosis.objective && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Objetivo
                      </p>
                      <p className="text-xs text-foreground">{projectDiagnosis.objective}</p>
                    </div>
                  )}
                  {projectDiagnosis.business_impact && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Impacto no negócio
                      </p>
                      <p className="text-xs text-foreground">{projectDiagnosis.business_impact}</p>
                    </div>
                  )}
                  {projectDiagnosis.constraints && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Restrições
                      </p>
                      <p className="text-xs text-foreground">{projectDiagnosis.constraints}</p>
                    </div>
                  )}
                  {projectDiagnosis.urgency && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Urgência
                      </p>
                      <p className="text-xs capitalize text-foreground">
                        {projectDiagnosis.urgency}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      {tab === "financeiro" ? (
        <div
          className={cn("grid gap-6", installmentsCard ? "xl:grid-cols-[minmax(0,1fr)_440px]" : "")}
        >
          <div>{financeOverviewCard}</div>
          {installmentsCard ? <div>{installmentsCard}</div> : null}
        </div>
      ) : null}

      {tab === "timeline" ? timelineCard : null}

      {tab === "documentos" ? documentsCard : null}

      <OverlayPanel
        open={projectUpdateOpen}
        title="Atualizacao do projeto"
        description="Edite dados principais sem esticar a pagina inteira."
        onClose={() => setProjectUpdateOpen(false)}
      >
        {projectUpdateCard}
      </OverlayPanel>

      <OverlayPanel
        open={nextStepsOpen}
        title="Pendências do projeto"
        description="Atualize responsavel, status e visibilidade do cliente em um painel dedicado."
        onClose={() => setNextStepsOpen(false)}
        widthClass="max-w-4xl"
      >
        {nextStepsCard}
      </OverlayPanel>
    </div>
  );
}
