import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { ComponentType } from "react";

import type { IconProps } from "@/assets/icons";
import { Clock, FileText, Search, TrendingUp } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
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
  unmaskCurrency,
} from "@/lib/masks";

const PAGE_SIZE = 10;

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
    <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", t.icon)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <p className={cn("mt-0.5 text-xl font-semibold tracking-tight", t.text)}>{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Row action menu                                                    */
/* ------------------------------------------------------------------ */

function RowActionMenu({
  actions,
}: {
  actions: { label: string; onClick: () => void; destructive?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Acoes"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-border/80 bg-card py-1 shadow-lg">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                action.onClick();
              }}
              className={cn(
                "flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                action.destructive ? "text-destructive" : "text-foreground"
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function AdminExpenses() {
  const { isSuperAdmin } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
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

  const loadExpenses = useCallback(
    async (background = false) => {
      if (!background || !hasLoaded) {
        setLoading(true);
        setPageError(null);
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        if (!hasLoaded) {
          setPageError(error.message);
          setExpenses([]);
          setLoading(false);
        }
        return;
      }

      setExpenses(data ?? []);
      setHasLoaded(true);
      setLoading(false);
    },
    [hasLoaded]
  );

  useEffect(() => {
    const refreshExpenses = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadExpenses(true);
    };

    void loadExpenses();

    const interval = window.setInterval(refreshExpenses, 60000);
    window.addEventListener("focus", refreshExpenses);
    document.addEventListener("visibilitychange", refreshExpenses);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshExpenses);
      document.removeEventListener("visibilitychange", refreshExpenses);
    };
  }, [loadExpenses]);

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

  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const filteredAverage = filteredExpenses.length > 0 ? filteredTotal / filteredExpenses.length : 0;

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
    if (!editor) return;

    const parsedDate = parseFormDate(editor.expense_date);
    if (!parsedDate) {
      setEditorError("Informe uma data valida.");
      return;
    }

    if (editor.description.trim().length < 3) {
      setEditorError("A descricao precisa ter ao menos 3 caracteres.");
      return;
    }

    if (!editor.category.trim()) {
      setEditorError("Selecione a categoria.");
      return;
    }

    if (!editor.amount.trim()) {
      setEditorError("Informe o valor.");
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
    await loadExpenses();
    stopEditing();
    setSavingExpenseId(null);
  };

  const handleRemoveExpense = async () => {
    if (!deleteExpenseId) return;
    if (!isSuperAdmin) {
      toast.error("Somente o super admin pode remover despesas.");
      setDeleteExpenseId(null);
      return;
    }

    setRemovingExpenseId(deleteExpenseId);

    const { error } = await supabase.from("expenses").delete().eq("id", deleteExpenseId);

    if (error) {
      toast.error("Nao foi possivel remover a despesa.", {
        description: error.message,
      });
      setRemovingExpenseId(null);
      return;
    }

    toast.success("Despesa removida.");
    setDeleteExpenseId(null);
    setRemovingExpenseId(null);
    await loadExpenses();
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Despesas</h2>
          <p className="mt-1 text-sm text-muted-foreground">{formatMonthLabel(monthFilter)}</p>
        </div>
        <Link
          to="/portal/admin/financeiro/nova-despesa"
          className={buttonVariants({ variant: "default" })}
        >
          Nova despesa
        </Link>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
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
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* ── Expense list ── */}
      {loading && !hasLoaded ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[72px] animate-pulse rounded-xl border border-border/50 bg-card/60"
            />
          ))}
        </div>
      ) : pageError ? (
        <AdminEmptyState
          icon={TrendingUp}
          title="Nao foi possivel carregar as despesas"
          description={`${pageError} Atualize a pagina ou tente novamente em instantes.`}
          action={
            <Button type="button" onClick={() => void loadExpenses()}>
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
          <div className="hidden xl:grid xl:grid-cols-[1fr_120px_120px_120px_auto] gap-x-6 px-5 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Descricao
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
                className="rounded-xl border border-border/50 bg-background/60 px-5 py-4 transition-all hover:border-primary/25 hover:bg-card"
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field className="md:col-span-2">
                        <Label>Descricao</Label>
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
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
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
                  <div className="grid grid-cols-1 items-center gap-x-6 gap-y-3 xl:grid-cols-[1fr_120px_120px_120px_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold leading-snug text-foreground">
                        {expense.description}
                      </p>
                      {expense.notes ? (
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                          {expense.notes}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-sm text-muted-foreground">{expense.category}</p>

                    <p className="text-sm text-muted-foreground">
                      {formatExpenseDate(expense.expense_date)}
                    </p>

                    <p className="text-sm font-semibold text-destructive">
                      {formatBRL(Number(expense.amount))}
                    </p>

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
        description="Essa acao remove o lancamento financeiro selecionado. Voce podera cadastrar novamente depois, se precisar."
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
