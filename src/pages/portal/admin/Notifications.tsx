import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Bell, CheckCircle, Mail, Search, Send, Wrench, X } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/admin/AdminEmptyState";
import MetricTile from "@/components/portal/shared/MetricTile";
import RelativeDate from "@/components/portal/shared/RelativeDate";
import { useFormDraftAutoSave } from "@/hooks/useFormDraftAutoSave";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorText,
  Field,
  Input,
  Label,
  cn,
} from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";
import type { Database } from "@/integrations/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

/* ── Constants ────────────────────────────────────────────────────── */

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "manutenção", label: "Manutenção programada" },
  { value: "atualizacao", label: "Atualização / Novidade" },
  { value: "otimizacao", label: "Otimização em andamento" },
  { value: "alerta", label: "Alerta importante" },
  { value: "personalizado", label: "Mensagem livre" },
] as const;

const TYPE_TEMPLATES: Record<string, { title: string; body: string }> = {
  manutenção: {
    title: "Manutenção programada — Seu site ficará temporariamente indisponível",
    body: `Gostaríamos de informar que realizaremos uma **manutenção programada** no seu site para garantir a estabilidade, segurança e desempenho da plataforma.

Durante o período de manutenção, o site poderá apresentar instabilidade ou ficar temporariamente fora do ar. O procedimento está previsto para durar aproximadamente **[DURAÇÃO]** e será realizado em **[DATA/HORÁRIO]**.

Essa ação faz parte do nosso compromisso com a qualidade do serviço. Nenhuma ação é necessária da sua parte.

Se tiver dúvidas, nossa equipe está disponível pelo {Suporte}.`,
  },
  atualizacao: {
    title: "Novidades no seu projeto — Confira as últimas atualizações",
    body: `Temos novidades para compartilhar com você.

Realizamos melhorias e atualizações que impactam diretamente a experiência, performance e funcionalidades da sua plataforma:

• [Descreva a atualização 1]
• [Descreva a atualização 2]
• [Descreva a atualização 3]

Todas as alterações já estão em produção e funcionando normalmente. Você pode acompanhar os detalhes pelo {Projetos}.

Seguimos trabalhando para entregar o melhor resultado possível.`,
  },
  otimizacao: {
    title: "Otimização em andamento — Melhorias de performance no seu site",
    body: `Gostaríamos de informar que estamos realizando um processo de **otimização no seu site** com foco em performance, velocidade de carregamento e experiência do usuário.

As melhorias incluem:

• Otimização de imagens e recursos estáticos
• Ajustes em tempo de resposta do servidor
• Melhoria de métricas Core Web Vitals (LCP, CLS, FID)
• Revisão de cache e compressão de arquivos

Durante esse processo, o site permanece normalmente acessível. Você poderá notar melhorias graduais nos próximos dias.

Nenhuma ação é necessária da sua parte. Acompanhe pelo {Portal}.`,
  },
  alerta: {
    title: "Alerta importante — Ação necessária",
    body: `Identificamos uma situação que requer a sua atenção em relação ao seu projeto.

**[Descreva o alerta e a situação identificada]**

Recomendamos que você **[ação recomendada]** o mais breve possível para evitar impactos no funcionamento do seu serviço.

Nossa equipe está disponível pelo {Suporte} para ajudar no que for necessário.

Estamos acompanhando a situação e manteremos você informado sobre qualquer evolução.`,
  },
  personalizado: {
    title: "",
    body: "",
  },
};

const FILTER_MODE_OPTIONS = [
  { value: "all", label: "Todos os clientes ativos" },
  { value: "contract_status", label: "Por status do contrato" },
  { value: "tags", label: "Por tags" },
  { value: "individual", label: "Selecionar clientes" },
] as const;

const CONTRACT_STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inadimplente", label: "Inadimplente" },
  { value: "cancelado", label: "Cancelado" },
] as const;

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  agendada: { label: "Agendada", className: "bg-warning/15 text-warning" },
  enviando: { label: "Enviando...", className: "bg-accent/15 text-accent" },
  enviada: { label: "Enviada", className: "bg-success/15 text-success" },
  falha: { label: "Falha", className: "bg-destructive/15 text-destructive" },
};

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  manutenção: { label: "Manutenção", className: "bg-warning/15 text-warning" },
  atualizacao: { label: "Atualização", className: "bg-accent/15 text-accent" },
  otimizacao: { label: "Otimização", className: "bg-primary-soft text-primary" },
  alerta: { label: "Alerta", className: "bg-destructive/15 text-destructive" },
  personalizado: { label: "Comunicado", className: "bg-secondary/15 text-secondary" },
};

const selectClass =
  "flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/* ── Schema ──────────────────────────────────────────────────────── */

const notificationSchema = z
  .object({
    title: z.string().min(3, "Título obrigatório (mín. 3 caracteres)"),
    body: z.string().min(10, "Mensagem obrigatória (mín. 10 caracteres)"),
    type: z.enum(["manutenção", "atualizacao", "otimizacao", "alerta", "personalizado"]),
    filter_mode: z.enum(["all", "tags", "contract_status", "individual"]),
    filter_contract_status: z.string().optional(),
    filter_tags_input: z.string().optional(),
    filter_client_ids: z.array(z.string()).optional(),
    schedule: z.enum(["now", "later"]),
    send_at: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.filter_mode === "contract_status" && !data.filter_contract_status) return false;
      return true;
    },
    { message: "Selecione o status do contrato", path: ["filter_contract_status"] }
  )
  .refine(
    (data) => {
      if (data.schedule === "later" && !data.send_at) return false;
      return true;
    },
    { message: "Defina a data e hora de envio", path: ["send_at"] }
  );

type NotificationForm = z.infer<typeof notificationSchema>;

/* ── Client picker (simple multi-select) ─────────────────────── */

interface SimpleClient {
  id: string;
  full_name: string;
  email: string;
}

function ClientPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, full_name, email")
        .eq("is_active", true)
        .order("full_name");
      if (data) setClients(data);
      setLoaded(true);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  if (!loaded) return <p className="text-sm text-muted-foreground">Carregando clientes...</p>;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente"
          className="pl-8 text-sm"
        />
      </div>
      <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border/60 bg-background">
        {filtered.length === 0 ? (
          <p className="p-3 text-center text-xs text-muted-foreground">Nenhum cliente encontrado</p>
        ) : (
          filtered.map((client) => (
            <label
              key={client.id}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selected.includes(client.id)}
                onChange={() => toggle(client.id)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="truncate font-medium">{client.full_name}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">{client.email}</span>
            </label>
          ))
        )}
      </div>
      {selected.length > 0 ? (
        <p className="text-xs text-muted-foreground">{selected.length} cliente(s) selecionado(s)</p>
      ) : null}
    </div>
  );
}

/* ── Auto-resize textarea ────────────────────────────────────────── */

import { forwardRef } from "react";

const AutoResizeTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function AutoResizeTextarea(props, ref) {
  return (
    <textarea
      {...props}
      ref={ref}
      rows={12}
      className="flex w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    />
  );
});

/* ── Page ────────────────────────────────────────────────────────── */

export default function AdminNotifications() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"compose" | "history">("compose");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // History state
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);
  const [page, setPage] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: "personalizado",
      filter_mode: "all",
      schedule: "now",
      filter_client_ids: [],
    },
  });

  const notificationType = watch("type");
  const filterMode = watch("filter_mode");
  const schedule = watch("schedule");
  const selectedClientIds = watch("filter_client_ids") ?? [];
  const watchedForm = watch();

  // Auto-save do rascunho em localStorage com debounce
  const {
    savedAt: draftSavedAt,
    clearDraft,
    isPending: draftPending,
  } = useFormDraftAutoSave<NotificationForm>({
    storageKey: "elkys:admin:notifications:composer-draft",
    values: watchedForm,
    onRestore: (restored) => reset(restored),
  });

  // Auto-fill title and body when type changes
  useEffect(() => {
    const template = TYPE_TEMPLATES[notificationType];
    if (!template) return;
    setValue("title", template.title, { shouldValidate: false });
    setValue("body", template.body, { shouldValidate: false });
  }, [notificationType, setValue]);

  /* ── History loader ──────────────────────────────────────────── */

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setHistoryLoaded(true);
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "history") {
      void loadHistory();
    }
  }, [tab, historyTick, loadHistory]);

  /* ── Available tags ──────────────────────────────────────────── */

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (filterMode !== "tags") return;
    void (async () => {
      const { data } = await supabase.from("clients").select("tags").eq("is_active", true);
      if (data) {
        const tagSet = new Set<string>();
        data.forEach((c) => c.tags?.forEach((t: string) => tagSet.add(t)));
        setAvailableTags(Array.from(tagSet).sort());
      }
    })();
  }, [filterMode]);

  /* ── Submit ──────────────────────────────────────────────────── */

  const onSubmit = async (data: NotificationForm) => {
    setSubmitting(true);
    setFormError(null);

    try {
      // Parse tags from comma-separated input
      const filterTags =
        data.filter_mode === "tags" && data.filter_tags_input
          ? data.filter_tags_input
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

      const isScheduled = data.schedule === "later" && data.send_at;

      // 1. Insert notification record
      const { data: notifData, error: notifError } = await supabase
        .from("notifications")
        .insert({
          title: data.title,
          body: data.body,
          type: data.type,
          status: isScheduled ? "agendada" : "enviando",
          send_at: isScheduled ? new Date(data.send_at!).toISOString() : null,
          filter_mode: data.filter_mode,
          filter_tags: filterTags,
          filter_contract_status:
            data.filter_mode === "contract_status" ? (data.filter_contract_status ?? null) : null,
          filter_client_ids:
            data.filter_mode === "individual" ? (data.filter_client_ids ?? []) : [],
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();

      if (notifError || !notifData) throw notifError ?? new Error("Falha ao criar notificação.");

      // 2. If immediate, trigger the edge function
      if (!isScheduled) {
        let sendOk = false;
        try {
          const authHeaders = await getSupabaseFunctionAuthHeaders();
          const { data: sendResult, error: sendError } = await supabase.functions.invoke(
            "send-notification",
            {
              body: { notification_id: notifData.id },
              headers: authHeaders,
            }
          );

          if (sendError) throw new Error(`Envio falhou: ${sendError.message}`);
          if (sendResult?.ok === false) throw new Error(sendResult.error ?? "Falha no envio.");

          sendOk = true;
          const sentCount = sendResult?.sent_count ?? 0;
          const errorCount = sendResult?.error_count ?? 0;

          toast.success(`Notificação enviada para ${sentCount} cliente(s).`, {
            description: errorCount > 0 ? `${errorCount} falha(s) no envio de e-mail.` : undefined,
          });
        } finally {
          // Cleanup: if the send failed, remove the notification and its recipients
          if (!sendOk) {
            await supabase
              .from("notification_recipients")
              .delete()
              .eq("notification_id", notifData.id);
            await supabase.from("notifications").delete().eq("id", notifData.id);
          }
        }
      } else {
        toast.success("Notificação agendada com sucesso.", {
          description: `Será enviada em ${new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(data.send_at!))}`,
        });
      }

      reset();
      clearDraft();
      setHistoryTick((t) => t + 1);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível enviar a notificação.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Metrics ─────────────────────────────────────────────────── */

  const metrics = useMemo(() => {
    const total = notifications.length;
    const sent = notifications.filter((n) => n.status === "enviada").length;
    const scheduled = notifications.filter((n) => n.status === "agendada").length;
    const failed = notifications.filter((n) => n.status === "falha").length;
    return { total, sent, scheduled, failed };
  }, [notifications]);

  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE));
  const visibleNotifications = notifications.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Notificações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie comunicados, alertas e atualizações para os clientes do portal.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setTab("compose")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "compose"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Nova notificação
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "history"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Histórico
        </button>
      </div>

      {/* ── Compose tab ──────────────────────────────────────────── */}
      {tab === "compose" ? (
        <Card className="border-border/70 bg-card/92">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-lg">Compor notificação</CardTitle>
            <CardDescription>
              A mensagem será enviada por e-mail e ficará disponível no portal do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {formError ? (
              <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <Label required>Título</Label>
                  <Input {...register("title")} placeholder="Ex: Manutenção programada dia 10/04" />
                  <ErrorText className={errors.title ? "" : "invisible"}>
                    {errors.title?.message || "\u00A0"}
                  </ErrorText>
                </Field>

                <Field>
                  <Label required>Tipo</Label>
                  <select {...register("type")} className={selectClass}>
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field>
                <Label required>Mensagem</Label>
                <AutoResizeTextarea
                  {...register("body")}
                  placeholder="Escreva o conteúdo da notificação..."
                  value={watch("body") ?? ""}
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground/70">Formatação:</span>{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">**texto**</code> para{" "}
                  <strong>negrito</strong>
                  {" · Variáveis: "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                    {"{Portal}"}
                  </code>{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{"{Financeiro}"}</code>{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{"{Projetos}"}</code>{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{"{Suporte}"}</code>{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{"{Documentos}"}</code>
                  {" viram links clicáveis no e-mail."}
                </p>
                <ErrorText className={errors.body ? "" : "invisible"}>
                  {errors.body?.message || "\u00A0"}
                </ErrorText>
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <Label required>Destinatários</Label>
                  <select {...register("filter_mode")} className={selectClass}>
                    {FILTER_MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {filterMode === "contract_status" ? (
                  <Field>
                    <Label required>Status do contrato</Label>
                    <select {...register("filter_contract_status")} className={selectClass}>
                      <option value="">Selecione...</option>
                      {CONTRACT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ErrorText className={errors.filter_contract_status ? "" : "invisible"}>
                      {errors.filter_contract_status?.message || "\u00A0"}
                    </ErrorText>
                  </Field>
                ) : null}

                {filterMode === "tags" ? (
                  <Field>
                    <Label>Tags (separadas por vírgula)</Label>
                    <Input
                      {...register("filter_tags_input")}
                      placeholder="site, loja-virtual, branding"
                    />
                    {availableTags.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Disponíveis: {availableTags.join(", ")}
                      </p>
                    ) : null}
                  </Field>
                ) : null}
              </div>

              {filterMode === "individual" ? (
                <Controller
                  name="filter_client_ids"
                  control={control}
                  render={({ field }) => (
                    <ClientPicker
                      selected={field.value ?? []}
                      onChange={(ids) => field.onChange(ids)}
                    />
                  )}
                />
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <Label required>Quando enviar</Label>
                  <select {...register("schedule")} className={selectClass}>
                    <option value="now">Enviar agora</option>
                    <option value="later">Agendar envio</option>
                  </select>
                </Field>

                {schedule === "later" ? (
                  <Field>
                    <Label required>Data e hora</Label>
                    <Input {...register("send_at")} type="datetime-local" />
                    <ErrorText className={errors.send_at ? "" : "invisible"}>
                      {errors.send_at?.message || "\u00A0"}
                    </ErrorText>
                  </Field>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
                  {draftPending ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
                      Salvando rascunho...
                    </span>
                  ) : draftSavedAt ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                      Rascunho salvo automaticamente
                    </span>
                  ) : (
                    <span className="invisible">rascunho</span>
                  )}
                </p>
                <Button
                  type="submit"
                  loading={submitting}
                  loadingText={schedule === "later" ? "Agendando..." : "Enviando..."}
                >
                  <span className="flex items-center gap-2">
                    <Send size={16} />
                    {schedule === "later" ? "Agendar notificação" : "Enviar notificação"}
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* ── History tab ──────────────────────────────────────────── */}
      {tab === "history" ? (
        <>
          {/* Metrics */}
          {historyLoaded ? (
            <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              <MetricTile
                label="Total de envios"
                value={metrics.total.toString()}
                icon={Bell}
                tone="primary"
              />
              <MetricTile
                label="Enviadas"
                value={metrics.sent.toString()}
                icon={CheckCircle}
                tone="success"
              />
              <MetricTile
                label="Agendadas"
                value={metrics.scheduled.toString()}
                icon={Mail}
                tone="accent"
              />
              <MetricTile
                label="Com falha"
                value={metrics.failed.toString()}
                icon={X}
                tone="destructive"
              />
            </div>
          ) : null}

          {historyLoading && !historyLoaded ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[72px] animate-pulse rounded-xl border border-border/50 bg-card/60"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <AdminEmptyState
              icon={Bell}
              title="Nenhuma notificação enviada"
              description="Quando você enviar a primeira notificação, ela aparecerá aqui."
            />
          ) : (
            <>
              {/* Column headers */}
              <div className="hidden xl:grid xl:grid-cols-[minmax(0,1.6fr)_150px_130px_100px_100px] xl:items-center xl:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Notificação
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Tipo
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Status
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Enviados
                </p>
                <p className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Data
                </p>
              </div>

              <div className="space-y-2">
                {visibleNotifications.map((notif) => {
                  const typeBadge = TYPE_BADGES[notif.type] ?? TYPE_BADGES.personalizado;
                  const statusBadge = STATUS_BADGES[notif.status] ?? STATUS_BADGES.enviando;
                  const dateStr = notif.sent_at ?? notif.send_at ?? notif.created_at;

                  return (
                    <article
                      key={notif.id}
                      className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-all hover:border-primary/25 hover:bg-card sm:px-5 sm:py-4"
                    >
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_150px_130px_100px_100px] xl:items-center">
                        {/* Title + body preview */}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {notif.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {notif.body}
                          </p>
                        </div>

                        {/* Type */}
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground xl:hidden">
                            Tipo
                          </p>
                          <span
                            className={cn(
                              "mt-1 inline-flex min-h-[24px] items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-wide xl:mt-0",
                              typeBadge.className
                            )}
                          >
                            {typeBadge.label}
                          </span>
                        </div>

                        {/* Status */}
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground xl:hidden">
                            Status
                          </p>
                          <span
                            className={cn(
                              "mt-1 inline-flex min-h-[24px] items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-wide xl:mt-0",
                              statusBadge.className
                            )}
                          >
                            {statusBadge.label}
                          </span>
                        </div>

                        {/* Recipient count */}
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground xl:hidden">
                            Enviados
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground xl:mt-0">
                            {notif.recipient_count}
                            {notif.error_count > 0 ? (
                              <span className="ml-1 text-xs text-destructive">
                                ({notif.error_count} falha{notif.error_count > 1 ? "s" : ""})
                              </span>
                            ) : null}
                          </p>
                        </div>

                        {/* Date */}
                        <div className="xl:text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground xl:hidden">
                            Data
                          </p>
                          <RelativeDate
                            date={dateStr}
                            className="mt-1 block text-sm text-muted-foreground xl:mt-0"
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 ? (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages} · {notifications.length} resultado(s)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((c) => c - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((c) => c + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
