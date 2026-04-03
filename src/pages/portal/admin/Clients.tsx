import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Building2, PiggyBank, Search, Wallet } from "@/assets/icons";
import type { IconProps } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, buttonVariants, Button, Input, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";
import { formatBRL } from "@/lib/masks";

const PAGE_SIZE = 8;

type Client = Database["public"]["Tables"]["clients"]["Row"];
type StatusFilter = "all" | "active" | "inactive";

function formatClientSince(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Metric tile — uniform height, Apple-style density                 */
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
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-border/80 bg-card py-1 shadow-lg">
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
/*  Client row — table-like, uniform columns + action menu             */
/* ------------------------------------------------------------------ */

function ClientRow({
  client,
  onToggleActive,
  onDelete,
  canDelete,
}: {
  client: Client;
  onToggleActive: (client: Client) => void;
  onDelete: (client: Client) => void;
  canDelete: boolean;
}) {
  const navigate = useNavigate();
  const displayName =
    client.client_type === "pj" && client.nome_fantasia ? client.nome_fantasia : client.full_name;

  const actions: { label: string; onClick: () => void; destructive?: boolean }[] = [
    {
      label: "Editar dados e contrato",
      onClick: () => navigate(`/portal/admin/clientes/${client.id}?edit=dados`),
    },
    {
      label: "Novo projeto",
      onClick: () => navigate(`/portal/admin/projetos/novo?clientId=${client.id}`),
    },
    {
      label: client.is_active ? "Inativar cliente" : "Reativar cliente",
      onClick: () => onToggleActive(client),
      destructive: client.is_active,
    },
    { label: "Ver detalhes", onClick: () => navigate(`/portal/admin/clientes/${client.id}`) },
    ...(canDelete
      ? [{ label: "Excluir cliente", onClick: () => onDelete(client), destructive: true as const }]
      : []),
  ];

  return (
    <div className="group grid grid-cols-1 items-center gap-x-6 gap-y-3 rounded-xl border border-border/50 bg-background/60 px-5 py-4 transition-all hover:border-primary/25 hover:bg-card md:grid-cols-[1fr_80px_140px_100px_100px_40px]">
      {/* Col 1 — Client info */}
      <Link to={`/portal/admin/clientes/${client.id}`} className="min-w-0">
        <p className="truncate text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {displayName}
        </p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{client.email}</p>
      </Link>

      {/* Col 2 — Status */}
      <div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
            client.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          {client.is_active ? "Ativo" : "Inativo"}
        </span>
      </div>

      {/* Col 3 — Entrada */}
      <p className="whitespace-nowrap text-sm text-muted-foreground">
        {formatClientSince(client.client_since)}
      </p>

      {/* Col 4 — Mensal */}
      <p className="text-sm font-medium text-foreground">
        {formatBRL(Number(client.monthly_value))}
      </p>

      {/* Col 5 — Projeto */}
      <p className="text-sm font-medium text-foreground">
        {formatBRL(Number(client.project_total_value))}
      </p>

      {/* Col 6 — Actions */}
      <RowActionMenu actions={actions} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Column header (table-like)                                        */
/* ------------------------------------------------------------------ */

function ColumnHeader() {
  return (
    <div className="hidden md:grid md:grid-cols-[1fr_80px_140px_100px_100px_40px] gap-x-6 px-5 pb-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Cliente
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Status
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Entrada
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Mensal
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Projeto
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function AdminClients() {
  const { isSuperAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadClients = useCallback(
    async (background = false) => {
      if (!background || !hasLoaded) {
        setLoading(true);
        setPageError(null);
      }

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        if (!hasLoaded) {
          setPageError(error.message);
          setClients([]);
          setLoading(false);
        }
        return;
      }

      setClients(data ?? []);
      setHasLoaded(true);
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const refreshClients = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadClients(true);
    };

    void loadClients();

    const interval = window.setInterval(refreshClients, 60000);
    window.addEventListener("focus", refreshClients);
    document.addEventListener("visibilitychange", refreshClients);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshClients);
      document.removeEventListener("visibilitychange", refreshClients);
    };
  }, [loadClients]);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, statusFilter]);

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const matchesSearch =
          deferredSearch.length === 0 ||
          client.full_name.toLowerCase().includes(deferredSearch) ||
          client.email.toLowerCase().includes(deferredSearch) ||
          client.cpf.includes(deferredSearch.replace(/\D/g, ""));

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && client.is_active) ||
          (statusFilter === "inactive" && !client.is_active);

        return matchesSearch && matchesStatus;
      }),
    [clients, deferredSearch, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const visibleClients = filteredClients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const { activeClients, monthlyPortfolio, projectPortfolio } = useMemo(
    () => ({
      activeClients: clients.filter((client) => client.is_active).length,
      monthlyPortfolio: clients.reduce((sum, client) => sum + Number(client.monthly_value), 0),
      projectPortfolio: clients.reduce(
        (sum, client) => sum + Number(client.project_total_value),
        0
      ),
    }),
    [clients]
  );

  const totalClients = clients.length;

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setDeleteLoading(true);

    try {
      if (clientToDelete.user_id) {
        const authHeaders = await getSupabaseFunctionAuthHeaders();
        const { data: deleteUserData, error: deleteUserError } = await supabase.functions.invoke(
          "delete-user",
          { body: { user_id: clientToDelete.user_id }, headers: authHeaders }
        );
        if (deleteUserError || deleteUserData?.error) {
          throw new Error(deleteUserError?.message ?? String(deleteUserData?.error));
        }
      }

      const { error: deleteClientError } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientToDelete.id);

      if (deleteClientError) {
        toast.error("O acesso foi removido, mas o cadastro ainda existe.", {
          description: deleteClientError.message,
        });
        return;
      }

      toast.success("Cliente removido. Registros vinculados foram apagados em cascata.");
      setClientToDelete(null);
      void loadClients();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel remover o cliente.";
      toast.error("Erro ao remover cliente.", { description: message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (client: Client) => {
    const next = !client.is_active;
    const { error } = await supabase
      .from("clients")
      .update({ is_active: next })
      .eq("id", client.id);

    if (error) {
      toast.error("Nao foi possivel alterar o status.", { description: error.message });
      return;
    }

    toast.success(next ? "Cliente reativado." : "Cliente inativado.");
    void loadClients();
  };

  const deleteDisplayName =
    clientToDelete?.client_type === "pj" && clientToDelete?.nome_fantasia
      ? clientToDelete.nome_fantasia
      : (clientToDelete?.full_name ?? "");

  return (
    <div className="space-y-8">
      <AlertDialog
        open={clientToDelete !== null}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${deleteDisplayName}"? Esta acao nao pode ser desfeita. Todos os projetos, contratos, financeiro e historico vinculados serao removidos permanentemente.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        loading={deleteLoading}
        loadingLabel="Excluindo..."
        onConfirm={() => void handleDeleteClient()}
        onCancel={() => setClientToDelete(null)}
      />

      {/* -- Action bar -- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Clientes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalClients} cliente{totalClients !== 1 ? "s" : ""} registrado
            {totalClients !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/portal/admin/clientes/novo" className={buttonVariants({ variant: "default" })}>
          Novo cliente
        </Link>
      </div>

      {/* -- Metrics -- */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <MetricTile
          label="Clientes ativos"
          value={activeClients.toString()}
          icon={Building2}
          tone="success"
        />
        <MetricTile
          label="Carteira mensal"
          value={formatBRL(monthlyPortfolio)}
          icon={Wallet}
          tone="accent"
        />
        <MetricTile
          label="Valor contratado"
          value={formatBRL(projectPortfolio)}
          icon={PiggyBank}
          tone="secondary"
        />
      </div>

      {/* -- Filters -- */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail ou CPF..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-48"
        >
          <option value="all">Todos os status</option>
          <option value="active">Apenas ativos</option>
          <option value="inactive">Apenas inativos</option>
        </select>
      </div>

      {/* -- Client list -- */}
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
          icon={Building2}
          title="Nao foi possivel carregar a carteira"
          description={`${pageError} Atualize a pagina ou tente novamente em instantes.`}
          action={
            <Button type="button" onClick={() => void loadClients()}>
              Tentar novamente
            </Button>
          }
        />
      ) : filteredClients.length === 0 ? (
        <AdminEmptyState
          icon={Building2}
          title="Nenhum cliente encontrado"
          description="Ajuste os filtros ou cadastre um novo cliente para alimentar a carteira."
          action={
            <Link
              to="/portal/admin/clientes/novo"
              className={buttonVariants({ variant: "default" })}
            >
              Cadastrar cliente
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          <ColumnHeader />

          {visibleClients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onToggleActive={handleToggleActive}
              onDelete={setClientToDelete}
              canDelete={isSuperAdmin}
            />
          ))}

          {/* -- Pagination -- */}
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
    </div>
  );
}
