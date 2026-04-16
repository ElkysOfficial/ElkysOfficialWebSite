import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AgileMono, Clock, FileText, Shield, Target } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/admin/AdminEmptyState";
import PortalLoading from "@/components/portal/shared/PortalLoading";
import StatusBadge from "@/components/portal/shared/StatusBadge";
import { Button, Card, CardContent, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL, getLocalDateIso } from "@/lib/masks";
import {
  PROJECT_STATUS_META,
  formatPortalDate,
  getClientDisplayName,
  getProjectCurrentPhase,
} from "@/lib/portal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  | "id"
  | "client_id"
  | "name"
  | "status"
  | "current_stage"
  | "expected_delivery_date"
  | "started_at"
  | "delivered_at"
  | "solution_type"
>;

type ProposalRow = Pick<
  Database["public"]["Tables"]["proposals"]["Row"],
  "id" | "client_id" | "lead_id" | "title" | "status" | "total_amount" | "sent_at" | "created_at"
>;

type ClientRow = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "full_name" | "client_type" | "nome_fantasia"
>;

type LeadRow = Pick<Database["public"]["Tables"]["leads"]["Row"], "id" | "name" | "company">;

/* A unified pipeline item can be a project or a proposal */
type PipelineItem =
  | {
      kind: "project";
      id: string;
      name: string;
      clientLabel: string;
      status: string;
      solutionType: string | null;
      stageLabel: string;
      dateLabel: string | null;
      isOverdue: boolean;
      link: string;
    }
  | {
      kind: "proposal";
      id: string;
      name: string;
      clientLabel: string;
      status: string;
      value: number;
      dateLabel: string | null;
      link: string;
    };

type ColumnKey = "negociacao" | "em_andamento" | "pausado" | "concluido";

const COLUMNS: {
  key: ColumnKey;
  label: string;
  tone: "secondary" | "accent" | "warning" | "success";
}[] = [
  { key: "negociacao", label: "Negociacao", tone: "secondary" },
  { key: "em_andamento", label: "Em desenvolvimento", tone: "accent" },
  { key: "pausado", label: "Pausado", tone: "warning" },
  { key: "concluido", label: "Concluido", tone: "success" },
];

const COLUMN_ACCENT: Record<ColumnKey, string> = {
  negociacao: "border-t-secondary",
  em_andamento: "border-t-accent",
  pausado: "border-t-warning",
  concluido: "border-t-success",
};

const COLUMN_COUNT_BG: Record<ColumnKey, string> = {
  negociacao: "bg-secondary/15 text-secondary-foreground",
  em_andamento: "bg-accent/15 text-accent",
  pausado: "bg-warning/15 text-warning",
  concluido: "bg-success/15 text-success",
};

const PROPOSAL_STATUS_TONE: Record<string, "accent" | "success"> = {
  enviada: "accent",
  aprovada: "success",
};

/* ------------------------------------------------------------------ */
/*  Card components                                                    */
/* ------------------------------------------------------------------ */

function ProjectCard({ item }: { item: Extract<PipelineItem, { kind: "project" }> }) {
  const statusMeta = PROJECT_STATUS_META[item.status as keyof typeof PROJECT_STATUS_META];

  return (
    <Link
      to={item.link}
      className="block rounded-xl border border-border/60 bg-background/70 p-3 transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
            {item.name}
          </h4>
          {item.isOverdue && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
              <Clock size={10} />
              Atrasado
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{item.clientLabel}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          {statusMeta && <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />}
          {item.solutionType && <StatusBadge label={item.solutionType} tone="muted" />}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Etapa: {item.stageLabel}</span>
          {item.dateLabel && <span>Prev: {item.dateLabel}</span>}
        </div>
      </div>
    </Link>
  );
}

function ProposalCard({ item }: { item: Extract<PipelineItem, { kind: "proposal" }> }) {
  const tone = PROPOSAL_STATUS_TONE[item.status] ?? "accent";
  const statusLabel = item.status === "enviada" ? "Proposta Enviada" : "Proposta Aprovada";

  return (
    <Link
      to={item.link}
      className="block rounded-xl border border-primary/30 bg-primary/[0.03] p-3 transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
            {item.name}
          </h4>
          <FileText size={14} className="shrink-0 text-primary/60" />
        </div>

        <p className="text-xs text-muted-foreground">{item.clientLabel}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge label={statusLabel} tone={tone} />
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{formatBRL(item.value)}</span>
          {item.dateLabel && <span>{item.dateLabel}</span>}
        </div>
      </div>
    </Link>
  );
}

function PipelineCard({ item }: { item: PipelineItem }) {
  if (item.kind === "project") return <ProjectCard item={item} />;
  return <ProposalCard item={item} />;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function Pipeline() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [projectsRes, proposalsRes, clientsRes, leadsRes] = await Promise.all([
      supabase
        .from("projects")
        .select(
          "id, client_id, name, status, current_stage, expected_delivery_date, started_at, delivered_at, solution_type"
        )
        .neq("status", "cancelado"),
      supabase
        .from("proposals")
        .select("id, client_id, lead_id, title, status, total_amount, sent_at, created_at")
        .in("status", ["enviada", "aprovada"]),
      supabase.from("clients").select("id, full_name, client_type, nome_fantasia"),
      supabase.from("leads").select("id, name, company"),
    ]);

    const hardError = projectsRes.error ?? proposalsRes.error ?? clientsRes.error ?? leadsRes.error;
    if (hardError) {
      setError(hardError.message);
      setLoading(false);
      return;
    }

    const projectsData = (projectsRes.data ?? []) as ProjectRow[];
    const proposalsData = (proposalsRes.data ?? []) as ProposalRow[];
    const clientsData = (clientsRes.data ?? []) as ClientRow[];
    const leadsData = (leadsRes.data ?? []) as LeadRow[];

    const clientMap = new Map(clientsData.map((c) => [c.id, c]));
    const leadMap = new Map(leadsData.map((l) => [l.id, l]));
    const todayStr = getLocalDateIso();

    // Check which proposals already have a linked project (avoid duplicates)
    const linkedProposalIds = new Set(
      projectsData
        .map((p) => (p as Record<string, unknown>).proposal_id as string | null)
        .filter(Boolean)
    );

    const merged: PipelineItem[] = [];

    // Add projects
    for (const project of projectsData) {
      const client = clientMap.get(project.client_id);
      merged.push({
        kind: "project",
        id: project.id,
        name: project.name,
        clientLabel: client ? getClientDisplayName(client) : "Cliente desconhecido",
        status: project.status,
        solutionType: project.solution_type,
        stageLabel: getProjectCurrentPhase(project),
        dateLabel: project.expected_delivery_date
          ? formatPortalDate(project.expected_delivery_date)
          : null,
        isOverdue:
          project.status === "em_andamento" &&
          !!project.expected_delivery_date &&
          project.expected_delivery_date < todayStr &&
          !project.delivered_at,
        link: `/portal/admin/projetos/${project.id}`,
      });
    }

    // Add proposals that don't already have a linked project
    for (const proposal of proposalsData) {
      if (linkedProposalIds.has(proposal.id)) continue;

      let clientLabel = "—";
      if (proposal.client_id) {
        const client = clientMap.get(proposal.client_id);
        clientLabel = client ? getClientDisplayName(client) : "Cliente removido";
      } else if (proposal.lead_id) {
        const lead = leadMap.get(proposal.lead_id);
        clientLabel = lead
          ? lead.company
            ? `${lead.name} (${lead.company})`
            : lead.name
          : "Lead removido";
      }

      merged.push({
        kind: "proposal",
        id: proposal.id,
        name: proposal.title,
        clientLabel,
        status: proposal.status,
        value: Number(proposal.total_amount),
        dateLabel: proposal.sent_at ? `Enviada: ${formatPortalDate(proposal.sent_at)}` : null,
        link: `/portal/admin/propostas/${proposal.id}`,
      });
    }

    setItems(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const grouped = useMemo(() => {
    const map: Record<ColumnKey, PipelineItem[]> = {
      negociacao: [],
      em_andamento: [],
      pausado: [],
      concluido: [],
    };

    for (const item of items) {
      if (item.kind === "project") {
        const key = item.status as ColumnKey;
        if (key in map) {
          map[key].push(item);
        }
      } else {
        // Proposals go to negociacao column (they represent active negotiations)
        map.negociacao.push(item);
      }
    }

    return map;
  }, [items]);

  const totalCount = items.length;

  if (loading) return <PortalLoading />;

  if (error) {
    return (
      <AdminEmptyState
        icon={Target}
        title="Erro ao carregar pipeline"
        description={error}
        action={
          <Button type="button" onClick={() => void loadData()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  if (totalCount === 0) {
    return (
      <AdminEmptyState
        icon={AgileMono}
        title="Nenhum item no pipeline"
        description="Cadastre projetos ou envie propostas para visualizar o pipeline comercial."
        action={
          <Button asChild>
            <Link to="/portal/admin/projetos/novo">Novo projeto</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <Card className="rounded-2xl border-border/80 bg-card/95">
        <CardContent className="flex flex-wrap items-center gap-4 p-3 sm:p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {totalCount} item(ns) no pipeline
          </span>
          <span className="h-4 w-px bg-border/60" />
          {COLUMNS.map((col) => (
            <span key={col.key} className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                  COLUMN_COUNT_BG[col.key]
                )}
              >
                {grouped[col.key].length}
              </span>
              <span className="text-muted-foreground">{col.label}</span>
            </span>
          ))}
        </CardContent>
      </Card>

      {/* Kanban board */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={cn(
              "flex flex-col rounded-2xl border border-border/70 border-t-[3px] bg-card/60",
              COLUMN_ACCENT[col.key]
            )}
          >
            {/* Column header */}
            <div className="flex items-center justify-between p-3 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {col.label}
              </h3>
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                  COLUMN_COUNT_BG[col.key]
                )}
              >
                {grouped[col.key].length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 px-2 pb-3">
              {grouped[col.key].length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl bg-muted/20 p-6">
                  <p className="text-center text-xs text-muted-foreground">Nenhum projeto</p>
                </div>
              ) : (
                grouped[col.key].map((item) => <PipelineCard key={item.id} item={item} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
