import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAdminExpenses } from "@/hooks/useAdminExpenses";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { ComponentType } from "react";

import type { IconProps } from "@/assets/icons";
import { Clock, FileText, Search, TrendingUp } from "@/assets/icons";
import ExportMenu from "@/components/portal/ExportMenu";
import { exportCSV, exportPDF, type ExportColumn } from "@/lib/export";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import PortalLoading from "@/components/portal/PortalLoading";
import RowActionMenu from "@/components/portal/RowActionMenu";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  Button,
  Field,
  Input,
  Label,
  Textarea,
  buttonVariants,
  cn,
} from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  formatBRL,
  formatDateInput,
  maskCurrency,
  maskDate,
  parseFormDate,
  toCents,
  unmaskCurrency,
} from "@/lib/masks";

const PAGE_SIZE = 10;

const CATEGORY_LABELS: Record<string, string> = {
  geral: "Geral",
  software: "Software / Ferramentas",
  infra: "Infraestrutura",
  marketing: "Marketing",
  pessoal: "Pessoal",
  equipamento: "Equipamento",
  servico_terceiro: "Serviço de Terceiro",
  imposto: "Impostos",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

type Expense = Database["public"]["Tables"]["expenses"]["Row"];

type ExpenseEditor = {
  description: string;
  category: string;
  expense_date: string;
  amount: string;
  notes: string;
};

function createMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return createMonthKey(now.getFullYear(), now.getMonth());
}

function formatExpenseDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function getEditorFromExpense(expense: Expense): ExpenseEditor {
  return {
    description: expense.description,
    category: expense.category,
    expense_date: formatDateInput(expense.expense_date),
    amount: formatBRL(Number(expense.amount)),
    notes: expense.notes ?? "",
  };
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
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function AdminExpenses() {
  const { isSuperAdmin } = useAuth();
  const {
    data: expenses = [] as Expense[],
    isLoading: loading,
    error: queryError,
    refetch: refetchExpenses,
  } = useAdminExpenses();
  const pageError = queryError?.message ?? null;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(getCurrentMonthKey());
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editor, setEditor] = useState<ExpenseEditor | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [savingExpenseId, setSavingExpenseId] = useState<string | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [removingExpenseId, setRemovingExpenseId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const hasLoaded = !loading && !queryError;

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, categoryFilter, monthFilter]);

  const categories = useMemo(
    () =>
      Array.from(new Set(expenses.map((expense) => expense.category))).sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [expenses]
  );

  const monthOptions = useMemo(() => {
    const allMonths = new Set([
      getCurrentMonthKey(),
      ...expenses.map((expense) => expense.expense_date.slice(0, 7)),
    ]);
    return Array.from(allMonths).sort((left, right) => right.localeCompare(left));
  }, [expenses]);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesSearch =
          deferredSearch.length === 0 ||
          expense.description.toLowerCase().includes(deferredSearch) ||
          expense.category.toLowerCase().includes(deferredSearch) ||
          (expense.notes ?? "").toLowerCase().includes(deferredSearch);

        const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
        const matchesMonth = monthFilter === "all" || expense.expense_date.startsWith(monthFilter);

        return matchesSearch && matchesCategory && matchesMonth;
      }),
    [categoryFilter, deferredSearch, expenses, monthFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const visibleExpenses = filteredExpenses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const filteredTotal =
    filteredExpenses.reduce((sum, expense) => sum + toCents(expense.amount), 0) / 100;
  const filteredAverage = filteredExpenses.length > 0 ? filteredTotal / filteredExpenses.length : 0;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const expense of filteredExpenses) {
      map.set(expense.category, (map.get(expense.category) ?? 0) + toCents(expense.amount));
    }
    const filteredTotalCents = Math.round(filteredTotal * 100);
    return Array.from(map.entries())
      .map(([category, totalCents]) => ({
        category,
        total: totalCents / 100,
        percent: filteredTotalCents > 0 ? (totalCents / filteredTotalCents) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, filteredTotal]);

  const expExportColumns: ExportColumn[] = [
    { key: "description", label: "Descrição" },
    { key: "category", label: "Categoria" },
    { key: "amount", label: "Valor", align: "right" },
    { key: "date", label: "Data" },
    { key: "notes", label: "Observações" },
  ];

  const expExportRows = filteredExpenses.map((e) => ({
    description: e.description,
    category: CATEGORY_LABELS[e.category] ?? e.category,
    amount: formatBRL(Number(e.amount)),
    date: new Date(`${e.expense_date}T00:00:00`).toLocaleDateString("pt-BR"),
    notes: e.notes ?? "",
  }));

  const handleExpCSV = () =>
    exportCSV({
      title: "Despesas",
      filename: "despesas",
      columns: expExportColumns,
      rows: expExportRows,
    });
  const handleExpPDF = () =>
    exportPDF({
      title: "Relatório de Despesas",
      subtitle: `${filteredExpenses.length} lancamentos | Total: ${formatBRL(filteredTotal)}`,
      filename: "despesas",
      columns: expExportColumns,
      rows: expExportRows,
    });

  const startEditing = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setEditor(getEditorFromExpense(expense));
    setEditorError(null);
  };

  const stopEditing = () => {
    setEditingExpenseId(null);
    setEditor(null);
    setEditorError(null);
  };

  const handleSaveExpense = async (expenseId: string) => {
    if (!editor || savingExpenseId) return;

    const parsedDate = parseFormDate(editor.expense_date);
    if (!parsedDate) {
      setEditorError("Informe uma data valida.");
      return;
    }

    if (editor.description.trim().length < 3) {
      setEditorError("A descrição precisa ter ao menos 3 caracteres.");
      return;
    }

    if (!editor.category.trim()) {
      setEditorError("Selecione a categoria.");
      return;
    }

    if (!editor.amount.trim() || unmaskCurrency(editor.amount) <= 0) {
      setEditorError("Informe um valor maior que zero.");
      return;
    }

    setSavingExpenseId(expenseId);
    setEditorError(null);

    const { error } = await supabase
      .from("expenses")
      .update({
        description: editor.description.trim(),
        category: editor.category,
        expense_date: parsedDate,
        amount: unmaskCurrency(editor.amount),
        notes: editor.notes.trim() || null,
      })
      .eq("id", expenseId);

    if (error) {
      setEditorError(error.message);
      setSavingExpenseId(null);
      return;
    }

    toast.success("Despesa atualizada.");
    await refetchExpenses();
    stopEditing();
    setSavingExpenseId(null);
  };

  const handleRemoveExpense = async () => {
    if (!deleteExpenseId || removingExpenseId) return;
    if (!isSuperAdmin) {
      toast.error("Somente o super admin pode remover despesas.");
      setDeleteExpenseId(null);
      return;
    }

    setRemovingExpenseId(deleteExpenseId);

    const { error } = await supabase.from("expenses").delete().eq("id", deleteExpenseId);

    if (error) {
      toast.error("Não foi possível remover a despesa.", {
        description: error.message,
      });
      setRemovingExpenseId(null);
      return;
    }

    toast.success("Despesa removida.");
    setDeleteExpenseId(null);
    setRemovingExpenseId(null);
    await refetchExpenses();
  };

  if (loading && !hasLoaded) return <PortalLoading />;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Despesas</h2>
          <p className="mt-1 text-sm text-muted-foreground">{formatMonthLabel(monthFilter)}</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu onExportCSV={handleExpCSV} onExportPDF={handleExpPDF} />
          <Link
            to="/portal/admin/financeiro/nova-despesa"
            className={buttonVariants({ variant: "default" })}
          >
            Nova despesa
          </Link>
        </div>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-3">
        <MetricTile
          label="Saida do periodo"
          value={formatBRL(filteredTotal)}
          icon={Clock}
          tone="warning"
        />
        <MetricTile
          label="Lancamentos"
          value={filteredExpenses.length.toString()}
          icon={FileText}
          tone="accent"
        />
        <MetricTile
          label="Media/lancamento"
          value={formatBRL(filteredAverage)}
          icon={TrendingUp}
          tone="secondary"
        />
      </div>

      {/* ── Category breakdown ── */}
      {categoryBreakdown.length > 1 && (
        <div className="rounded-xl border border-border/60 bg-card/92 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Distribuicao por categoria
          </p>
          <div className="space-y-2">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <span className="w-24 truncate text-xs font-medium text-foreground sm:w-32">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                </div>
                <span className="w-20 text-right text-xs font-semibold tabular-nums text-foreground">
                  {formatBRL(item.total)}
                </span>
                <span className="w-12 text-right text-[10px] tabular-nums text-muted-foreground">
                  {item.percent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            placeholder="Buscar despesa..."
            className="pl-9"
          />
        </div>
        <select
          value={monthFilter}
          onChange={(event) => setMonthFilter(event.target.value)}
          className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-48"
        >
          {monthOptions.map((monthKey) => (
            <option key={monthKey} value={monthKey}>
              {formatMonthLabel(monthKey)}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-48"
        >
          <option value="all">Todas categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category] ?? category}
            </option>
          ))}
        </select>
      </div>

      {/* ── Expense list ── */}
      {pageError ? (
        <AdminEmptyState
          icon={TrendingUp}
          title="Não foi possível carregar as despesas"
          description={`${pageError} Atualize a pagina ou tente novamente em instantes.`}
          action={
            <Button type="button" onClick={() => void refetchExpenses()}>
              Tentar novamente
            </Button>
          }
        />
      ) : filteredExpenses.length === 0 ? (
        <AdminEmptyState
          icon={TrendingUp}
          title="Nenhuma despesa encontrada"
          description="Ajuste os filtros ou registre um novo lancamento."
          action={
            <Link
              to="/portal/admin/financeiro/nova-despesa"
              className={buttonVariants({ variant: "default" })}
            >
              Registrar despesa
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="hidden md:grid md:grid-cols-[1fr_160px_140px_120px_auto] gap-x-6 px-5 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Descrição
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Categoria
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Data
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Valor
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" />
          </div>

          {visibleExpenses.map((expense) => {
            const isEditing = editingExpenseId === expense.id && editor;

            return (
              <article
                key={expense.id}
                className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-all hover:border-primary/25 hover:bg-card sm:px-5 sm:py-4"
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field className="md:col-span-2">
                        <Label>Descrição</Label>
                        <Input
                          value={editor.description}
                          onChange={(event) =>
                            setEditor((current) =>
                              current ? { ...current, description: event.target.value } : current
                            )
                          }
                        />
                      </Field>

                      <Field>
                        <Label>Categoria</Label>
                        <select
                          value={editor.category}
                          onChange={(event) =>
                            setEditor((current) =>
                              current ? { ...current, category: event.target.value } : current
                            )
                          }
                          className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field>
                        <Label>Data</Label>
                        <Input
                          value={editor.expense_date}
                          onChange={(event) =>
                            setEditor((current) =>
                              current
                                ? { ...current, expense_date: maskDate(event.target.value) }
                                : current
                            )
                          }
                          inputMode="numeric"
                          placeholder="DD/MM/AAAA"
                        />
                      </Field>

                      <Field>
                        <Label>Valor</Label>
                        <Input
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

                      <Field className="md:col-span-2">
                        <Label>Observacao</Label>
                        <Textarea
                          value={editor.notes}
                          onChange={(event) =>
                            setEditor((current) =>
                              current ? { ...current, notes: event.target.value } : current
                            )
                          }
                          placeholder="Contexto adicional da despesa"
                        />
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
                        onClick={() => void handleSaveExpense(expense.id)}
                        disabled={savingExpenseId === expense.id}
                      >
                        {savingExpenseId === expense.id ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 items-center gap-x-6 gap-y-2 sm:gap-y-3 md:grid-cols-[1fr_160px_140px_120px_auto]">
                    {/* Description + actions (mobile: same row) */}
                    <div className="flex items-start justify-between gap-2 md:contents">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                          {expense.description}
                        </p>
                        {expense.notes ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                            {expense.notes}
                          </p>
                        ) : null}
                      </div>

                      {/* Mobile actions */}
                      <div className="shrink-0 md:hidden">
                        <RowActionMenu
                          actions={[
                            { label: "Editar", onClick: () => startEditing(expense) },
                            ...(isSuperAdmin
                              ? [
                                  {
                                    label: "Remover",
                                    onClick: () => setDeleteExpenseId(expense.id),
                                    destructive: true,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </div>

                    {/* Mobile: compact row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 md:hidden">
                      <span className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[expense.category] ?? expense.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatExpenseDate(expense.expense_date)}
                      </span>
                      <span className="text-xs font-semibold text-destructive">
                        {formatBRL(Number(expense.amount))}
                      </span>
                    </div>

                    {/* Desktop columns */}
                    <p className="hidden whitespace-nowrap text-sm text-muted-foreground md:block">
                      {CATEGORY_LABELS[expense.category] ?? expense.category}
                    </p>

                    <p className="hidden whitespace-nowrap text-sm text-muted-foreground md:block">
                      {formatExpenseDate(expense.expense_date)}
                    </p>

                    <p className="hidden text-sm font-semibold text-destructive md:block">
                      {formatBRL(Number(expense.amount))}
                    </p>

                    {/* Desktop actions */}
                    <div className="hidden md:block">
                      <RowActionMenu
                        actions={[
                          { label: "Editar", onClick: () => startEditing(expense) },
                          ...(isSuperAdmin
                            ? [
                                {
                                  label: "Remover",
                                  onClick: () => setDeleteExpenseId(expense.id),
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

          {/* Pagination */}
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

      <AlertDialog
        open={isSuperAdmin && Boolean(deleteExpenseId)}
        title="Remover despesa"
        description="Essa acao remove o lancamento financeiro selecionado. Você podera cadastrar novamente depois, se precisar."
        confirmLabel="Remover despesa"
        cancelLabel="Cancelar"
        destructive
        loading={Boolean(removingExpenseId)}
        loadingLabel="Removendo..."
        onCancel={() => {
          if (removingExpenseId) return;
          setDeleteExpenseId(null);
        }}
        onConfirm={() => void handleRemoveExpense()}
      />
    </div>
  );
}
