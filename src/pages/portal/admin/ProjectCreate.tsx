import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { CheckCircle, FileText, Home, Users } from "@/assets/icons";
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
import AlertBanner from "@/components/portal/shared/AlertBanner";
import { useFormDraftAutoSave } from "@/hooks/useFormDraftAutoSave";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";
import {
  formatBRL,
  formatDateInput,
  getLocalDateIso,
  maskCurrency,
  maskDate,
  parseFormDate,
  unmaskCurrency,
} from "@/lib/masks";
import {
  PROJECT_STAGE_OPTIONS,
  PROJECT_STATUS_META,
  PROJECT_TAG_OPTIONS,
  getClientDisplayName,
  getProjectStatusForStage,
} from "@/lib/portal";
import { getSubscriptionCoverageEnd, listSubscriptionDueDates } from "@/lib/subscription-charges";

type PortalClient = Database["public"]["Tables"]["clients"]["Row"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type NextStepOwner = Database["public"]["Enums"]["next_step_owner"];

type ProjectCreateForm = {
  client_id: string;
  name: string;
  solution_type: string;
  summary: string;
  status: ProjectStatus;
  current_stage: string;
  started_at: string;
  expected_delivery_date: string;
  is_retroactive: boolean;
  delivered_at: string;
  total_amount: string;
  entry_percentage: string;
  delivery_percentage: string;
  signed_at: string;
  contract_starts_at: string;
  contract_ends_at: string;
  scope_summary: string;
  entry_due_date: string;
  delivery_due_date: string;
  contract_already_paid: boolean;
  has_subscription: boolean;
  subscription_label: string;
  subscription_amount: string;
  subscription_due_day: string;
  subscription_starts_on: string;
  client_visible_summary: string;
  next_step_title: string;
  next_step_description: string;
  next_step_owner: NextStepOwner;
  tags: string[];
  tag_input: string;
};

function formatDraftSavedAt(date: Date | null): string {
  if (!date) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin === 1) return "ha 1 min";
  if (diffMin < 60) return `ha ${diffMin} min`;
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function DraftStatus({
  pending,
  savedAt,
  onClear,
}: {
  pending: boolean;
  savedAt: Date | null;
  onClear: () => void;
}) {
  if (!pending && !savedAt) return null;
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          pending ? "animate-pulse bg-warning" : "bg-success"
        )}
      />
      {pending ? "Salvando rascunho..." : `Rascunho salvo ${formatDraftSavedAt(savedAt)}`}
      {savedAt && !pending ? (
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          descartar
        </button>
      ) : null}
    </div>
  );
}

const STEPS = [
  { label: "Projeto", description: "Cliente, escopo, etapa e status inicial.", icon: Users },
  {
    label: "Contrato",
    description: "Valor total, regra 50/50 e datas principais.",
    icon: FileText,
  },
  {
    label: "Recorrencia",
    description: "Mensalidade opcional, visão do cliente e próximos passos.",
    icon: Home,
  },
  {
    label: "Revisao",
    description: "Conferencia antes de criar projeto, contrato e cobranças.",
    icon: CheckCircle,
  },
] as const;

const selectClass =
  "flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const done = index < current;
        const active = index === current;

        return (
          <div
            key={step.label}
            className={cn(
              "rounded-xl border p-4 transition-all",
              active
                ? "border-primary/25 bg-primary-soft/70 shadow-card-hover"
                : done
                  ? "border-border/70 bg-background/90"
                  : "border-border/60 bg-background/65"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border",
                  active
                    ? "border-primary/20 bg-card text-primary"
                    : done
                      ? "border-primary/15 bg-primary-soft text-primary"
                      : "border-border/70 bg-card text-muted-foreground"
                )}
              >
                <Icon size={18} />
              </div>

              <div
                className={cn(
                  "inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-md border px-2 text-xs font-semibold tracking-wide",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary/25 bg-background text-primary"
                      : "border-border/70 bg-background text-muted-foreground"
                )}
              >
                {done ? <CheckCircle size={14} /> : String(index + 1).padStart(2, "0")}
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  active || done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function computeInstallmentValues(
  totalAmount: number,
  entryPercentage: number,
  deliveryPercentage: number
) {
  const entry = Number(((totalAmount * entryPercentage) / 100).toFixed(2));
  const delivery = Number((totalAmount - entry).toFixed(2));
  return { entry, delivery };
}

function sanitizePercentageValue(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, "").slice(0, 3);
  if (!digitsOnly) return "";
  return String(Math.min(100, Number(digitsOnly)));
}

export default function AdminProjectCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") ?? "";

  const [clients, setClients] = useState<PortalClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const today = formatDateInput(getLocalDateIso());
  const [form, setForm] = useState<ProjectCreateForm>({
    client_id: preselectedClientId,
    name: "",
    solution_type: "",
    summary: "",
    status: "negociacao",
    current_stage: PROJECT_STAGE_OPTIONS[0].value,
    started_at: today,
    expected_delivery_date: "",
    is_retroactive: false,
    delivered_at: today,
    total_amount: "",
    entry_percentage: "50",
    delivery_percentage: "50",
    signed_at: today,
    contract_starts_at: today,
    contract_ends_at: "",
    scope_summary: "",
    entry_due_date: today,
    delivery_due_date: "",
    contract_already_paid: false,
    has_subscription: false,
    subscription_label: "Manutenção e hospedagem",
    subscription_amount: "",
    subscription_due_day: "10",
    subscription_starts_on: today,
    client_visible_summary: "",
    next_step_title: "",
    next_step_description: "",
    next_step_owner: "elkys",
    tags: [],
    tag_input: "",
  });

  useEffect(() => {
    const loadClients = async () => {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from("clients")
        .select(
          "id, full_name, client_type, nome_fantasia, is_active, project_total_value, monthly_value, client_since"
        )
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        setFormError(error.message);
        setLoadingClients(false);
        return;
      }

      const nextClients = (data as PortalClient[] | null) ?? [];
      setClients(nextClients);
      setLoadingClients(false);

      if (!preselectedClientId && nextClients.length === 1) {
        setForm((current) => ({ ...current, client_id: nextClients[0].id }));
      }
    };

    void loadClients();
  }, [preselectedClientId]);

  const {
    savedAt: draftSavedAt,
    clearDraft,
    isPending: draftPending,
  } = useFormDraftAutoSave<ProjectCreateForm>({
    storageKey: "elkys:admin:project-create:draft",
    values: form,
    onRestore: (restored) => setForm(restored),
  });

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === form.client_id) ?? null,
    [clients, form.client_id]
  );

  const installmentPreview = useMemo(() => {
    const totalAmount = unmaskCurrency(form.total_amount);
    const entryPercentage = Number(form.entry_percentage || 0);
    const deliveryPercentage = Number(form.delivery_percentage || 0);
    return computeInstallmentValues(totalAmount, entryPercentage, deliveryPercentage);
  }, [form.delivery_percentage, form.entry_percentage, form.total_amount]);
  const derivedStatus = useMemo(
    () => (form.is_retroactive ? "concluido" : getProjectStatusForStage(form.current_stage)),
    [form.current_stage, form.is_retroactive]
  );
  const derivedStatusMeta = PROJECT_STATUS_META[derivedStatus];

  const setField = <K extends keyof ProjectCreateForm>(field: K, value: ProjectCreateForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  };

  const validateStep = () => {
    if (step >= 0) {
      if (!form.client_id) return "Selecione o cliente do projeto.";
      if (form.name.trim().length < 3) return "Informe o nome do projeto.";
      if (form.solution_type.trim().length < 3) return "Informe o tipo da solucao.";
      if (form.current_stage.trim().length < 3) return "Informe a etapa atual.";
      if (!parseFormDate(form.started_at)) return "Informe uma data valida para inicio do projeto.";
      if (form.expected_delivery_date && !parseFormDate(form.expected_delivery_date)) {
        return "Informe uma data valida para entrega prevista.";
      }
      if (form.expected_delivery_date && parseFormDate(form.expected_delivery_date)) {
        const startIso = parseFormDate(form.started_at);
        const deliveryIso = parseFormDate(form.expected_delivery_date);
        if (startIso && deliveryIso && deliveryIso < startIso) {
          return "A entrega prevista não pode ser anterior ao início do projeto.";
        }
      }
    }

    if (step >= 1) {
      if (!form.total_amount || unmaskCurrency(form.total_amount) <= 0) {
        return "Informe o valor total do contrato.";
      }
      const entryPercentage = Number(form.entry_percentage);
      const deliveryPercentage = Number(form.delivery_percentage);
      if (!Number.isFinite(entryPercentage) || entryPercentage < 0 || entryPercentage > 100) {
        return "Informe uma porcentagem valida para a entrada.";
      }
      if (
        !Number.isFinite(deliveryPercentage) ||
        deliveryPercentage < 0 ||
        deliveryPercentage > 100
      ) {
        return "Informe uma porcentagem valida para a entrega.";
      }
      if (Math.abs(entryPercentage + deliveryPercentage - 100) > 0.001) {
        return "As porcentagens de entrada e entrega devem somar 100%.";
      }
      if (!parseFormDate(form.signed_at)) return "Informe uma data valida para assinatura.";
      if (!parseFormDate(form.contract_starts_at))
        return "Informe uma data valida para início contratual.";
      if (form.contract_ends_at && !parseFormDate(form.contract_ends_at)) {
        return "Informe uma data valida para fim contratual.";
      }
      const contractStartsAt = parseFormDate(form.contract_starts_at);
      const contractEndsAt = parseFormDate(form.contract_ends_at);
      if (contractStartsAt && contractEndsAt && contractEndsAt < contractStartsAt) {
        return "O fim contratual não pode ser anterior ao início contratual.";
      }
      if (!parseFormDate(form.entry_due_date)) return "Informe o vencimento da entrada.";
      if (!parseFormDate(form.delivery_due_date)) return "Informe o vencimento da entrega.";
    }

    if (step >= 2 && form.has_subscription) {
      if (!form.subscription_label.trim()) return "Informe o nome da assinatura.";
      if (!form.subscription_amount || unmaskCurrency(form.subscription_amount) <= 0) {
        return "Informe o valor mensal.";
      }
      const dueDay = Number(form.subscription_due_day);
      if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        return "Informe um vencimento mensal entre 1 e 31.";
      }
      if (!parseFormDate(form.subscription_starts_on)) {
        return "Informe uma data valida para inicio da assinatura.";
      }
    }

    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      setFormError(error);
      return;
    }

    setStep((current) => current + 1);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const error = validateStep();
    if (error) {
      setFormError(error);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const startedAtIso = parseFormDate(form.started_at);
    const expectedDeliveryIso = parseFormDate(form.expected_delivery_date);
    const signedAtIso = parseFormDate(form.signed_at);
    const contractStartsAtIso = parseFormDate(form.contract_starts_at);
    const contractEndsAtIso = parseFormDate(form.contract_ends_at);
    const entryDueDateIso = parseFormDate(form.entry_due_date);
    const deliveryDueDateIso = parseFormDate(form.delivery_due_date);
    const deliveredAtIso = form.is_retroactive ? parseFormDate(form.delivered_at) : null;
    const todayIso = getLocalDateIso();

    try {
      // Auditoria P-001: criacao agora e atomica via RPC. Toda a estrutura
      // (project + contract + installments + charges + opcional subscription/
      // next_step + timeline) entra em uma unica transacao Postgres. Se
      // qualquer passo falhar, nada e persistido — sem rollback manual.
      const subscriptionPayload = (() => {
        if (!form.has_subscription) return null;
        const amount = unmaskCurrency(form.subscription_amount);
        const dueDay = Number(form.subscription_due_day);
        const subscriptionStartsOnIso = parseFormDate(form.subscription_starts_on);
        const subscriptionEndsOn = getSubscriptionCoverageEnd(contractEndsAtIso, null);
        const recurringDueDates = listSubscriptionDueDates({
          startsOn: subscriptionStartsOnIso ?? "",
          dueDay,
          endsOn: subscriptionEndsOn,
          mode: "create",
        });
        return {
          label: form.subscription_label.trim(),
          amount,
          due_day: dueDay,
          starts_on: subscriptionStartsOnIso,
          ends_on: subscriptionEndsOn,
          status: "ativa",
          is_blocking: true,
          recurring_charges: recurringDueDates.map((dueDate) => ({
            due_date: dueDate,
            status: dueDate > todayIso ? "agendada" : "pendente",
          })),
        };
      })();

      const nextStepPayload = form.next_step_title.trim()
        ? {
            title: form.next_step_title.trim(),
            description: form.next_step_description.trim() || null,
            owner: form.next_step_owner,
            client_visible: true,
            sort_order: 0,
          }
        : null;

      const timelineEvents: Array<{
        event_type: string;
        title: string;
        summary: string;
        visibility: string;
        source_kind: "project" | "contract" | "subscription" | "next_step";
        metadata?: Record<string, unknown>;
      }> = [
        {
          event_type: "project_created",
          title: "Projeto criado",
          summary: `Projeto ${form.name.trim()} cadastrado no portal.`,
          visibility: "ambos",
          source_kind: "project",
        },
        {
          event_type: "project_stage_changed",
          title: "Etapa inicial definida",
          summary: `O projeto foi iniciado em ${form.current_stage.trim()}.`,
          visibility: "ambos",
          source_kind: "project",
          metadata: { to_stage: form.current_stage.trim(), derived_status: derivedStatus },
        },
        {
          event_type: "contract_created",
          title: "Estrutura contratual criada",
          summary: "Contrato e parcelas iniciais foram estruturados no sistema.",
          visibility: "interno",
          source_kind: "contract",
        },
      ];
      if (subscriptionPayload) {
        timelineEvents.push({
          event_type: "subscription_created",
          title: "Mensalidade configurada",
          summary: "Assinatura mensal vinculada ao projeto.",
          visibility: "interno",
          source_kind: "subscription",
        });
      }
      if (nextStepPayload) {
        timelineEvents.push({
          event_type: "next_step_created",
          title: "Primeira pendência registrada",
          summary: `${nextStepPayload.title} foi adicionada ao plano de acao do projeto.`,
          visibility: "ambos",
          source_kind: "next_step",
          metadata: { owner: form.next_step_owner },
        });
      }

      const rpcInput = {
        client_id: form.client_id,
        project: {
          name: form.name.trim(),
          description: form.summary.trim() || null,
          status: derivedStatus,
          current_stage: form.current_stage.trim(),
          billing_type: form.has_subscription ? "mensal" : "projeto",
          started_at: startedAtIso,
          solution_type: form.solution_type.trim(),
          expected_delivery_date: expectedDeliveryIso,
          client_visible_summary: form.client_visible_summary.trim() || null,
          tags: form.tags,
          delivered_at: deliveredAtIso,
        },
        contract: {
          total_amount: unmaskCurrency(form.total_amount),
          signed_at: signedAtIso,
          starts_at: contractStartsAtIso,
          ends_at: contractEndsAtIso,
          scope_summary: form.scope_summary.trim() || form.summary.trim() || null,
          status: form.contract_already_paid ? "encerrado" : "rascunho",
        },
        installments: {
          entry: {
            percentage: Number(form.entry_percentage),
            amount: installmentPreview.entry,
            expected_due_date: entryDueDateIso,
            status: form.contract_already_paid ? "paga" : "pendente",
            paid_at: form.contract_already_paid ? (entryDueDateIso ?? todayIso) : null,
            is_blocking: true,
          },
          delivery: {
            percentage: Number(form.delivery_percentage),
            amount: installmentPreview.delivery,
            expected_due_date: deliveryDueDateIso,
            status: form.contract_already_paid ? "paga" : "agendada",
            paid_at: form.contract_already_paid ? (deliveryDueDateIso ?? todayIso) : null,
            is_blocking: true,
          },
        },
        charges: [
          {
            description: `Entrada ${form.entry_percentage}% - ${form.name.trim()}`,
            amount: installmentPreview.entry,
            due_date: entryDueDateIso,
            status: form.contract_already_paid ? "pago" : "pendente",
            paid_at: form.contract_already_paid ? (entryDueDateIso ?? todayIso) : null,
            is_blocking: true,
            is_historical: form.contract_already_paid,
          },
          {
            description: `Entrega ${form.delivery_percentage}% - ${form.name.trim()}`,
            amount: installmentPreview.delivery,
            due_date: deliveryDueDateIso,
            status: form.contract_already_paid ? "pago" : "pendente",
            paid_at: form.contract_already_paid ? (deliveryDueDateIso ?? todayIso) : null,
            is_blocking: true,
            is_historical: form.contract_already_paid,
          },
        ],
        subscription: subscriptionPayload,
        next_step: nextStepPayload,
        timeline_events: timelineEvents,
      };

      const { data: createdProjectId, error: rpcError } = await supabase.rpc(
        "create_project_with_billing",
        { p_input: rpcInput as never }
      );

      if (rpcError || !createdProjectId) {
        throw rpcError ?? new Error("Falha ao criar projeto.");
      }

      // Snapshot legado em clients (P-006: sera removido em step futuro).
      // Mantido fire-and-forget por compatibilidade — falha aqui nao afeta
      // a criacao porque os dados primarios ja foram persistidos.
      if (selectedClient) {
        const nextProjectTotalValue =
          Number(selectedClient.project_total_value) + unmaskCurrency(form.total_amount);
        const nextMonthlyValue = form.has_subscription
          ? Number(selectedClient.monthly_value) + unmaskCurrency(form.subscription_amount)
          : Number(selectedClient.monthly_value);
        void supabase
          .from("clients")
          .update({
            project_total_value: nextProjectTotalValue,
            monthly_value: nextMonthlyValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedClient.id);
      }

      // Notificar cliente — fire-and-forget. Falha de email nao reverte projeto.
      try {
        const authHeaders = await getSupabaseFunctionAuthHeaders();
        void supabase.functions.invoke("send-project-created", {
          body: {
            client_id: form.client_id,
            project_name: form.name,
            solution_type: form.solution_type || undefined,
            current_stage: form.current_stage || undefined,
          },
          headers: authHeaders,
        });
      } catch {
        // Non-blocking
      }

      toast.success("Projeto criado com sucesso.", {
        description: "Contrato, cobranças e estrutura inicial foram registrados.",
      });

      clearDraft();
      navigate(`/portal/admin/projetos/${createdProjectId}`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar o projeto.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <DraftStatus pending={draftPending} savedAt={draftSavedAt} onClear={clearDraft} />
        <Link
          to={
            selectedClient
              ? `/portal/admin/clientes/${selectedClient.id}`
              : "/portal/admin/projetos"
          }
          className={buttonVariants({ variant: "outline" })}
        >
          Voltar
        </Link>
      </div>

      <Card className="border-border/70 bg-card/92 shadow-card">
        <CardHeader className="gap-4 border-b border-border/60">
          <div className="space-y-2">
            <CardTitle className="text-xl">{STEPS[step].label}</CardTitle>
            <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
          </div>
          <StepIndicator current={step} />
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {formError ? <AlertBanner tone="destructive" title={formError} /> : null}
          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field className="md:col-span-2">
                <Label htmlFor="client_id" required>
                  Cliente
                </Label>
                <select
                  id="client_id"
                  name="client_id"
                  value={form.client_id}
                  onChange={(event) => setField("client_id", event.target.value)}
                  className={selectClass}
                  disabled={loadingClients}
                >
                  <option value="">Selecionar cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {getClientDisplayName(client)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <Label required>Nome do projeto</Label>
                <Input
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="solution_type" required>
                  Tipo de solucao
                </Label>
                <Input
                  id="solution_type"
                  name="solution_type"
                  value={form.solution_type}
                  onChange={(event) => setField("solution_type", event.target.value)}
                  placeholder="Ex: Site institucional, chatbot, landing page"
                />
              </Field>

              <Field>
                <Label>Status inicial</Label>
                <div className="flex min-h-[44px] items-center rounded-md border border-border/70 bg-background/70 px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">{derivedStatusMeta.label}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  A etapa selecionada define automáticamente o status inicial do projeto.
                </p>
              </Field>

              <Field>
                <Label htmlFor="current_stage" required>
                  Etapa atual
                </Label>
                <select
                  id="current_stage"
                  name="current_stage"
                  value={form.current_stage}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      current_stage: event.target.value,
                      status:
                        current.status === "pausado" || current.status === "cancelado"
                          ? current.status
                          : getProjectStatusForStage(event.target.value),
                    }))
                  }
                  className={selectClass}
                >
                  {PROJECT_STAGE_OPTIONS.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.order}a etapa - {stage.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <Label htmlFor="started_at">Inicio</Label>
                <Input
                  id="started_at"
                  name="started_at"
                  value={form.started_at}
                  onChange={(event) => setField("started_at", maskDate(event.target.value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              <Field>
                <Label htmlFor="expected_delivery_date">Entrega prevista</Label>
                <Input
                  id="expected_delivery_date"
                  name="expected_delivery_date"
                  value={form.expected_delivery_date}
                  onChange={(event) =>
                    setField("expected_delivery_date", maskDate(event.target.value))
                  }
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              <div className="md:col-span-2 rounded-xl border border-border/70 bg-background/60 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.is_retroactive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_retroactive: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Projeto retroativo (cadastro de cliente antigo)
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Use para registrar projetos ja concluídos antes do sistema existir. O status
                      será definido como Concluído automáticamente.
                    </p>
                  </div>
                </label>
              </div>

              {form.is_retroactive ? (
                <Field>
                  <Label htmlFor="delivered_at">Data real de entrega</Label>
                  <Input
                    id="delivered_at"
                    name="delivered_at"
                    value={form.delivered_at}
                    onChange={(event) => setField("delivered_at", maskDate(event.target.value))}
                    placeholder="DD/MM/AAAA"
                    inputMode="numeric"
                  />
                </Field>
              ) : null}

              <Field className="md:col-span-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_TAG_OPTIONS.map((tag) => {
                    const isSelected = form.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setField(
                            "tags",
                            isSelected ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field className="md:col-span-2">
                <Label htmlFor="summary">Resumo interno do projeto</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  value={form.summary}
                  onChange={(event) => setField("summary", event.target.value)}
                  rows={4}
                  placeholder="Resumo operacional para orientar time e cadastro."
                />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 rounded-xl border border-border/70 bg-background/60 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.contract_already_paid}
                    onChange={(event) => setField("contract_already_paid", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Contrato já quitado (pagamentos ja realizados)
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Marca todas as parcelas e cobranças como pagas e históricas. Não entram em
                      contas a receber nem afetam o fluxo de caixa operacional.
                    </p>
                  </div>
                </label>
              </div>

              <Field>
                <Label htmlFor="total_amount" required>
                  Valor total do contrato
                </Label>
                <Input
                  id="total_amount"
                  name="total_amount"
                  value={form.total_amount}
                  onChange={(event) => setField("total_amount", maskCurrency(event.target.value))}
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                />
              </Field>

              <Field>
                <Label htmlFor="signed_at">Data da assinatura</Label>
                <Input
                  id="signed_at"
                  name="signed_at"
                  value={form.signed_at}
                  onChange={(event) => setField("signed_at", maskDate(event.target.value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              <Field>
                <Label htmlFor="contract_starts_at">Inicio contratual</Label>
                <Input
                  id="contract_starts_at"
                  name="contract_starts_at"
                  value={form.contract_starts_at}
                  onChange={(event) => setField("contract_starts_at", maskDate(event.target.value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              <Field>
                <Label htmlFor="contract_ends_at">Fim contratual</Label>
                <Input
                  id="contract_ends_at"
                  name="contract_ends_at"
                  value={form.contract_ends_at}
                  onChange={(event) => setField("contract_ends_at", maskDate(event.target.value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              <Field className="md:col-span-2">
                <Label htmlFor="scope_summary">Escopo resumido</Label>
                <Textarea
                  id="scope_summary"
                  name="scope_summary"
                  value={form.scope_summary}
                  onChange={(event) => setField("scope_summary", event.target.value)}
                  rows={4}
                  placeholder="Resumo juridico/comercial do que foi contratado."
                />
              </Field>

              <Field>
                <Label htmlFor="entry_percentage" required>
                  Percentual de entrada
                </Label>
                <Input
                  id="entry_percentage"
                  name="entry_percentage"
                  value={form.entry_percentage}
                  onChange={(event) => {
                    const nextEntry = sanitizePercentageValue(event.target.value);
                    const numericEntry = nextEntry ? Number(nextEntry) : 0;
                    setForm((current) => ({
                      ...current,
                      entry_percentage: nextEntry,
                      delivery_percentage: String(Math.max(0, 100 - numericEntry)),
                    }));
                    setFormError(null);
                  }}
                  placeholder="50"
                  inputMode="numeric"
                />
              </Field>

              <Field>
                <Label htmlFor="delivery_percentage" required>
                  Percentual de entrega
                </Label>
                <Input
                  id="delivery_percentage"
                  name="delivery_percentage"
                  value={form.delivery_percentage}
                  onChange={(event) => {
                    const nextDelivery = sanitizePercentageValue(event.target.value);
                    const numericDelivery = nextDelivery ? Number(nextDelivery) : 0;
                    setForm((current) => ({
                      ...current,
                      delivery_percentage: nextDelivery,
                      entry_percentage: String(Math.max(0, 100 - numericDelivery)),
                    }));
                    setFormError(null);
                  }}
                  placeholder="50"
                  inputMode="numeric"
                />
              </Field>

              <Field>
                <Label htmlFor="entry_due_date" required>
                  Vencimento da entrada
                </Label>
                <Input
                  id="entry_due_date"
                  name="entry_due_date"
                  value={form.entry_due_date}
                  onChange={(event) => setField("entry_due_date", maskDate(event.target.value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              <Field>
                <Label htmlFor="delivery_due_date" required>
                  Vencimento da entrega
                </Label>
                <Input
                  id="delivery_due_date"
                  name="delivery_due_date"
                  value={form.delivery_due_date}
                  onChange={(event) => setField("delivery_due_date", maskDate(event.target.value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              <div className="md:col-span-2 grid gap-4 rounded-xl border border-border/70 bg-background/60 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Entrada {form.entry_percentage || "0"}%
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatBRL(installmentPreview.entry)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Entrega {form.delivery_percentage || "0"}%
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatBRL(installmentPreview.delivery)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 rounded-xl border border-border/70 bg-background/60 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.has_subscription}
                    onChange={(event) => setField("has_subscription", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Este projeto possui manutenção/hospedagem recorrente
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Se marcado, o sistema tenta criar assinatura mensal e a primeira cobrança
                      recorrente.
                    </p>
                  </div>
                </label>
              </div>

              {form.has_subscription ? (
                <>
                  <Field>
                    <Label htmlFor="subscription_label" required>
                      Nome da assinatura
                    </Label>
                    <Input
                      id="subscription_label"
                      name="subscription_label"
                      value={form.subscription_label}
                      onChange={(event) => setField("subscription_label", event.target.value)}
                    />
                  </Field>

                  <Field>
                    <Label htmlFor="subscription_amount" required>
                      Valor mensal
                    </Label>
                    <Input
                      id="subscription_amount"
                      name="subscription_amount"
                      value={form.subscription_amount}
                      onChange={(event) =>
                        setField("subscription_amount", maskCurrency(event.target.value))
                      }
                      placeholder="R$ 0,00"
                      inputMode="numeric"
                    />
                  </Field>

                  <Field>
                    <Label htmlFor="subscription_due_day" required>
                      Dia de vencimento
                    </Label>
                    <Input
                      id="subscription_due_day"
                      name="subscription_due_day"
                      type="number"
                      min={1}
                      max={31}
                      value={form.subscription_due_day}
                      onChange={(event) => setField("subscription_due_day", event.target.value)}
                    />
                  </Field>

                  <Field>
                    <Label htmlFor="subscription_starts_on">Inicio da assinatura</Label>
                    <Input
                      id="subscription_starts_on"
                      name="subscription_starts_on"
                      value={form.subscription_starts_on}
                      onChange={(event) =>
                        setField("subscription_starts_on", maskDate(event.target.value))
                      }
                      placeholder="DD/MM/AAAA"
                      inputMode="numeric"
                    />
                  </Field>
                </>
              ) : null}

              <Field className="md:col-span-2">
                <Label htmlFor="client_visible_summary">Resumo visivel para o cliente</Label>
                <Textarea
                  id="client_visible_summary"
                  name="client_visible_summary"
                  value={form.client_visible_summary}
                  onChange={(event) => setField("client_visible_summary", event.target.value)}
                  rows={4}
                  placeholder="Texto resumido, claro e util que pode aparecer no portal do cliente."
                />
              </Field>

              <Field>
                <Label htmlFor="next_step_title">Próximo passo inicial</Label>
                <Input
                  id="next_step_title"
                  name="next_step_title"
                  value={form.next_step_title}
                  onChange={(event) => setField("next_step_title", event.target.value)}
                  placeholder="Ex: Aguardar briefing final do cliente"
                />
              </Field>

              <Field>
                <Label htmlFor="next_step_owner">Responsavel pelo passo</Label>
                <select
                  id="next_step_owner"
                  name="next_step_owner"
                  value={form.next_step_owner}
                  onChange={(event) =>
                    setField("next_step_owner", event.target.value as NextStepOwner)
                  }
                  className={selectClass}
                >
                  <option value="elkys">Elkys</option>
                  <option value="cliente">Cliente</option>
                  <option value="compartilhado">Compartilhado</option>
                </select>
              </Field>

              <Field className="md:col-span-2">
                <Label htmlFor="next_step_description">Descrição do próximo passo</Label>
                <Textarea
                  id="next_step_description"
                  name="next_step_description"
                  value={form.next_step_description}
                  onChange={(event) => setField("next_step_description", event.target.value)}
                  rows={3}
                />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Projeto
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ReviewRow
                    label="Cliente"
                    value={selectedClient ? getClientDisplayName(selectedClient) : null}
                  />
                  <ReviewRow label="Projeto" value={form.name} />
                  <ReviewRow label="Solucao" value={form.solution_type} />
                  <ReviewRow label="Status" value={derivedStatusMeta.label} />
                  <ReviewRow label="Etapa" value={form.current_stage} />
                  <ReviewRow label="Entrega prevista" value={form.expected_delivery_date} />
                  {form.is_retroactive ? (
                    <ReviewRow label="Entrega real" value={form.delivered_at} />
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contrato e cobrança
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ReviewRow
                    label="Valor total"
                    value={formatBRL(unmaskCurrency(form.total_amount))}
                  />
                  <ReviewRow
                    label={`Entrada ${form.entry_percentage || "0"}%`}
                    value={formatBRL(installmentPreview.entry)}
                  />
                  <ReviewRow
                    label={`Entrega ${form.delivery_percentage || "0"}%`}
                    value={formatBRL(installmentPreview.delivery)}
                  />
                  <ReviewRow label="Fim contratual" value={form.contract_ends_at || "Renovavel"} />
                  <ReviewRow label="Vencimento entrada" value={form.entry_due_date} />
                  <ReviewRow label="Vencimento entrega" value={form.delivery_due_date} />
                  <ReviewRow label="Assinatura" value={form.has_subscription ? "Sim" : "Não"} />
                  {form.contract_already_paid ? (
                    <ReviewRow label="Cobranças" value="Histórico (já quitado)" />
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente e próximos passos
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ReviewRow label="Resumo cliente" value={form.client_visible_summary} />
                  <ReviewRow label="Próximo passo" value={form.next_step_title} />
                  <ReviewRow label="Responsavel" value={form.next_step_owner} />
                  {form.has_subscription ? (
                    <>
                      <ReviewRow
                        label="Mensalidade"
                        value={formatBRL(unmaskCurrency(form.subscription_amount))}
                      />
                      <ReviewRow
                        label="Vencimento mensal"
                        value={`Dia ${form.subscription_due_day}`}
                      />
                      <ReviewRow label="Inicio assinatura" value={form.subscription_starts_on} />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => current - 1)}
              >
                Voltar
              </Button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Proximo
              </Button>
            ) : (
              <Button
                type="button"
                loading={submitting}
                loadingText="Criando..."
                onClick={() => void handleSubmit()}
              >
                Criar projeto
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
