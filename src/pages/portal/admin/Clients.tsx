import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Building2, PiggyBank, Search, Wallet } from "@/assets/icons";
import type { IconProps } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/admin/AdminEmptyState";
import ClientRowIndicators from "@/components/portal/client/ClientRowIndicators";
import PortalLoading from "@/components/portal/shared/PortalLoading";
import { useAdminClients, type AdminClientIndicators } from "@/hooks/useAdminClients";
import { useUrlState, useUrlStateNullable } from "@/hooks/useUrlState";
import RowActionMenu from "@/components/portal/shared/RowActionMenu";
import { AlertDialog, buttonVariants, Button, Input, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/masks";
import {
  getProfileInitials,
  getProfileAvatarImageStyle,
  resolveProfileAvatarTransform,
} from "@/lib/profile";

const PAGE_SIZE = 8;

type Client = Database["public"]["Tables"]["clients"]["Row"] & {
  indicators?: AdminClientIndicators;
};
type StatusFilter = "all" | "active" | "inactive";

interface AvatarInfo {
  avatar_url: string | null;
  avatar_zoom: number | null;
  avatar_position_x: number | null;
  avatar_position_y: number | null;
}
type ClientTypeFilter = "all" | "pf" | "pj";
type ContractStatusFilter = "all" | "ativo" | "inadimplente" | "cancelado";
type OriginFilter = "all" | "lead" | "indicacao" | "inbound";

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
/*  Client row — table-like, uniform columns + action menu             */
/* ------------------------------------------------------------------ */

function ClientRow({
  client,
  onToggleActive,
  avatarInfo,
}: {
  client: Client;
  onToggleActive: (client: Client) => void;
  avatarInfo?: AvatarInfo;
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
  ];

  return (
    <div className="group grid grid-cols-1 items-center gap-x-6 gap-y-2 rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-all hover:border-primary/25 hover:bg-card sm:px-5 sm:py-4 md:grid-cols-[1fr_80px_140px_100px_100px_40px] md:gap-y-3">
      {/* Col 1 — Client info + actions (mobile: same row) */}
      <div className="flex items-start justify-between gap-2 md:contents">
        <Link
          to={`/portal/admin/clientes/${client.id}`}
          className="flex min-w-0 items-center gap-3"
        >
          {avatarInfo?.avatar_url ? (
            <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <img
                src={avatarInfo.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
                style={getProfileAvatarImageStyle(
                  resolveProfileAvatarTransform({
                    zoom: avatarInfo.avatar_zoom ?? undefined,
                    positionX: avatarInfo.avatar_position_x ?? undefined,
                    positionY: avatarInfo.avatar_position_y ?? undefined,
                  })
                )}
              />
            </span>
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary dark:bg-primary/15">
              {getProfileInitials(displayName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-[15px]">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1 sm:text-sm">
              {client.email}
            </p>
            <ClientRowIndicators indicators={client.indicators} className="mt-1.5" />
          </div>
        </Link>

        {/* Mobile actions */}
        <div className="shrink-0 md:hidden">
          <RowActionMenu actions={actions} />
        </div>
      </div>

      {/* Mobile: secondary info in a compact row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 md:hidden">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
            client.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          {client.is_active ? "Ativo" : "Inativo"}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatClientSince(client.client_since)}
        </span>
        <span className="whitespace-nowrap text-xs font-medium text-foreground">
          Mensal {formatBRL(Number(client.monthly_value))}
        </span>
        <span className="whitespace-nowrap text-xs font-medium text-foreground">
          Projeto {formatBRL(Number(client.project_total_value))}
        </span>
      </div>

      {/* Col 2 — Status (desktop) */}
      <div className="hidden md:block">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
            client.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          {client.is_active ? "Ativo" : "Inativo"}
        </span>
      </div>

      {/* Col 3 — Entrada (desktop) */}
      <p className="hidden whitespace-nowrap text-sm text-muted-foreground md:block">
        {formatClientSince(client.client_since)}
      </p>

      {/* Col 4 — Mensal (desktop) */}
      <p className="hidden whitespace-nowrap text-sm font-medium text-foreground md:block">
        {formatBRL(Number(client.monthly_value))}
      </p>

      {/* Col 5 — Projeto (desktop) */}
      <p className="hidden whitespace-nowrap text-sm font-medium text-foreground md:block">
        {formatBRL(Number(client.project_total_value))}
      </p>

      {/* Col 6 — Actions (desktop) */}
      <div className="hidden md:block">
        <RowActionMenu actions={actions} />
      </div>
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
  const {
    data: clients = [],
    isLoading: loading,
    error: queryError,
    refetch: refetchClients,
  } = useAdminClients();
  const hasLoaded = !loading && !queryError;
  const pageError = queryError?.message ?? null;
  const [pageParam, setPageParam] = useUrlState("page", "1");
  const page = Math.max(0, (Number(pageParam) || 1) - 1);
  const setPage = useCallback(
    (next: number | ((current: number) => number)) => {
      const resolved = typeof next === "function" ? next(page) : next;
      const safe = Math.max(0, resolved);
      setPageParam(String(safe + 1));
    },
    [page, setPageParam]
  );
  const [search, setSearch] = useUrlState("q", "");
  const [statusFilter, setStatusFilter] = useUrlState<StatusFilter>("status", "all");
  const [clientTypeFilter, setClientTypeFilter] = useUrlState<ClientTypeFilter>("tipo", "all");
  const [contractStatusFilter, setContractStatusFilter] = useUrlState<ContractStatusFilter>(
    "contrato",
    "all"
  );
  const [originFilter, setOriginFilter] = useUrlState<OriginFilter>("origem", "all");
  const [tagFilter, setTagFilter] = useUrlStateNullable<string>("tag");
  const [deactivateTarget, setDeactivateTarget] = useState<Client | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [avatarMap, setAvatarMap] = useState<Record<string, AvatarInfo>>({});

  // Fetch avatar data from profiles when clients load
  useEffect(() => {
    if (clients.length === 0) return;
    const userIds = clients.map((c) => c.user_id).filter(Boolean) as string[];
    if (userIds.length === 0) return;

    supabase
      .from("profiles")
      .select("id, avatar_url, avatar_zoom, avatar_position_x, avatar_position_y")
      .in("id", userIds)
      .then(({ data: profiles }) => {
        if (!profiles) return;
        const map: Record<string, AvatarInfo> = {};
        for (const p of profiles) {
          map[p.id] = {
            avatar_url: p.avatar_url,
            avatar_zoom: p.avatar_zoom,
            avatar_position_x: p.avatar_position_x,
            avatar_position_y: p.avatar_position_y,
          };
        }
        setAvatarMap(map);
      });
  }, [clients]);

  useEffect(() => {
    setPage(0);
  }, [
    deferredSearch,
    statusFilter,
    clientTypeFilter,
    contractStatusFilter,
    originFilter,
    tagFilter,
  ]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const client of clients) {
      for (const tag of client.tags ?? []) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [clients]);

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

        const matchesClientType =
          clientTypeFilter === "all" || client.client_type === clientTypeFilter;

        const matchesContractStatus =
          contractStatusFilter === "all" || client.contract_status === contractStatusFilter;

        const matchesOrigin = originFilter === "all" || client.client_origin === originFilter;

        const matchesTag = !tagFilter || (client.tags ?? []).includes(tagFilter);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesClientType &&
          matchesContractStatus &&
          matchesOrigin &&
          matchesTag
        );
      }),
    [
      clients,
      deferredSearch,
      statusFilter,
      clientTypeFilter,
      contractStatusFilter,
      originFilter,
      tagFilter,
    ]
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

  const persistActiveFlag = async (client: Client, next: boolean) => {
    const { error } = await supabase
      .from("clients")
      .update({ is_active: next })
      .eq("id", client.id);
    return error;
  };

  const showUndoToast = (client: Client, previous: boolean) => {
    const label = previous ? "Cliente reativado." : "Cliente inativado.";
    toast.success(label, {
      action: {
        label: "Desfazer",
        onClick: async () => {
          const err = await persistActiveFlag(client, previous);
          if (err) {
            toast.error("Não foi possível desfazer.", { description: err.message });
            return;
          }
          toast.success(previous ? "Cliente reativado." : "Cliente inativado.");
          void refetchClients();
        },
      },
    });
  };

  const handleToggleActive = async (client: Client) => {
    if (client.is_active) {
      // Inativar: exige confirmação explícita
      setDeactivateTarget(client);
      return;
    }
    // Reativar: acao reversivel, executa direto e oferece undo
    const previous = client.is_active;
    const error = await persistActiveFlag(client, true);
    if (error) {
      toast.error("Não foi possível alterar o status.", { description: error.message });
      return;
    }
    showUndoToast(client, previous);
    void refetchClients();
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivateLoading(true);
    const previous = deactivateTarget.is_active;
    const error = await persistActiveFlag(deactivateTarget, false);
    setDeactivateLoading(false);
    if (error) {
      toast.error("Não foi possível inativar o cliente.", { description: error.message });
      return;
    }
    showUndoToast(deactivateTarget, previous);
    setDeactivateTarget(null);
    void refetchClients();
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    clientTypeFilter !== "all" ||
    contractStatusFilter !== "all" ||
    originFilter !== "all" ||
    tagFilter !== null;

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setClientTypeFilter("all");
    setContractStatusFilter("all");
    setOriginFilter("all");
    setTagFilter(null);
    setPage(0);
  };

  if (loading) return <PortalLoading />;

  return (
    <div className="space-y-8">
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
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-3">
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
      <div className="space-y-3">
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

        {/* Advanced filters */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Tipo (PF/PJ) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mr-1">
              Tipo:
            </span>
            {[
              { value: "all" as const, label: "Todos" },
              { value: "pf" as const, label: "PF" },
              { value: "pj" as const, label: "PJ" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setClientTypeFilter(option.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  clientTypeFilter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Status do contrato */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mr-1">
              Contrato:
            </span>
            {[
              { value: "all" as const, label: "Todos" },
              { value: "ativo" as const, label: "Ativo" },
              { value: "inadimplente" as const, label: "Inadimplente" },
              { value: "cancelado" as const, label: "Cancelado" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setContractStatusFilter(option.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  contractStatusFilter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Origem */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mr-1">
              Origem:
            </span>
            {[
              { value: "all" as const, label: "Todas" },
              { value: "lead" as const, label: "Lead" },
              { value: "indicacao" as const, label: "Indicacao" },
              { value: "inbound" as const, label: "Inbound" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setOriginFilter(option.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  originFilter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mr-1">
              Tags:
            </span>
            <button
              type="button"
              onClick={() => setTagFilter(null)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                tagFilter === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Todas
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  tagFilter === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* -- Client list -- */}
      {pageError ? (
        <AdminEmptyState
          variant="error"
          icon={Building2}
          title="Não foi possível carregar a carteira"
          description={`${pageError} Atualize a página ou tente novamente em instantes.`}
          action={
            <Button type="button" onClick={() => void refetchClients()}>
              Tentar novamente
            </Button>
          }
        />
      ) : filteredClients.length === 0 ? (
        hasActiveFilters ? (
          <AdminEmptyState
            variant="filtered"
            icon={Building2}
            title="Nenhum cliente com esses filtros"
            description="A combinação atual de filtros e busca não retornou resultados. Ajuste os critérios para ampliar a carteira visível."
            action={
              <Button type="button" variant="outline" onClick={clearAllFilters}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <AdminEmptyState
            variant="first-time"
            icon={Building2}
            title="Comece sua carteira de clientes"
            description="Cadastre o primeiro cliente para começar a acompanhar contratos, cobranças, projetos e histórico em um só lugar."
            action={
              <Link
                to="/portal/admin/clientes/novo"
                className={buttonVariants({ variant: "default" })}
              >
                Cadastrar cliente
              </Link>
            }
          />
        )
      ) : (
        <div className="space-y-2">
          <ColumnHeader />

          {visibleClients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onToggleActive={handleToggleActive}
              avatarInfo={client.user_id ? avatarMap[client.user_id] : undefined}
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

      <AlertDialog
        open={deactivateTarget !== null}
        destructive
        title="Inativar cliente?"
        description={
          deactivateTarget
            ? `O cliente "${deactivateTarget.full_name}" deixará de aparecer em listagens ativas, relatórios operacionais e filtros padrão. Projetos, contratos, cobranças e histórico continuam preservados. Você pode reativar a qualquer momento.`
            : ""
        }
        confirmLabel="Inativar"
        cancelLabel="Cancelar"
        loading={deactivateLoading}
        loadingLabel="Inativando..."
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
