import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AdminEmptyState from "@/components/portal/AdminEmptyState";
import AdminMetricCard from "@/components/portal/AdminMetricCard";
import AddContractLinkForm from "@/components/portal/AddContractLinkForm";
import ContractActionsButtons from "@/components/portal/ContractActionsButtons";
import ContractVersionHistory from "@/components/portal/ContractVersionHistory";
import PortalLoading from "@/components/portal/PortalLoading";
import ProjectSiteLink from "@/components/portal/ProjectSiteLink";
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
  proposal_id: string | null;
};

type ProposalContext = {
  id: string;
  title: string;
  scope_summary: string | null;
  payment_conditions: string | null;
  observations: string | null;
  total_amount: number;
  solution_type: string | null;
  billing_config: Record<string, unknown> | null;
  lead_name: string | null;
  diagnosis: Record<string, string | null> | null;
};

type ClientRef = {
  id: string;
  full_name: string | null;
  client_type: string | null;
  nome_fantasia: string | null;
};

type StatusFilter = "all" | "rascunho" | "em_validacao" | "ativo" | "encerrado" | "cancelado";

const STATUS_META: Record<
  string,
  {
    label: string;
    tone: "primary" | "warning" | "success" | "destructive" | "secondary" | "accent";
  }
> = {
  rascunho: { label: "Rascunho", tone: "secondary" },
  em_validacao: { label: "Em validação", tone: "warning" },
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
  const [contractDocs, setContractDocs] = useState<Map<string, string>>(new Map());
  const [proposalContext, setProposalContext] = useState<Map<string, ProposalContext>>(new Map());
  const [contextExpandedId, setContextExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [contractsRes, docsRes] = await Promise.all([
      // Join via FK: traz projeto e cliente embutidos no contrato.
      // Evita queries separadas que podem falhar por RLS de roles
      // que têm acesso a contratos mas não a projetos/clientes diretamente.
      supabase
        .from("project_contracts")
        .select(
          "id, project_id, client_id, version_no, status, signed_at, starts_at, ends_at, total_amount, scope_summary, payment_model, created_at, projects(id, name, proposal_id), clients(id, full_name, client_type, nome_fantasia)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select("contract_id, url, external_url, created_at")
        .eq("type", "contrato")
        .not("contract_id", "is", null)
        .order("created_at", { ascending: false }),
    ]);
    if (contractsRes.error) {
      setError(contractsRes.error.message);
      setLoading(false);
      return;
    }

    const rawContracts = (contractsRes.data ?? []) as Array<
      ContractRow & {
        projects: ProjectRef | null;
        clients: ClientRef | null;
      }
    >;

    const pMap = new Map<string, ProjectRef>();
    const cMap = new Map<string, ClientRef>();

    const mappedContracts: ContractRow[] = rawContracts.map((row) => {
      if (row.projects) pMap.set(row.projects.id, row.projects);
      if (row.clients) cMap.set(row.clients.id, row.clients);
      const { projects: _p, clients: _c, ...contract } = row;
      return contract;
    });

    setContracts(mappedContracts);
    setProjects(pMap);
    setClients(cMap);

    // Documents: mantem apenas o mais recente por contract_id (ordenado desc).
    const dMap = new Map<string, string>();
    for (const d of (docsRes.data ?? []) as Array<{
      contract_id: string | null;
      url: string | null;
      external_url: string | null;
    }>) {
      if (!d.contract_id || dMap.has(d.contract_id)) continue;
      const href = d.external_url ?? d.url;
      if (href) dMap.set(d.contract_id, href);
    }
    setContractDocs(dMap);

    // Carregar contexto comercial: propostas vinculadas via project.proposal_id
    const proposalIds = Array.from(pMap.values())
      .map((p) => p.proposal_id)
      .filter((id): id is string => !!id);

    if (proposalIds.length > 0) {
      const { data: proposalsData } = await supabase
        .from("proposals")
        .select(
          "id, title, scope_summary, payment_conditions, observations, total_amount, solution_type, billing_config, lead_id"
        )
        .in("id", proposalIds);

      const leadIds = (proposalsData ?? [])
        .map((p: { lead_id: string | null }) => p.lead_id)
        .filter((id): id is string => !!id);

      let leadsMap = new Map<
        string,
        { name: string; diagnosis: Record<string, string | null> | null }
      >();
      if (leadIds.length > 0) {
        const { data: leadsData } = await supabase
          .from("leads")
          .select("id, name, diagnosis")
          .in("id", leadIds);
        leadsMap = new Map(
          (leadsData ?? []).map(
            (l: { id: string; name: string; diagnosis: Record<string, string | null> | null }) => [
              l.id,
              { name: l.name, diagnosis: l.diagnosis },
            ]
          )
        );
      }

      const ctxMap = new Map<string, ProposalContext>();
      for (const p of (proposalsData ?? []) as Array<{
        id: string;
        title: string;
        scope_summary: string | null;
        payment_conditions: string | null;
        observations: string | null;
        total_amount: number;
        solution_type: string | null;
        billing_config: Record<string, unknown> | null;
        lead_id: string | null;
      }>) {
        const lead = p.lead_id ? leadsMap.get(p.lead_id) : null;
        ctxMap.set(p.id, {
          ...p,
          lead_name: lead?.name ?? null,
          diagnosis: lead?.diagnosis ?? null,
        });
      }
      setProposalContext(ctxMap);
    }

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
          {(
            ["all", "ativo", "em_validacao", "rascunho", "encerrado", "cancelado"] as StatusFilter[]
          ).map((status) => (
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
          ))}
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
            const contractDocUrl = contractDocs.get(contract.id);
            const proposalCtx = project?.proposal_id
              ? proposalContext.get(project.proposal_id)
              : null;
            const isContextExpanded = contextExpandedId === contract.id;
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
                      {contractDocUrl ? (
                        <div className="mt-2">
                          <ProjectSiteLink url={contractDocUrl} label="Ver contrato" />
                        </div>
                      ) : null}
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

                  {/* Contexto comercial — diagnóstico + proposta */}
                  {proposalCtx && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setContextExpandedId(isContextExpanded ? null : contract.id)}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        {isContextExpanded
                          ? "Ocultar contexto comercial"
                          : "Ver contexto comercial"}
                      </button>

                      {isContextExpanded && (
                        <div className="space-y-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                            Contexto da negociação
                          </p>

                          {proposalCtx.lead_name && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                Lead de origem
                              </p>
                              <p className="text-xs text-foreground">{proposalCtx.lead_name}</p>
                            </div>
                          )}

                          {proposalCtx.diagnosis && (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {proposalCtx.diagnosis.context && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Contexto
                                  </p>
                                  <p className="text-xs text-foreground">
                                    {proposalCtx.diagnosis.context}
                                  </p>
                                </div>
                              )}
                              {proposalCtx.diagnosis.problem && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Problema
                                  </p>
                                  <p className="text-xs text-foreground">
                                    {proposalCtx.diagnosis.problem}
                                  </p>
                                </div>
                              )}
                              {proposalCtx.diagnosis.objective && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Objetivo
                                  </p>
                                  <p className="text-xs text-foreground">
                                    {proposalCtx.diagnosis.objective}
                                  </p>
                                </div>
                              )}
                              {proposalCtx.diagnosis.business_impact && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Impacto no negócio
                                  </p>
                                  <p className="text-xs text-foreground">
                                    {proposalCtx.diagnosis.business_impact}
                                  </p>
                                </div>
                              )}
                              {proposalCtx.diagnosis.constraints && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Restrições
                                  </p>
                                  <p className="text-xs text-foreground">
                                    {proposalCtx.diagnosis.constraints}
                                  </p>
                                </div>
                              )}
                              {proposalCtx.diagnosis.urgency && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Urgência
                                  </p>
                                  <p className="text-xs text-foreground capitalize">
                                    {proposalCtx.diagnosis.urgency}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {proposalCtx.payment_conditions && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                Condições de pagamento
                              </p>
                              <p className="text-xs text-foreground">
                                {proposalCtx.payment_conditions}
                              </p>
                            </div>
                          )}

                          {proposalCtx.observations && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                Observações
                              </p>
                              <p className="text-xs text-foreground">{proposalCtx.observations}</p>
                            </div>
                          )}

                          <div className="pt-1">
                            <Link
                              to={`/portal/admin/propostas/${proposalCtx.id}`}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Abrir proposta completa
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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

                  <div className="flex flex-wrap items-center gap-2">
                    <ContractActionsButtons
                      contractId={contract.id}
                      clientId={contract.client_id}
                      projectName={project?.name ?? "Projeto"}
                      scopeSummary={contract.scope_summary}
                      status={contract.status}
                      onTransitioned={() => void loadAll()}
                    />
                    <AddContractLinkForm
                      contractId={contract.id}
                      projectId={contract.project_id}
                      clientId={contract.client_id}
                      versionNo={contract.version_no}
                      existingUrl={contractDocUrl ?? null}
                      onSaved={() => void loadAll()}
                    />
                  </div>

                  {isExpanded ? (
                    <ContractVersionHistory
                      contractId={contract.id}
                      clientId={contract.client_id}
                      projectName={project?.name}
                      scopeSummary={contract.scope_summary}
                    />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
