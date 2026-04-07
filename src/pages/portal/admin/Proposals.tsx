import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { FileText, Search, Shield, TrendingUp, Wallet } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import AdminMetricCard from "@/components/portal/AdminMetricCard";
import ExportMenu from "@/components/portal/ExportMenu";
import StatusBadge from "@/components/portal/StatusBadge";
import { AlertDialog, Button, Card, CardContent, Input, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { exportCSV, exportPDF, type ExportColumn } from "@/lib/export";
import { formatBRL } from "@/lib/masks";
import { formatPortalDate } from "@/lib/portal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];
type ClientRow = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "full_name" | "client_type" | "nome_fantasia"
>;
type LeadRow = Pick<Database["public"]["Tables"]["leads"]["Row"], "id" | "name" | "company">;

type ProposalStatus = "rascunho" | "enviada" | "aprovada" | "rejeitada" | "expirada";
type StatusFilter = "all" | ProposalStatus;

const PROPOSAL_STATUS_META: Record<
  ProposalStatus,
  { label: string; tone: "accent" | "success" | "warning" | "destructive" | "secondary" }
> = {
  rascunho: { label: "Rascunho", tone: "secondary" },
  enviada: { label: "Enviada", tone: "accent" },
  aprovada: { label: "Aprovada", tone: "success" },
  rejeitada: { label: "Rejeitada", tone: "destructive" },
  expirada: { label: "Expirada", tone: "warning" },
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "enviada", label: "Enviada" },
  { value: "aprovada", label: "Aprovada" },
  { value: "rejeitada", label: "Rejeitada" },
  { value: "expirada", label: "Expirada" },
];

const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getClientDisplayName(client: ClientRow): string {
  if (client.client_type === "pj" && client.nome_fantasia) return client.nome_fantasia;
  return client.full_name;
}

function getDestinationName(
  proposal: ProposalRow,
  clientsMap: Record<string, ClientRow>,
  leadsMap: Record<string, LeadRow>
): string {
  if (proposal.client_id) {
    const client = clientsMap[proposal.client_id];
    return client ? getClientDisplayName(client) : "Cliente removido";
  }
  if (proposal.lead_id) {
    const lead = leadsMap[proposal.lead_id];
    return lead ? (lead.company ? `${lead.name} (${lead.company})` : lead.name) : "Lead removido";
  }
  return "—";
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
/*  Column header                                                      */
/* ------------------------------------------------------------------ */

function ColumnHeader() {
  return (
    <div className="hidden md:grid md:grid-cols-[1fr_180px_120px_120px_110px_110px_40px] gap-x-4 px-5 pb-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Cliente / Lead
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Titulo
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Valor
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Status
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Validade
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Criada em
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Proposal row                                                       */
/* ------------------------------------------------------------------ */

function ProposalRow({
  proposal,
  destinationName,
  onDelete,
}: {
  proposal: ProposalRow;
  destinationName: string;
  onDelete: (proposal: ProposalRow) => void;
}) {
  const navigate = useNavigate();
  const meta =
    PROPOSAL_STATUS_META[(proposal.status as ProposalStatus) ?? "rascunho"] ??
    PROPOSAL_STATUS_META.rascunho;

  const actions: { label: string; onClick: () => void; destructive?: boolean }[] = [
    {
      label: "Ver detalhes",
      onClick: () => navigate(`/portal/admin/propostas/${proposal.id}`),
    },
    {
      label: "Excluir proposta",
      onClick: () => onDelete(proposal),
      destructive: true,
    },
  ];

  return (
    <div className="group grid grid-cols-1 items-center gap-x-4 gap-y-2 rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-all hover:border-primary/25 hover:bg-card sm:px-5 sm:py-4 md:grid-cols-[1fr_180px_120px_120px_110px_110px_40px] md:gap-y-3">
      {/* Col 1 — Client/Lead */}
      <div className="flex items-start justify-between gap-2 md:contents">
        <Link to={`/portal/admin/propostas/${proposal.id}`} className="min-w-0">
          <p className="truncate text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-[15px]">
            {destinationName}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground md:hidden">
            {proposal.title}
          </p>
        </Link>

        {/* Mobile actions */}
        <div className="shrink-0 md:hidden">
          <RowActionMenu actions={actions} />
        </div>
      </div>

      {/* Mobile: secondary info */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:hidden">
        <StatusBadge label={meta.label} tone={meta.tone} />
        <span className="text-xs font-medium text-foreground">
          {formatBRL(proposal.total_amount)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatPortalDate(proposal.valid_until)}
        </span>
      </div>

      {/* Col 2 — Title (desktop) */}
      <p className="hidden truncate text-sm text-foreground md:block">{proposal.title}</p>

      {/* Col 3 — Valor (desktop) */}
      <p className="hidden text-sm font-medium text-foreground md:block">
        {formatBRL(proposal.total_amount)}
      </p>

      {/* Col 4 — Status (desktop) */}
      <div className="hidden md:block">
        <StatusBadge label={meta.label} tone={meta.tone} />
      </div>

      {/* Col 5 — Validade (desktop) */}
      <p className="hidden text-sm text-muted-foreground md:block">
        {formatPortalDate(proposal.valid_until)}
      </p>

      {/* Col 6 — Criada em (desktop) */}
      <p className="hidden text-sm text-muted-foreground md:block">
        {formatPortalDate(proposal.created_at?.slice(0, 10))}
      </p>

      {/* Col 7 — Actions (desktop) */}
      <div className="hidden md:block">
        <RowActionMenu actions={actions} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function Proposals() {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, ClientRow>>({});
  const [leadsMap, setLeadsMap] = useState<Record<string, LeadRow>>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [proposalToDelete, setProposalToDelete] = useState<ProposalRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Data fetching ── */

  const loadData = useCallback(
    async (background = false) => {
      if (!background || !hasLoaded) {
        setLoading(true);
        setPageError(null);
      }

      const [proposalsRes, clientsRes, leadsRes] = await Promise.all([
        supabase.from("proposals").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("id, full_name, client_type, nome_fantasia"),
        supabase.from("leads").select("id, name, company"),
      ]);

      const queryError = proposalsRes.error ?? clientsRes.error ?? leadsRes.error;

      if (queryError) {
        if (!hasLoaded) {
          setPageError(queryError.message);
          setLoading(false);
        }
        return;
      }

      setProposals((proposalsRes.data as ProposalRow[] | null) ?? []);

      setClientsMap(
        Object.fromEntries(((clientsRes.data as ClientRow[] | null) ?? []).map((c) => [c.id, c]))
      );

      setLeadsMap(
        Object.fromEntries(((leadsRes.data as LeadRow[] | null) ?? []).map((l) => [l.id, l]))
      );

      setHasLoaded(true);
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadData(true);
    };

    void loadData();

    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, statusFilter]);

  /* ── Derived data ── */

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const name = getDestinationName(p, clientsMap, leadsMap);
      const matchesSearch =
        deferredSearch.length === 0 ||
        name.toLowerCase().includes(deferredSearch) ||
        p.title.toLowerCase().includes(deferredSearch);

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [proposals, clientsMap, leadsMap, deferredSearch, statusFilter]);

  const visibleProposals = filteredProposals.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / PAGE_SIZE));

  const metrics = useMemo(() => {
    const total = proposals.length;
    const emNegociacaoValue = proposals
      .filter((p) => p.status === "enviada" || p.status === "aprovada")
      .reduce((sum, p) => sum + p.total_amount, 0);
    const aprovadas = proposals.filter((p) => p.status === "aprovada").length;
    const decided = proposals.filter(
      (p) => p.status === "aprovada" || p.status === "rejeitada"
    ).length;
    const taxaAprovacao = decided > 0 ? Math.round((aprovadas / decided) * 100) : 0;

    return { total, emNegociacaoValue, taxaAprovacao };
  }, [proposals]);

  const exportColumns: ExportColumn[] = [
    { key: "destination", label: "Cliente / Lead" },
    { key: "title", label: "Titulo" },
    { key: "value", label: "Valor", align: "right" },
    { key: "status", label: "Status" },
    { key: "validUntil", label: "Validade" },
    { key: "createdAt", label: "Criada em" },
  ];

  const exportRows = filteredProposals.map((p) => ({
    destination: getDestinationName(p, clientsMap, leadsMap),
    title: p.title,
    value: formatBRL(p.total_amount),
    status: PROPOSAL_STATUS_META[(p.status as ProposalStatus) ?? "rascunho"]?.label ?? p.status,
    validUntil: formatPortalDate(p.valid_until),
    createdAt: formatPortalDate(p.created_at?.slice(0, 10)),
  }));

  const handleExportCSV = () =>
    exportCSV({
      title: "Propostas",
      filename: "propostas",
      columns: exportColumns,
      rows: exportRows,
    });
  const handleExportPDF = () =>
    exportPDF({
      title: "Relatorio de Propostas",
      subtitle: `${filteredProposals.length} propostas | Em negociacao: ${formatBRL(metrics.emNegociacaoValue)}`,
      filename: "propostas",
      columns: exportColumns,
      rows: exportRows,
    });

  const handleDeleteProposal = async () => {
    if (!proposalToDelete) return;
    setDeleteLoading(true);

    try {
      const { error } = await supabase.from("proposals").delete().eq("id", proposalToDelete.id);

      if (error) throw error;

      setProposals((prev) => prev.filter((p) => p.id !== proposalToDelete.id));
      toast.success("Proposta excluida com sucesso.");
      setProposalToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao excluir proposta: ${message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Render ── */

  const deleteDisplayName = proposalToDelete?.title ?? "";

  return (
    <div className="space-y-8">
      <AlertDialog
        open={proposalToDelete !== null}
        title="Excluir proposta"
        description={`Tem certeza que deseja excluir "${deleteDisplayName}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        loading={deleteLoading}
        loadingLabel="Excluindo..."
        onConfirm={() => void handleDeleteProposal()}
        onCancel={() => setProposalToDelete(null)}
      />

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Propostas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {metrics.total} proposta{metrics.total !== 1 ? "s" : ""} registrada
            {metrics.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Link to="/portal/admin/propostas/nova">
            <Button type="button">Nova proposta</Button>
          </Link>
        </div>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 xl:grid-cols-3">
        <AdminMetricCard
          label="Total propostas"
          value={metrics.total.toString()}
          icon={FileText}
          tone="primary"
        />
        <AdminMetricCard
          label="Valor em negociacao"
          value={formatBRL(metrics.emNegociacaoValue)}
          hint="Propostas com status enviada"
          icon={Wallet}
          tone="accent"
        />
        <AdminMetricCard
          label="Taxa aprovacao"
          value={`${metrics.taxaAprovacao}%`}
          hint="Aprovadas / (Aprovadas + Rejeitadas)"
          icon={TrendingUp}
          tone="success"
        />
      </div>

      {/* ── Status filter pills ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, lead ou titulo..."
          className="pl-9"
        />
      </div>

      {/* ── Proposals list ── */}
      {loading && !hasLoaded ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-xl border border-border/50 bg-card/60"
            />
          ))}
        </div>
      ) : pageError ? (
        <AdminEmptyState
          icon={FileText}
          title="Nao foi possivel carregar as propostas"
          description={`${pageError} Atualize a pagina ou tente novamente em instantes.`}
          action={
            <Button type="button" onClick={() => void loadData()}>
              Tentar novamente
            </Button>
          }
        />
      ) : filteredProposals.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="Nenhuma proposta encontrada"
          description="Ajuste os filtros ou crie uma nova proposta."
          action={
            <Link to="/portal/admin/propostas/nova">
              <Button type="button">Criar proposta</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          <ColumnHeader />

          {visibleProposals.map((proposal) => (
            <ProposalRow
              key={proposal.id}
              proposal={proposal}
              destinationName={getDestinationName(proposal, clientsMap, leadsMap)}
              onDelete={setProposalToDelete}
            />
          ))}

          {/* ── Pagination ── */}
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
