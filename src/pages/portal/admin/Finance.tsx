import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAdminCharges } from "@/hooks/useAdminCharges";
import { useAdminClients } from "@/hooks/useAdminClients";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ComponentType } from "react";
import { Clock, FileText, Receipt, Search } from "@/assets/icons";
import type { IconProps } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import PortalLoading from "@/components/portal/PortalLoading";
import RowActionMenu from "@/components/portal/RowActionMenu";
import SurfaceStat from "@/components/portal/SurfaceStat";

// Lazy-load sub-tabs: only the active tab downloads its code
const AdminExpenses = lazy(() => import("@/pages/portal/admin/Expenses"));
const Delinquency = lazy(() => import("@/pages/portal/admin/Delinquency"));
const RevenueByClient = lazy(() => import("@/pages/portal/admin/RevenueByClient"));
const FinanceGoals = lazy(() => import("@/pages/portal/admin/FinanceGoals"));
import StatusBadge from "@/components/portal/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Label,
  buttonVariants,
  cn,
} from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";
import type { Database } from "@/integrations/supabase/types";
import {
  CHARGE_STATUS_META,
  formatPortalDate,
  getClientDisplayName,
  isProjectOperationallyOpen,
  getProjectEffectiveBucket,
  isTicketOpen,
} from "@/lib/portal";
import { getSubscriptionCoverageEnd, listSubscriptionDueDates } from "@/lib/subscription-charges";
import {
  formatBRL,
  formatDateInput,
  maskCurrency,
  maskDate,
  parseFormDate,
  toCents,
  unmaskCurrency,
} from "@/lib/masks";

type PortalClient = Database["public"]["Tables"]["clients"]["Row"];
type PortalCharge = Database["public"]["Tables"]["charges"]["Row"];
type FinanceTab =
  | "receitas"
  | "despesas"
  | "analise"
  | "inadimplencia"
  | "receita-clientes"
  | "metas";

const REVENUE_PAGE_SIZE = 10;

const CHARGE_STATUSES = ["pendente", "pago", "atrasado", "agendada", "cancelado"] as const;

type ChargeEditor = {
  description: string;
  amount: string;
  due_date: string;
  status: string;
};

function getChargeEditorFromCharge(charge: PortalCharge): ChargeEditor {
  return {
    description: charge.description,
    amount: formatBRL(Number(charge.amount)),
    due_date: formatDateInput(charge.due_date),
    status: charge.status,
  };
}

function getRevenueMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function getCurrentRevenueMonthKey() {
  const now = new Date();
  return getRevenueMonthKey(now.getFullYear(), now.getMonth());
}

function formatRevenueMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Metric tile                                                       */
/* ------------------------------------------------------------------ */

type MetricTone = "accent" | "warning" | "primary" | "secondary" | "success" | "destructive";

const METRIC_TONE: Record<MetricTone, { text: string; icon: string }> = {
  accent: { text: "text-accent", icon: "bg-accent/10 text-accent" },
  warning: { text: "text-warning", icon: "bg-warning/10 text-warning" },
  primary: { text: "text-primary", icon: "bg-primary-soft text-primary dark:bg-primary/15" },
  secondary: { text: "text-secondary", icon: "bg-secondary/15 text-secondary" },
  success: { text: "text-success", icon: "bg-success/15 text-success" },
  destructive: { text: "text-destructive", icon: "bg-destructive/15 text-destructive" },
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
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-3 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10",
            t.icon
          )}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[11px]">
            {label}
          </p>
          <p
            className={cn(
              "mt-0.5 whitespace-nowrap text-xl font-semibold tabular-nums tracking-tight sm:text-2xl",
              t.text
            )}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Row action menu                                                    */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Receitas tab                                                      */
/* ------------------------------------------------------------------ */

function FinanceRevenueTab({
  charges,
  clientsMap,
  loading,
  pageError,
  onReload,
}: {
  charges: PortalCharge[];
  clientsMap: Record<string, PortalClient>;
  loading: boolean;
  pageError: string | null;
  onReload: () => Promise<void>;
}) {
  const { isSuperAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(getCurrentRevenueMonthKey());
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
  const [editor, setEditor] = useState<ChargeEditor | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [savingChargeId, setSavingChargeId] = useState<string | null>(null);
  const [deleteChargeId, setDeleteChargeId] = useState<string | null>(null);
  const [removingChargeId, setRemovingChargeId] = useState<string | null>(null);

  const deferredSearch = search.trim().toLowerCase();

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, statusFilter, monthFilter]);

  const monthOptions = useMemo(() => {
    const allMonths = new Set([
      getCurrentRevenueMonthKey(),
      ...charges.map((c) => c.due_date.slice(0, 7)),
    ]);
    return Array.from(allMonths).sort((left, right) => right.localeCompare(left));
  }, [charges]);

  const filteredCharges = useMemo(
    () =>
      charges.filter((charge) => {
        const client = clientsMap[charge.client_id];
        const clientName = client ? getClientDisplayName(client).toLowerCase() : "";
        const matchesSearch =
          deferredSearch.length === 0 ||
          charge.description.toLowerCase().includes(deferredSearch) ||
          clientName.includes(deferredSearch);

        const matchesStatus = statusFilter === "all" || charge.status === statusFilter;
        const matchesMonth = monthFilter === "all" || charge.due_date.startsWith(monthFilter);

        return matchesSearch && matchesStatus && matchesMonth;
      }),
    [charges, clientsMap, deferredSearch, statusFilter, monthFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCharges.length / REVENUE_PAGE_SIZE));
  const visibleCharges = filteredCharges.slice(
    page * REVENUE_PAGE_SIZE,
    (page + 1) * REVENUE_PAGE_SIZE
  );

  const filteredTotal = filteredCharges.reduce((sum, c) => sum + toCents(c.amount), 0) / 100;
  const filteredPaid =
    filteredCharges
      .filter((c) => c.status === "pago")
      .reduce((sum, c) => sum + toCents(c.amount), 0) / 100;
  const startEditing = (charge: PortalCharge) => {
    setEditingChargeId(charge.id);
    setEditor(getChargeEditorFromCharge(charge));
    setEditorError(null);
  };

  const stopEditing = () => {
    setEditingChargeId(null);
    setEditor(null);
    setEditorError(null);
  };

  const handleSaveCharge = async (chargeId: string) => {
    if (!editor || savingChargeId) return;

    const parsedDate = parseFormDate(editor.due_date);
    if (!parsedDate) {
      setEditorError("Informe uma data valida.");
      return;
    }

    if (editor.description.trim().length < 3) {
      setEditorError("A descricao precisa ter ao menos 3 caracteres.");
      return;
    }

    if (!editor.amount.trim() || unmaskCurrency(editor.amount) <= 0) {
      setEditorError("Informe um valor maior que zero.");
      return;
    }

    setSavingChargeId(chargeId);
    setEditorError(null);

    const isPaidNow = editor.status === "pago";
    const { error } = await supabase
      .from("charges")
      .update({
        description: editor.description.trim(),
        amount: unmaskCurrency(editor.amount),
        due_date: parsedDate,
        status: editor.status as PortalCharge["status"],
        ...(isPaidNow ? { paid_at: new Date().toISOString().slice(0, 10) } : {}),
      })
      .eq("id", chargeId);

    if (error) {
      setEditorError(error.message);
      setSavingChargeId(null);
      return;
    }

    const originalCharge = charges.find((c) => c.id === chargeId);
    const sideEffectWarnings: string[] = [];

    // Notify client when charge becomes overdue
    if (editor.status === "atrasado" && originalCharge && originalCharge.status !== "atrasado") {
      try {
        const { error: overdueError } = await supabase.functions.invoke("send-charge-overdue", {
          body: {
            client_id: originalCharge.client_id,
            charge_description: editor.description.trim(),
            charge_amount: unmaskCurrency(editor.amount),
            due_date: parsedDate,
          },
        });
        if (overdueError) sideEffectWarnings.push("Notificacao de atraso nao enviada.");
      } catch {
        sideEffectWarnings.push("Notificacao de atraso nao enviada.");
      }
    }

    // Timeline event + payment confirmation when charge is marked as paid
    if (isPaidNow && originalCharge && originalCharge.status !== "pago") {
      try {
        const { error: timelineError } = await supabase.from("timeline_events").insert({
          client_id: originalCharge.client_id,
          project_id: originalCharge.project_id ?? null,
          event_type: "pagamento_recebido",
          title: "Pagamento recebido",
          summary: `Cobranca "${editor.description.trim()}" marcada como paga.`,
          visibility: "ambos",
          source_table: "charges",
          source_id: chargeId,
        });
        if (timelineError) sideEffectWarnings.push("Evento de timeline nao registrado.");
      } catch {
        sideEffectWarnings.push("Evento de timeline nao registrado.");
      }

      try {
        const headers = await getSupabaseFunctionAuthHeaders();
        const { error: billingError } = await supabase.functions.invoke("process-billing-rules", {
          body: {
            triggered_by: "manual",
            single_charge_id: chargeId,
            force_template_type: "agradecimento",
          },
          headers,
        });
        if (billingError)
          sideEffectWarnings.push("Confirmacao de pagamento nao enviada ao cliente.");
      } catch {
        sideEffectWarnings.push("Confirmacao de pagamento nao enviada ao cliente.");
      }
    }

    if (sideEffectWarnings.length > 0) {
      toast.warning("Cobranca atualizada com pendencias.", {
        description: sideEffectWarnings.join(" "),
        duration: 8000,
      });
    } else {
      toast.success("Cobranca atualizada.");
    }
    await onReload();
    stopEditing();
    setSavingChargeId(null);
  };

  const handleRemoveCharge = async () => {
    if (!deleteChargeId || removingChargeId) return;
    if (!isSuperAdmin) {
      toast.error("Somente o super admin pode remover cobrancas.");
      setDeleteChargeId(null);
      return;
    }

    setRemovingChargeId(deleteChargeId);

    const { error } = await supabase.from("charges").delete().eq("id", deleteChargeId);

    if (error) {
      toast.error("Nao foi possivel remover a cobranca.", {
        description: error.message,
      });
      setRemovingChargeId(null);
      return;
    }

    toast.success("Cobranca removida.");
    setDeleteChargeId(null);
    setRemovingChargeId(null);
    await onReload();
  };

  if (loading) return <PortalLoading />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Receitas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {monthFilter === "all" ? "Todos os meses" : formatRevenueMonthLabel(monthFilter)}
          </p>
        </div>
        <Link to="/portal/admin/projetos" className={buttonVariants({ variant: "outline" })}>
          Ver projetos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-3">
        <MetricTile
          label="Total da competencia"
          value={formatBRL(filteredTotal)}
          icon={Clock}
          tone="warning"
        />
        <MetricTile
          label="Lancamentos"
          value={filteredCharges.length.toString()}
          icon={FileText}
          tone="accent"
        />
        <MetricTile
          label="Recebido"
          value={formatBRL(filteredPaid)}
          icon={Receipt}
          tone="success"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="revenue_search"
            name="revenue_search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cobranca ou cliente..."
            className="pl-9"
            aria-label="Buscar cobranca ou cliente"
          />
        </div>
        <select
          id="month_filter"
          name="month_filter"
          value={monthFilter}
          onChange={(event) => setMonthFilter(event.target.value)}
          className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-48"
          aria-label="Filtrar por mes"
        >
          <option value="all">Todos os meses</option>
          {monthOptions.map((monthKey) => (
            <option key={monthKey} value={monthKey}>
              {formatRevenueMonthLabel(monthKey)}
            </option>
          ))}
        </select>
        <select
          id="status_filter"
          name="status_filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-48"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          {CHARGE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CHARGE_STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>

      {pageError ? (
        <AdminEmptyState
          icon={Clock}
          title="Nao foi possivel carregar as cobrancas"
          description={`${pageError} Atualize a pagina ou tente novamente em instantes.`}
          action={
            <Button type="button" onClick={() => void onReload()}>
              Tentar novamente
            </Button>
          }
        />
      ) : filteredCharges.length === 0 ? (
        <AdminEmptyState
          icon={Clock}
          title="Nenhuma cobranca encontrada"
          description="Ajuste os filtros ou registre uma nova cobranca para alimentar o controle financeiro."
        />
      ) : (
        <div className="space-y-4">
          {visibleCharges.map((charge) => {
            const isEditing = editingChargeId === charge.id && editor;
            const client = clientsMap[charge.client_id];
            const meta = CHARGE_STATUS_META[charge.status];

            return (
              <article
                key={charge.id}
                className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-all hover:border-primary/25 hover:bg-card sm:px-5 sm:py-4"
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field className="md:col-span-2">
                        <Label htmlFor="charge_description">Descricao</Label>
                        <Input
                          id="charge_description"
                          name="charge_description"
                          value={editor.description}
                          onChange={(event) =>
                            setEditor((current) =>
                              current ? { ...current, description: event.target.value } : current
                            )
                          }
                        />
                      </Field>

                      <Field>
                        <Label htmlFor="charge_due_date">Vencimento</Label>
                        <Input
                          id="charge_due_date"
                          name="charge_due_date"
                          value={editor.due_date}
                          onChange={(event) =>
                            setEditor((current) =>
                              current
                                ? { ...current, due_date: maskDate(event.target.value) }
                                : current
                            )
                          }
                          inputMode="numeric"
                          placeholder="DD/MM/AAAA"
                        />
                      </Field>

                      <Field>
                        <Label htmlFor="charge_amount">Valor</Label>
                        <Input
                          id="charge_amount"
                          name="charge_amount"
                          value={editor.amount}
                          onChange={(event) =>
                            setEditor((current) =>
                              current
                                ? { ...current, amount: maskCurrency(event.target.value) }
                                : current
                            )
                          }
                          placeholder="R$ 0,00"
                        />
                      </Field>

                      <Field>
                        <Label htmlFor="charge_status">Status</Label>
                        <select
                          id="charge_status"
                          name="charge_status"
                          value={editor.status}
                          onChange={(event) =>
                            setEditor((current) =>
                              current ? { ...current, status: event.target.value } : current
                            )
                          }
                          className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {CHARGE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {CHARGE_STATUS_META[status].label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    {editorError ? (
                      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                        {editorError}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="outline" onClick={stopEditing}>
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void handleSaveCharge(charge.id)}
                        disabled={savingChargeId === charge.id}
                      >
                        {savingChargeId === charge.id ? "Salvando..." : "Salvar alteracoes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.6fr)_160px_150px_150px_120px_auto] lg:items-center">
                    {/* Description + actions (mobile: same row) */}
                    <div className="flex items-start justify-between gap-2 lg:contents">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                          {charge.description}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                          {client ? getClientDisplayName(client) : "Cliente nao encontrado"}
                        </p>
                      </div>

                      {/* Mobile actions */}
                      <div className="shrink-0 lg:hidden">
                        <RowActionMenu
                          actions={[
                            { label: "Editar", onClick: () => startEditing(charge) },
                            ...(isSuperAdmin
                              ? [
                                  {
                                    label: "Remover",
                                    onClick: () => setDeleteChargeId(charge.id),
                                    destructive: true,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </div>

                    {/* Mobile: compact secondary info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 lg:hidden">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Venc.{" "}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {formatPortalDate(charge.due_date)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-success">
                        {formatBRL(Number(charge.amount))}
                      </span>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                      <span className="text-xs text-muted-foreground">
                        {charge.is_historical ? "Historico" : "Operacional"}
                      </span>
                    </div>

                    {/* Desktop columns */}
                    <div className="hidden lg:block">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Vencimento
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatPortalDate(charge.due_date)}
                      </p>
                    </div>

                    <div className="hidden lg:block">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Valor
                      </p>
                      <p className="mt-2 text-base font-semibold text-success">
                        {formatBRL(Number(charge.amount))}
                      </p>
                    </div>

                    <div className="hidden lg:block">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </p>
                      <div className="mt-2">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Tipo
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {charge.is_historical ? "Historico" : "Operacional"}
                      </p>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden lg:block">
                      <RowActionMenu
                        actions={[
                          { label: "Editar", onClick: () => startEditing(charge) },
                          ...(isSuperAdmin
                            ? [
                                {
                                  label: "Remover",
                                  onClick: () => setDeleteChargeId(charge.id),
                                  destructive: true,
                                },
                              ]
                            : []),
                        ]}
                      />
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Pagina {page + 1} de {totalPages} · {filteredCharges.length} resultado(s)
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

      <AlertDialog
        open={isSuperAdmin && Boolean(deleteChargeId)}
        title="Remover cobranca"
        description="Essa acao remove a cobranca selecionada. Voce podera cadastrar novamente depois, se precisar."
        confirmLabel="Remover cobranca"
        cancelLabel="Cancelar"
        destructive
        loading={Boolean(removingChargeId)}
        loadingLabel="Removendo..."
        onCancel={() => {
          if (removingChargeId) return;
          setDeleteChargeId(null);
        }}
        onConfirm={() => void handleRemoveCharge()}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Analise tab — detailed financial intelligence                     */
/* ------------------------------------------------------------------ */

type AnaliseClient = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "is_active" | "client_since"
>;
type AnaliseProject = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  | "id"
  | "client_id"
  | "status"
  | "started_at"
  | "delivered_at"
  | "expected_delivery_date"
  | "current_stage"
>;
type AnaliseCharge = Pick<
  Database["public"]["Tables"]["charges"]["Row"],
  | "id"
  | "client_id"
  | "amount"
  | "due_date"
  | "origin_type"
  | "paid_at"
  | "status"
  | "is_historical"
  | "subscription_id"
>;
type AnaliseSubscription = Pick<
  Database["public"]["Tables"]["project_subscriptions"]["Row"],
  | "id"
  | "client_id"
  | "project_id"
  | "amount"
  | "status"
  | "starts_on"
  | "due_day"
  | "ends_on"
  | "is_blocking"
  | "label"
>;
type AnaliseExpense = Pick<
  Database["public"]["Tables"]["expenses"]["Row"],
  "id" | "amount" | "expense_date"
>;
type AnaliseContract = Pick<
  Database["public"]["Tables"]["project_contracts"]["Row"],
  "id" | "project_id" | "total_amount" | "status" | "ends_at"
>;
type AnaliseTicket = Pick<
  Database["public"]["Tables"]["support_tickets"]["Row"],
  "id" | "status" | "created_at"
>;

type AgingBucket = { range: string; amount: number; count: number };
type ProjectBucket = "negociacao" | "em_andamento" | "concluido" | "pausado";
type MonthlyPoint = {
  key: string;
  label: string;
  cashIn: number;
  cashOut: number;
  net: number;
  recurringRevenue: number;
  projectRevenue: number;
};

interface AnaliseState {
  loaded: boolean;
  currentMrr: number;
  currentProjectRevenue: number;
  forecastRevenue: number;
  pendingReceivables: number;
  overdueReceivables: number;
  cashBalance: number;
  currentMonthNet: number;
  burnRate: number;
  operationalMargin: number | null;
  agingBuckets: AgingBucket[];
  activeClients: number;
  newClientsThisMonth: number;
  recurringClients: number;
  recurringRate: number;
  clientsAtRisk: number;
  healthyRecurringClients: number;
  nonRecurringClients: number;
  overdueClients: number;
  averageRecurringRevenuePerClient: number;
  openProjects: number;
  overdueProjects: number;
  completedThisMonth: number;
  avgDeliveryDays: number | null;
  projectStatusCounts: Record<ProjectBucket, number>;
  pipelineValue: number;
  pipelineCount: number;
  openTickets: number;
  resolvedTicketsThisMonth: number;
  monthlySeries: MonthlyPoint[];
}

const CHART_COLORS = {
  brand: "hsl(var(--elk-primary))",
  accent: "hsl(var(--elk-accent))",
  success: "hsl(var(--elk-success))",
  destructive: "hsl(var(--elk-destructive))",
  warning: "hsl(var(--elk-warning))",
  grid: "hsl(var(--elk-border))",
  muted: "hsl(var(--elk-muted-foreground))",
};

function formatCompactCurrency(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const S = "\u00A0";
  if (abs >= 1_000_000) {
    const c = abs >= 10_000_000 ? (abs / 1_000_000).toFixed(0) : (abs / 1_000_000).toFixed(1);
    return `${sign}R$${S}${c.replace(".0", "")}M`;
  }
  if (abs >= 1_000) {
    const c = abs >= 10_000 ? (abs / 1_000).toFixed(0) : (abs / 1_000).toFixed(1);
    return `${sign}R$${S}${c.replace(".0", "")}k`;
  }
  return `${sign}R$${S}${Math.round(abs)}`;
}

function getSignedCurrency(value: number) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatBRL(Math.abs(value))}`;
}

function parseDateValue(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function createMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function getMonthKeyFromDate(value?: string | null) {
  const parsed = parseDateValue(value);
  if (!parsed) return null;
  return createMonthKey(parsed.getFullYear(), parsed.getMonth());
}

/* SurfaceStat now imported from @/components/portal/SurfaceStat */

type TooltipPayloadItem = {
  color?: string;
  dataKey?: string;
  name?: string;
  value?: number | string;
};

function AnaliseTooltip({
  active,
  label,
  payload,
  formatter = formatBRL,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="min-w-[180px] rounded-xl border border-border/60 bg-card/98 px-3 py-2.5 shadow-xl backdrop-blur"
      style={{ borderLeftWidth: 2, borderLeftColor: payload[0]?.color }}
    >
      {label ? (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div
            key={`${item.dataKey}-${item.name}`}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-xs font-semibold tabular-nums",
                Number(item.value ?? 0) < 0 ? "text-destructive" : "text-foreground"
              )}
            >
              {formatter(Number(item.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevenueBreakdownChart({ data }: { data: MonthlyPoint[] }) {
  const hasValue = data.some((p) => p.recurringRevenue > 0 || p.projectRevenue > 0);
  if (!hasValue) return null;

  return (
    <div className="h-[180px] sm:h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 4, left: -8, bottom: 0 }}
          barGap={2}
          barSize={16}
        >
          <defs>
            <linearGradient id="rev-recurring" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="rev-project" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeOpacity={0.15} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={62}
            tickFormatter={(v) => formatCompactCurrency(Number(v))}
            tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<AnaliseTooltip />} />
          <Bar
            dataKey="recurringRevenue"
            name="Recorrente"
            stackId="rev"
            fill="url(#rev-recurring)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="projectRevenue"
            name="Projetos"
            stackId="rev"
            fill="url(#rev-project)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ClientDistributionChart({
  healthyRecurring,
  nonRecurring,
  overdue,
}: {
  healthyRecurring: number;
  nonRecurring: number;
  overdue: number;
}) {
  const data = [
    {
      name: "Com recorrencia",
      value: healthyRecurring,
      color: CHART_COLORS.success,
      gradId: "fcd-success",
    },
    {
      name: "Sem recorrencia",
      value: nonRecurring,
      color: CHART_COLORS.brand,
      gradId: "fcd-brand",
    },
    { name: "Em atraso", value: overdue, color: CHART_COLORS.destructive, gradId: "fcd-destr" },
  ];
  const total = healthyRecurring + nonRecurring + overdue;
  if (total === 0) return null;

  return (
    <div className="h-[160px] sm:h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 4, left: -4, bottom: 0 }} barSize={32}>
          <defs>
            <linearGradient id="fcd-success" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="fcd-brand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="fcd-destr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.destructive} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.destructive} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeOpacity={0.15} />
          <XAxis
            dataKey="name"
            tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <Tooltip content={<AnaliseTooltip formatter={(v) => `${v} cliente(s)`} />} />
          <Bar dataKey="value" name="Clientes" radius={[12, 12, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={`url(#${entry.gradId})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProjectStatusChart({ counts }: { counts: Record<ProjectBucket, number> }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const data = [
    {
      name: "Em desenvolvimento",
      value: counts.em_andamento,
      color: CHART_COLORS.accent,
      gradId: "fps-accent",
    },
    {
      name: "Concluido",
      value: counts.concluido,
      color: CHART_COLORS.success,
      gradId: "fps-success",
    },
    { name: "Pausado", value: counts.pausado, color: CHART_COLORS.warning, gradId: "fps-warning" },
    {
      name: "Negociacao",
      value: counts.negociacao,
      color: CHART_COLORS.brand,
      gradId: "fps-brand",
    },
  ];

  return (
    <div className="h-[160px] sm:h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 4, left: -4, bottom: 0 }} barSize={32}>
          <defs>
            <linearGradient id="fps-accent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="fps-success" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="fps-warning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.warning} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.warning} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="fps-brand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeOpacity={0.15} />
          <XAxis
            dataKey="name"
            tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <Tooltip content={<AnaliseTooltip formatter={(v) => `${v} projeto(s)`} />} />
          <Bar dataKey="value" name="Projetos" radius={[12, 12, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={`url(#${entry.gradId})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function FinanceAnaliseTab() {
  const [state, setState] = useState<AnaliseState | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalise = useCallback(async () => {
    setLoading(true);

    const [
      clientsRes,
      projectsRes,
      chargesRes,
      subsRes,
      expensesRes,
      contractsRes,
      ticketsRes,
      proposalsRes,
    ] = await Promise.all([
      supabase.from("clients").select("id, is_active, client_since"),
      supabase
        .from("projects")
        .select(
          "id, client_id, status, started_at, delivered_at, expected_delivery_date, current_stage"
        ),
      supabase
        .from("charges")
        .select(
          "id, client_id, amount, due_date, origin_type, paid_at, status, is_historical, subscription_id"
        ),
      supabase
        .from("project_subscriptions")
        .select(
          "id, client_id, project_id, amount, status, starts_on, due_day, ends_on, is_blocking, label"
        ),
      supabase.from("expenses").select("id, amount, expense_date"),
      supabase
        .from("project_contracts")
        .select("id, project_id, total_amount, status, ends_at")
        .order("created_at", { ascending: false }),
      supabase.from("support_tickets").select("id, status, created_at"),
      supabase
        .from("proposals")
        .select("id, total_amount, status")
        .in("status", ["enviada", "aprovada"]),
    ]);

    const err =
      clientsRes.error ??
      projectsRes.error ??
      chargesRes.error ??
      subsRes.error ??
      expensesRes.error ??
      contractsRes.error ??
      ticketsRes.error ??
      proposalsRes.error;
    if (err) {
      setLoading(false);
      return;
    }

    const clients = (clientsRes.data as AnaliseClient[] | null) ?? [];
    const projects = (projectsRes.data as AnaliseProject[] | null) ?? [];
    const charges = (chargesRes.data as AnaliseCharge[] | null) ?? [];
    const subs = (subsRes.data as AnaliseSubscription[] | null) ?? [];
    const expenses = (expensesRes.data as AnaliseExpense[] | null) ?? [];
    const contracts = (contractsRes.data as AnaliseContract[] | null) ?? [];
    const tickets = (ticketsRes.data as AnaliseTicket[] | null) ?? [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = now.toISOString().slice(0, 10);
    const curKey = createMonthKey(now.getFullYear(), now.getMonth());

    // ── Auto-sync subscription charges ──
    // Generates missing future charges so "Receita prevista" is always up-to-date.
    // Uses upsert + unique index (subscription_id, due_date) to prevent duplicates.
    const syncableSubs = subs.filter((s) => ["agendada", "ativa"].includes(s.status));
    if (syncableSubs.length > 0) {
      const latestContractByProject = new Map<string, AnaliseContract>();
      for (const c of contracts) {
        if (!latestContractByProject.has(c.project_id))
          latestContractByProject.set(c.project_id, c);
      }

      const existingKeys = new Set(
        charges
          .filter((ch) => ch.subscription_id)
          .map((ch) => `${ch.subscription_id}__${ch.due_date}`)
      );

      const toInsert: {
        client_id: string;
        project_id: string;
        contract_id: string | null;
        subscription_id: string;
        origin_type: "mensalidade";
        description: string;
        amount: number;
        due_date: string;
        status: "agendada" | "pendente";
        is_blocking: boolean;
      }[] = [];

      for (const sub of syncableSubs) {
        const contract = latestContractByProject.get(sub.project_id) ?? null;
        const coverageEnd = getSubscriptionCoverageEnd(sub.ends_on, contract?.ends_at ?? null);
        const dueDates = listSubscriptionDueDates({
          startsOn: sub.starts_on,
          dueDay: sub.due_day,
          endsOn: coverageEnd,
        });

        for (const dd of dueDates) {
          if (existingKeys.has(`${sub.id}__${dd}`)) continue;
          toInsert.push({
            client_id: sub.client_id,
            project_id: sub.project_id,
            contract_id: contract?.id ?? null,
            subscription_id: sub.id,
            origin_type: "mensalidade",
            description: sub.label,
            amount: Number(sub.amount),
            due_date: dd,
            status: dd > todayStr ? "agendada" : "pendente",
            is_blocking: sub.is_blocking,
          });
        }
      }

      // Fix status of existing future charges that are "pendente" but should be "agendada"
      const chargesToFixStatus = charges.filter(
        (ch) =>
          ch.subscription_id &&
          ch.status === "pendente" &&
          ch.due_date > todayStr &&
          !ch.is_historical
      );

      if (chargesToFixStatus.length > 0) {
        await supabase
          .from("charges")
          .update({ status: "agendada" })
          .in(
            "id",
            chargesToFixStatus.map((c) => c.id)
          );
      }

      // Fix status of past charges still marked "agendada" that should be "pendente"
      const chargesToMarkPendente = charges.filter(
        (ch) =>
          ch.subscription_id &&
          ch.status === "agendada" &&
          ch.due_date <= todayStr &&
          !ch.is_historical
      );
      if (chargesToMarkPendente.length > 0) {
        await supabase
          .from("charges")
          .update({ status: "pendente" })
          .in(
            "id",
            chargesToMarkPendente.map((c) => c.id)
          );
      }

      // Insert missing charges — upsert with ignoreDuplicates to prevent race conditions.
      // Relies on unique index idx_charges_subscription_due_date_unique (subscription_id, due_date).
      if (toInsert.length > 0) {
        const { error: upsertError } = await supabase
          .from("charges")
          .upsert(toInsert, { onConflict: "subscription_id,due_date", ignoreDuplicates: true });

        if (upsertError) {
          console.warn("[finance-sync] upsert charges:", upsertError.message);
        }
      }

      // Always reload after sync to reflect status corrections
      const refreshed = await supabase
        .from("charges")
        .select(
          "id, client_id, amount, due_date, origin_type, paid_at, status, is_historical, subscription_id"
        );
      if (!refreshed.error && refreshed.data) {
        charges.length = 0;
        charges.push(...(refreshed.data as AnaliseCharge[]));
      }
    }

    // Monthly series (12 months)
    const monthFrames = Array.from({ length: 12 }, (_, rawIndex) => {
      const ri = 12 - rawIndex - 1;
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - ri);
      const ml = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "");
      const sy = String(d.getFullYear()).slice(-2);
      return { key: createMonthKey(d.getFullYear(), d.getMonth()), label: `${ml}/${sy}` };
    });

    const monthlyMap = new Map<string, MonthlyPoint>(
      monthFrames.map((m) => [
        m.key,
        {
          key: m.key,
          label: m.label,
          cashIn: 0,
          cashOut: 0,
          net: 0,
          recurringRevenue: 0,
          projectRevenue: 0,
        },
      ])
    );

    // Accumulate in centavos (integers) to avoid floating-point errors
    charges
      .filter((c) => c.status === "pago" && !c.is_historical)
      .forEach((c) => {
        const mk = getMonthKeyFromDate(c.paid_at ?? c.due_date);
        if (!mk) return;
        const p = monthlyMap.get(mk);
        if (!p) return;
        p.cashIn += toCents(c.amount);
        if (c.origin_type === "parcela_projeto") p.projectRevenue += toCents(c.amount);
      });

    // Recurring revenue: count paid mensalidades for past months,
    // but include pending/agendada for current+future to show expected revenue
    charges
      .filter(
        (c) => c.origin_type === "mensalidade" && c.status !== "cancelado" && !c.is_historical
      )
      .forEach((c) => {
        const isPaid = c.status === "pago";
        const mk = getMonthKeyFromDate(isPaid ? (c.paid_at ?? c.due_date) : c.due_date);
        if (!mk) return;
        const p = monthlyMap.get(mk);
        if (!p) return;
        // For past months, only count paid; for current/future, count all non-cancelled
        if (mk < curKey && !isPaid) return;
        p.recurringRevenue += toCents(c.amount);
      });

    expenses.forEach((e) => {
      const mk = getMonthKeyFromDate(e.expense_date);
      if (!mk) return;
      const p = monthlyMap.get(mk);
      if (!p) return;
      p.cashOut += toCents(e.amount);
    });

    // Subscription base floor for current month
    const recurringSubscriptions = subs.filter((s) => ["agendada", "ativa"].includes(s.status));
    const recurringBaseCents = recurringSubscriptions.reduce(
      (sum, s) => sum + toCents(s.amount),
      0
    );
    const curPt = monthlyMap.get(curKey);
    if (curPt && curPt.recurringRevenue < recurringBaseCents)
      curPt.recurringRevenue = recurringBaseCents;

    // Convert centavos back to reais for the public series
    const recurringBase = recurringBaseCents / 100;
    const monthlySeries = monthFrames.map((f) => {
      const p = monthlyMap.get(f.key)!;
      return {
        ...p,
        cashIn: p.cashIn / 100,
        cashOut: p.cashOut / 100,
        recurringRevenue: p.recurringRevenue / 100,
        projectRevenue: p.projectRevenue / 100,
        net: (p.cashIn - p.cashOut) / 100,
      };
    });

    const activeClients = clients.filter((c) => c.is_active);
    const activeClientIds = new Set(activeClients.map((c) => c.id));

    const recurringClientIds = new Set(
      recurringSubscriptions.filter((s) => activeClientIds.has(s.client_id)).map((s) => s.client_id)
    );

    const overdueClientIds = new Set(
      charges
        .filter(
          (c) => activeClientIds.has(c.client_id) && c.status === "atrasado" && !c.is_historical
        )
        .map((c) => c.client_id)
    );

    const clientsWithoutRecurring = new Set(
      activeClients.filter((c) => !recurringClientIds.has(c.id)).map((c) => c.id)
    );

    const healthyRecurringClients = Array.from(recurringClientIds).filter(
      (id) => !overdueClientIds.has(id)
    ).length;
    const nonRecurringClients = Array.from(clientsWithoutRecurring).filter(
      (id) => !overdueClientIds.has(id)
    ).length;
    const clientsAtRisk = new Set([
      ...Array.from(overdueClientIds),
      ...Array.from(clientsWithoutRecurring),
    ]).size;

    // Aging — only charges already past due (future pending charges are not yet receivable)
    const agingCharges = charges.filter(
      (c) =>
        (c.status === "pendente" || c.status === "atrasado") &&
        !c.is_historical &&
        c.due_date &&
        c.due_date <= todayStr
    );
    const agingBuckets: AgingBucket[] = [
      { range: "0-30 dias", amount: 0, count: 0 },
      { range: "30-60 dias", amount: 0, count: 0 },
      { range: "60+ dias", amount: 0, count: 0 },
    ];
    agingCharges.forEach((c) => {
      const due = new Date(c.due_date + "T00:00:00");
      const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const amtCents = toCents(c.amount);
      if (days <= 30) {
        agingBuckets[0].amount += amtCents;
        agingBuckets[0].count += 1;
      } else if (days <= 60) {
        agingBuckets[1].amount += amtCents;
        agingBuckets[1].count += 1;
      } else {
        agingBuckets[2].amount += amtCents;
        agingBuckets[2].count += 1;
      }
    });
    // Convert centavos back to reais
    for (const bucket of agingBuckets) bucket.amount /= 100;

    // Projects
    const projectStatusCounts: Record<ProjectBucket, number> = {
      negociacao: 0,
      em_andamento: 0,
      concluido: 0,
      pausado: 0,
    };
    projects.forEach((p) => {
      if (p.status === "cancelado") return;
      // Usar status real do projeto (não o bucket operacional) para o gráfico
      const bucket = p.status as ProjectBucket;
      if (bucket in projectStatusCounts) projectStatusCounts[bucket] += 1;
    });

    const overdueProjects = projects.filter(
      (p) =>
        p.status === "em_andamento" &&
        p.expected_delivery_date &&
        p.expected_delivery_date < todayStr &&
        !p.delivered_at
    ).length;

    const completedThisMonth = projects.filter((p) => {
      if (p.status !== "concluido") return false;
      const d = parseDateValue(p.delivered_at);
      return d && d >= startOfMonth;
    }).length;

    const durations = projects
      .filter((p) => p.status === "concluido" && p.started_at && p.delivered_at)
      .map((p) => {
        const s = parseDateValue(p.started_at)!;
        const e = parseDateValue(p.delivered_at)!;
        return (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
      })
      .filter((d) => d > 0);
    const avgDeliveryDays =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    // Pipeline: projects in negociacao (contracts) + active proposals (enviadas/aprovadas)
    const negIds = new Set(projects.filter((p) => p.status === "negociacao").map((p) => p.id));
    const pipeContracts = contracts.filter(
      (c) => negIds.has(c.project_id) && c.status !== "cancelado"
    );
    const projectPipelineValue =
      pipeContracts.reduce((s, c) => s + toCents(c.total_amount), 0) / 100;

    type ProposalPipeline = { id: string; total_amount: number; status: string };
    const allProposals = (proposalsRes.data ?? []) as ProposalPipeline[];
    // Only "enviada" proposals count toward pipeline — "aprovada" already have a project+contract
    const pendingProposals = allProposals.filter((p) => p.status === "enviada");
    const proposalPipelineValue =
      pendingProposals.reduce((s, p) => s + toCents(p.total_amount), 0) / 100;
    const pipelineValue = projectPipelineValue + proposalPipelineValue;

    // Burn rate — average monthly expenses over the last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const recentExp = expenses.filter((e) => {
      const d = parseDateValue(e.expense_date);
      return d && d >= sixMonthsAgo;
    });
    const recentMonthsWithExpenses = monthlySeries.slice(-6).filter((m) => m.cashOut > 0).length;
    const burnRate =
      recentExp.reduce((s, e) => s + toCents(e.amount), 0) /
      100 /
      Math.max(recentMonthsWithExpenses, 1);

    // Cash, receivables, margin
    const cashBalance =
      (charges
        .filter((c) => c.status === "pago" && !c.is_historical)
        .reduce((s, c) => s + toCents(c.amount), 0) -
        expenses.reduce((s, e) => s + toCents(e.amount), 0)) /
      100;
    // "A receber" = pendente (due already) + agendada com vencimento este mês
    const currentMonthEndStr = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    const pendingReceivables =
      charges
        .filter(
          (c) =>
            !c.is_historical &&
            (c.status === "pendente" ||
              (c.status === "agendada" && c.due_date <= currentMonthEndStr))
        )
        .reduce((s, c) => s + toCents(c.amount), 0) / 100;
    const overdueReceivables =
      charges
        .filter((c) => c.status === "atrasado" && !c.is_historical)
        .reduce((s, c) => s + toCents(c.amount), 0) / 100;
    // Forecast: only future agendada charges (due_date after today)
    const agendadaCharges = charges.filter(
      (c) => c.status === "agendada" && !c.is_historical && c.due_date > todayStr
    );
    const forecastRevenue = agendadaCharges.reduce((s, c) => s + toCents(c.amount), 0) / 100;

    const curMonth = monthlySeries[monthlySeries.length - 1];
    const currentMonthNet = curMonth?.net ?? 0;
    const currentMrr = curMonth?.recurringRevenue ?? recurringBase;
    const currentProjectRevenue = curMonth?.projectRevenue ?? 0;
    const operationalMargin =
      curMonth && curMonth.cashIn > 0
        ? ((curMonth.cashIn - curMonth.cashOut) / curMonth.cashIn) * 100
        : null;

    const newClientsThisMonth = clients.filter((c) => {
      const since = parseDateValue(c.client_since);
      return since && since >= startOfMonth && c.is_active;
    }).length;

    const openTickets = tickets.filter((t) => isTicketOpen(t.status)).length;
    const resolvedTicketsThisMonth = tickets.filter((t) => {
      if (t.status !== "resolvido" && t.status !== "fechado") return false;
      const d = parseDateValue(t.created_at);
      return d && d >= startOfMonth;
    }).length;

    setState({
      loaded: true,
      currentMrr,
      currentProjectRevenue,
      forecastRevenue,
      pendingReceivables,
      overdueReceivables,
      cashBalance,
      currentMonthNet,
      burnRate,
      operationalMargin,
      agingBuckets,
      activeClients: activeClients.length,
      newClientsThisMonth,
      recurringClients: recurringClientIds.size,
      recurringRate:
        activeClients.length > 0
          ? Math.round((recurringClientIds.size / activeClients.length) * 100)
          : 0,
      clientsAtRisk,
      healthyRecurringClients,
      nonRecurringClients,
      overdueClients: overdueClientIds.size,
      averageRecurringRevenuePerClient:
        recurringClientIds.size > 0 ? recurringBase / recurringClientIds.size : 0,
      openProjects: projects.filter(isProjectOperationallyOpen).length,
      overdueProjects,
      completedThisMonth,
      avgDeliveryDays,
      projectStatusCounts,
      pipelineValue,
      pipelineCount: negIds.size + pendingProposals.length,
      openTickets,
      resolvedTicketsThisMonth,
      monthlySeries,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAnalise();
  }, [loadAnalise]);

  if (loading || !state) return <PortalLoading />;

  return (
    <div className="space-y-6">
      {/* Revenue breakdown */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Composicao da receita
        </h3>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          <SurfaceStat label="MRR" value={formatBRL(state.currentMrr)} tone="success" />
          <SurfaceStat
            label="Receita de projetos"
            value={
              state.currentProjectRevenue > 0
                ? formatBRL(state.currentProjectRevenue)
                : "Sem receita"
            }
            tone={state.currentProjectRevenue > 0 ? "brand" : "neutral"}
          />
          <SurfaceStat
            label="Receita prevista"
            value={
              state.forecastRevenue > 0 ? formatBRL(state.forecastRevenue) : "Sem agendamentos"
            }
            tone={state.forecastRevenue > 0 ? "neutral" : "neutral"}
          />
          <SurfaceStat
            label="Margem operacional"
            value={
              state.operationalMargin !== null
                ? `${Math.round(state.operationalMargin)}%`
                : "Sem receita no periodo"
            }
            tone={
              state.operationalMargin === null
                ? "neutral"
                : state.operationalMargin >= 20
                  ? "success"
                  : state.operationalMargin >= 0
                    ? "warning"
                    : "destructive"
            }
          />
        </div>
        <Card className="mt-4 rounded-2xl border-border/80 bg-card/95">
          <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Receita recorrente vs projetos por mes
            </p>
            <RevenueBreakdownChart data={state.monthlySeries.slice(-6)} />
          </CardContent>
        </Card>
      </section>

      {/* Receivables + Aging */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recebiveis e cobranca
        </h3>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          <SurfaceStat
            label="A receber"
            value={formatBRL(state.pendingReceivables)}
            tone="warning"
          />
          <SurfaceStat
            label="Em atraso"
            value={
              state.overdueReceivables > 0
                ? `${state.overdueClients}x ${formatBRL(state.overdueReceivables)}`
                : formatBRL(0)
            }
            tone={state.overdueReceivables > 0 ? "destructive" : "neutral"}
          />
          <SurfaceStat
            label="Burn rate mensal"
            value={formatBRL(state.burnRate)}
            tone={state.burnRate > 0 ? "warning" : "neutral"}
          />
          <SurfaceStat
            label="Saldo do mes"
            value={getSignedCurrency(state.currentMonthNet)}
            tone={state.currentMonthNet >= 0 ? "success" : "destructive"}
          />
        </div>
        <Card className="mt-4 rounded-2xl border-border/80 bg-card/95">
          <CardContent className="space-y-3 p-3 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Aging de recebiveis
            </p>
            {state.agingBuckets.map((bucket) => (
              <div
                key={bucket.range}
                className="flex items-center justify-between rounded-xl border border-border/75 bg-background/70 p-3"
              >
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{bucket.range}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatBRL(bucket.amount)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    bucket.count > 0
                      ? "bg-warning/10 text-warning"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {bucket.count} cobranca(s)
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Clients */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Clientes
        </h3>
        <div className="grid gap-4 xl:grid-cols-12">
          <Card className="rounded-2xl border-border/80 bg-card/95 xl:col-span-5">
            <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Distribuicao
              </p>
              <ClientDistributionChart
                healthyRecurring={state.healthyRecurringClients}
                nonRecurring={state.nonRecurringClients}
                overdue={state.overdueClients}
              />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 xl:col-span-7 xl:grid-cols-3">
            <SurfaceStat label="Ativos" value={`${state.activeClients}`} tone="brand" />
            <SurfaceStat
              label="Novos no mes"
              value={`${state.newClientsThisMonth}`}
              tone={state.newClientsThisMonth > 0 ? "success" : "neutral"}
            />
            <SurfaceStat
              label="Em risco"
              value={`${state.clientsAtRisk}`}
              tone={state.clientsAtRisk > 0 ? "warning" : "neutral"}
            />
            <SurfaceStat
              label="Taxa de recorrencia"
              value={`${state.recurringRate}%`}
              tone="success"
            />
            <SurfaceStat
              label="Receita media/cliente"
              value={formatBRL(state.averageRecurringRevenuePerClient)}
              tone="neutral"
            />
            <SurfaceStat
              label="Pipeline"
              value={`${formatBRL(state.pipelineValue)} (${state.pipelineCount})`}
              tone="brand"
            />
          </div>
        </div>
      </section>

      {/* Projects */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Projetos
        </h3>
        <div className="grid gap-4 xl:grid-cols-12">
          <Card className="rounded-2xl border-border/80 bg-card/95 xl:col-span-7">
            <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Projetos por status
              </p>
              <ProjectStatusChart counts={state.projectStatusCounts} />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 xl:col-span-5">
            <SurfaceStat label="Ativos" value={`${state.openProjects}`} tone="brand" />
            <SurfaceStat
              label="Concluidos no mes"
              value={`${state.completedThisMonth}`}
              tone="success"
            />
            <SurfaceStat
              label="Atrasados"
              value={`${state.overdueProjects}`}
              tone={state.overdueProjects > 0 ? "destructive" : "neutral"}
            />
            <SurfaceStat
              label="Entrega media"
              value={state.avgDeliveryDays !== null ? `${state.avgDeliveryDays} dias` : "N/A"}
              tone="neutral"
            />
          </div>
        </div>
      </section>

      {/* Support */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Suporte
        </h3>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          <SurfaceStat
            label="Tickets abertos"
            value={`${state.openTickets}`}
            tone={state.openTickets > 5 ? "warning" : "neutral"}
          />
          <SurfaceStat
            label="Resolvidos no mes"
            value={`${state.resolvedTicketsThisMonth}`}
            tone="success"
          />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Finance page                                                 */
/* ------------------------------------------------------------------ */

export default function AdminFinance() {
  const location = useLocation();
  const {
    data: chargesData,
    isLoading: chargesLoading,
    error: chargesError,
    refetch: refetchCharges,
  } = useAdminCharges();
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useAdminClients();

  const charges = useMemo(() => (chargesData ?? []) as PortalCharge[], [chargesData]);
  const clientsMap = useMemo(
    () =>
      Object.fromEntries(
        ((clientsData ?? []) as PortalClient[]).map((client) => [client.id, client])
      ),
    [clientsData]
  );
  const loading = chargesLoading || clientsLoading;
  const pageError = chargesError?.message ?? clientsError?.message ?? null;
  const loadFinance = refetchCharges;

  const requestedTab =
    (location.state as { financeTab?: FinanceTab } | null)?.financeTab ?? "receitas";
  const [activeTab, setActiveTab] = useState<FinanceTab>(
    requestedTab === "despesas" ? "despesas" : requestedTab === "analise" ? "analise" : "receitas"
  );

  useEffect(() => {
    const tab = (location.state as { financeTab?: FinanceTab } | null)?.financeTab;
    if (tab === "despesas") setActiveTab("despesas");
    else if (tab === "analise") setActiveTab("analise");
  }, [location.key, location.state]);

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border/60 bg-card p-1">
        {[
          { key: "receitas" as const, label: "Receitas" },
          { key: "despesas" as const, label: "Despesas" },
          { key: "inadimplencia" as const, label: "Inadimplencia" },
          { key: "receita-clientes" as const, label: "Receita/Cliente" },
          { key: "metas" as const, label: "Metas" },
          { key: "analise" as const, label: "Analise" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "min-h-[40px] min-w-fit whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div key={activeTab}>
        {activeTab === "receitas" ? (
          <FinanceRevenueTab
            charges={charges}
            clientsMap={clientsMap}
            loading={loading}
            pageError={pageError}
            onReload={loadFinance}
          />
        ) : activeTab === "despesas" ? (
          <Suspense fallback={<PortalLoading />}>
            <AdminExpenses />
          </Suspense>
        ) : activeTab === "inadimplencia" ? (
          <Suspense fallback={<PortalLoading />}>
            <Delinquency />
          </Suspense>
        ) : activeTab === "receita-clientes" ? (
          <Suspense fallback={<PortalLoading />}>
            <RevenueByClient />
          </Suspense>
        ) : activeTab === "metas" ? (
          <Suspense fallback={<PortalLoading />}>
            <FinanceGoals />
          </Suspense>
        ) : (
          <FinanceAnaliseTab />
        )}
      </div>
    </div>
  );
}
