import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AdminEmptyState from "@/components/portal/AdminEmptyState";
import AdminMetricCard from "@/components/portal/AdminMetricCard";
import ContractActionsButtons from "@/components/portal/ContractActionsButtons";
import ContractVersionHistory from "@/components/portal/ContractVersionHistory";
import PortalLoading from "@/components/portal/PortalLoading";
import StatusBadge from "@/components/portal/StatusBadge";
import { Card, CardContent, Input, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/masks";
import { formatPortalDate, getClientDisplayName } from "@/lib/portal";
import { FileText, Shield, TrendingUp } from "@/assets/icons";

type ContractRow = Pick<
  Database["public"]["Tables"]["project_contracts"]["Row"],
  | "id"
  | "project_id"
  | "client_id"
  | "version_no"
  | "status"
  | "signed_at"
  | "starts_at"
  | "ends_at"
  | "total_amount"
  | "scope_summary"
  | "payment_model"
  | "created_at"
>;

type ProjectRef = {
  id: string;
  name: string;
};

type ClientRef = {
  id: string;
  full_name: string | null;
  client_type: string | null;
  nome_fantasia: string | null;
};

type StatusFilter = "all" | "rascunho" | "ativo" | "encerrado" | "cancelado";

const STATUS_META: Record<
  string,
  { label: string; tone: "primary" | "warning" | "success" | "destructive" | "secondary" }
> = {
  rascunho: { label: "Rascunho", tone: "secondary" },
  ativo: { label: "Ativo", tone: "success" },
  encerrado: { label: "Encerrado", tone: "primary" },
  cancelado: { label: "Cancelado", tone: "destructive" },
};

const PAYMENT_MODEL_LABEL: Record<string, string> = {
  "50_50": "50/50",
  a_vista: "À vista",
  personalizado: "Personalizado",
};

/**
 * Tela do dominio Juridico: lista todos os contratos do sistema com
 * filtros por status e busca por cliente/projeto. Cada linha pode expandir
 * para mostrar o historico de versoes (project_contract_history).
 *
 * Owner: dominio Juridico. Le project_contracts (a UI de criacao continua
 * em ProjectCreate / ProposalDetail — esta tela e gestao/leitura).
 */
export default function Contracts() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [projects, setProjects] = useState<Map<string, ProjectRef>>(new Map());
  const [clients, setClients] = useState<Map<string, ClientRef>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [contractsRes, projectsRes, clientsRes] = await Promise.all([
      supabase
        .from("project_contracts")
        .select(
          "id, project_id, client_id, version_no, status, signed_at, starts_at, ends_at, total_amount, scope_summary, payment_model, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name"),
      supabase.from("clients").select("id, full_name, client_type, nome_fantasia"),
    ]);
    const queryError = contractsRes.error ?? projectsRes.error ?? clientsRes.error;
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }
    setContracts((contractsRes.data ?? []) as ContractRow[]);
    const pMap = new Map<string, ProjectRef>();
    for (const p of (projectsRes.data ?? []) as ProjectRef[]) pMap.set(p.id, p);
    setProjects(pMap);
    const cMap = new Map<string, ClientRef>();
    for (const c of (clientsRes.data ?? []) as ClientRef[]) cMap.set(c.id, c);
    setClients(cMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contracts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!term) return true;
      const project = projects.get(c.project_id);
      const client = clients.get(c.client_id);
      const haystack = [
        project?.name ?? "",
        client ? getClientDisplayName(client) : "",
        c.scope_summary ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [contracts, projects, clients, statusFilter, search]);

  const totals = useMemo(() => {
    const total = filtered.reduce((sum, c) => sum + Number(c.total_amount ?? 0), 0);
    const active = filtered.filter((c) => c.status === "ativo").length;
    const draft = filtered.filter((c) => c.status === "rascunho").length;
    return { total, active, draft, count: filtered.length };
  }, [filtered]);

  if (loading) return <PortalLoading />;

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-destructive">Erro ao carregar contratos</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <AdminMetricCard
          label="Contratos no filtro"
          value={String(totals.count)}
          icon={FileText}
          tone="primary"
        />
        <AdminMetricCard
          label="Ativos"
          value={String(totals.active)}
          icon={Shield}
          tone="success"
        />
        <AdminMetricCard
          label="Rascunhos"
          value={String(totals.draft)}
          icon={FileText}
          tone="warning"
        />
        <AdminMetricCard
          label="Valor total"
          value={formatBRL(totals.total)}
          icon={TrendingUp}
          tone="accent"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por projeto, cliente ou escopo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {(["all", "ativo", "rascunho", "encerrado", "cancelado"] as StatusFilter[]).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === status
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {status === "all" ? "Todos" : (STATUS_META[status]?.label ?? status)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="Nenhum contrato encontrado"
          description={
            search || statusFilter !== "all"
              ? "Ajuste os filtros para ver mais contratos."
              : "Contratos aparecem aqui quando uma proposta é aprovada ou um projeto é criado."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((contract) => {
            const project = projects.get(contract.project_id);
            const client = clients.get(contract.client_id);
            const meta = contract.status ? STATUS_META[contract.status] : undefined;
            const isExpanded = expandedId === contract.id;
            return (
              <Card key={contract.id} className="border-border/70 bg-card/95">
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {project ? (
                          <Link
                            to={`/portal/admin/projetos/${project.id}`}
                            className="text-sm font-semibold text-foreground hover:underline"
                          >
                            {project.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-muted-foreground">
                            Projeto removido
                          </span>
                        )}
                        {meta ? <StatusBadge label={meta.label} tone={meta.tone} /> : null}
                        <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          v{contract.version_no}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {client ? getClientDisplayName(client) : "Cliente desconhecido"} ·{" "}
                        {contract.payment_model
                          ? (PAYMENT_MODEL_LABEL[contract.payment_model] ?? contract.payment_model)
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums text-foreground">
                        {formatBRL(Number(contract.total_amount ?? 0))}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {contract.signed_at
                          ? `Assinado em ${formatPortalDate(contract.signed_at)}`
                          : "Não assinado"}
                      </p>
                    </div>
                  </div>

                  {contract.scope_summary ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {contract.scope_summary}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
                    <div className="text-[11px] text-muted-foreground">
                      Vigência: {contract.starts_at ?? "—"} → {contract.ends_at ?? "—"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {isExpanded ? "Ocultar histórico" : "Ver histórico de versões"}
                    </button>
                  </div>

                  <ContractActionsButtons
                    contractId={contract.id}
                    status={contract.status}
                    onTransitioned={() => void loadAll()}
                  />

                  {isExpanded ? <ContractVersionHistory contractId={contract.id} /> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
