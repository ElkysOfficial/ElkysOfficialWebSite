import { useCallback, useEffect, useMemo, useState } from "react";

import { Clock, Eye, Shield } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import { Button, Card, CardContent, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatPortalDateTime } from "@/lib/portal";

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

type TeamMember = {
  user_id: string | null;
  full_name: string;
};

type EntityFilter = "all" | "client" | "project" | "charge" | "ticket" | "document" | "other";

const ENTITY_FILTERS: { value: EntityFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "client", label: "Clientes" },
  { value: "project", label: "Projetos" },
  { value: "charge", label: "Cobrancas" },
  { value: "ticket", label: "Tickets" },
  { value: "document", label: "Documentos" },
  { value: "other", label: "Outros" },
];

const ENTITY_TYPE_MAP: Record<string, EntityFilter> = {
  clients: "client",
  client: "client",
  projects: "project",
  project: "project",
  charges: "charge",
  charge: "charge",
  support_tickets: "ticket",
  ticket: "ticket",
  documents: "document",
  document: "document",
};

function getEntityFilterKey(entityType: string): EntityFilter {
  return ENTITY_TYPE_MAP[entityType.toLowerCase()] ?? "other";
}

const ACTION_TONES: Record<string, string> = {
  create: "bg-success/10 text-success",
  insert: "bg-success/10 text-success",
  update: "bg-accent/10 text-accent",
  delete: "bg-destructive/10 text-destructive",
  remove: "bg-destructive/10 text-destructive",
};

function getActionTone(action: string): string {
  const lower = action.toLowerCase();
  for (const [key, tone] of Object.entries(ACTION_TONES)) {
    if (lower.includes(key)) return tone;
  }
  return "bg-muted text-muted-foreground";
}

function JsonDiff({ before, after }: { before: unknown; after: unknown }) {
  const beforeObj = (before && typeof before === "object" ? before : null) as Record<
    string,
    unknown
  > | null;
  const afterObj = (after && typeof after === "object" ? after : null) as Record<
    string,
    unknown
  > | null;

  if (!beforeObj && !afterObj) {
    return <p className="text-xs text-muted-foreground">Sem detalhes disponiveis.</p>;
  }

  const allKeys = new Set([...Object.keys(beforeObj ?? {}), ...Object.keys(afterObj ?? {})]);

  const changes: { field: string; from: unknown; to: unknown }[] = [];
  for (const key of allKeys) {
    const bVal = beforeObj?.[key];
    const aVal = afterObj?.[key];
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      changes.push({ field: key, from: bVal, to: aVal });
    }
  }

  if (changes.length === 0 && afterObj && !beforeObj) {
    return (
      <div className="space-y-1">
        {Object.entries(afterObj)
          .slice(0, 10)
          .map(([key, val]) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 font-medium text-muted-foreground">{key}:</span>
              <span className="text-success">{String(val ?? "—")}</span>
            </div>
          ))}
        {Object.keys(afterObj).length > 10 && (
          <p className="text-[10px] text-muted-foreground">
            +{Object.keys(afterObj).length - 10} campos
          </p>
        )}
      </div>
    );
  }

  if (changes.length === 0) {
    return <p className="text-xs text-muted-foreground">Sem alteracoes detectadas.</p>;
  }

  return (
    <div className="space-y-1.5">
      {changes.slice(0, 10).map((change) => (
        <div key={change.field} className="text-xs">
          <span className="font-medium text-muted-foreground">{change.field}: </span>
          {change.from !== undefined && (
            <span className="text-destructive line-through">{String(change.from ?? "null")}</span>
          )}
          {change.from !== undefined && change.to !== undefined && <span className="mx-1">→</span>}
          {change.to !== undefined && (
            <span className="text-success">{String(change.to ?? "null")}</span>
          )}
        </div>
      ))}
      {changes.length > 10 && (
        <p className="text-[10px] text-muted-foreground">+{changes.length - 10} campos</p>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-14 animate-pulse rounded-2xl border border-border/70 bg-card/70" />
      <div className="h-[500px] animate-pulse rounded-2xl border border-border/70 bg-card/70" />
    </div>
  );
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [logsRes, teamRes] = await Promise.all([
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("team_members").select("user_id, full_name"),
    ]);

    if (logsRes.error) {
      setError(logsRes.error.message);
      setLoading(false);
      return;
    }

    setLogs((logsRes.data ?? []) as AuditLogRow[]);
    setTeamMembers((teamRes.data ?? []) as TeamMember[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const actorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of teamMembers) {
      if (member.user_id) {
        map.set(member.user_id, member.full_name);
      }
    }
    return map;
  }, [teamMembers]);

  const filtered = useMemo(() => {
    if (entityFilter === "all") return logs;
    return logs.filter((log) => getEntityFilterKey(log.entity_type) === entityFilter);
  }, [logs, entityFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <AdminEmptyState
        icon={Shield}
        title="Erro ao carregar log de auditoria"
        description={error}
        action={
          <Button type="button" onClick={() => void loadData()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  if (logs.length === 0) {
    return (
      <AdminEmptyState
        icon={Eye}
        title="Nenhum registro de auditoria"
        description="Quando acoes forem realizadas no painel, o historico aparecera aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="rounded-2xl border-border/80 bg-card/95">
        <CardContent className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Entidade:
          </span>
          <div className="inline-flex flex-wrap rounded-full border border-border/80 bg-background/80 p-1">
            {ENTITY_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setEntityFilter(f.value);
                  setPage(0);
                }}
                className={cn(
                  "min-h-[36px] rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  entityFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} registro(s)</span>
        </CardContent>
      </Card>

      {/* Log entries */}
      <div className="space-y-2">
        {paged.map((log) => {
          const actorName = log.actor_user_id
            ? (actorMap.get(log.actor_user_id) ?? "Usuario desconhecido")
            : "Sistema";
          const isExpanded = expandedId === log.id;

          return (
            <div
              key={log.id}
              className="rounded-xl border border-border/60 bg-card/92 transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/40">
                  <Clock size={14} className="text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{actorName}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        getActionTone(log.action)
                      )}
                    >
                      {log.action}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {log.entity_type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatPortalDateTime(log.created_at)}
                    {log.reason ? ` — ${log.reason}` : ""}
                  </p>
                </div>

                <span
                  className={cn(
                    "shrink-0 text-xs text-muted-foreground transition-transform",
                    isExpanded && "rotate-90"
                  )}
                >
                  ▸
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-border/40 px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Entidade: {log.entity_type} / {log.entity_id.slice(0, 8)}...
                  </p>
                  <JsonDiff before={log.before_data} after={log.after_data} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/92 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-xs font-medium text-foreground">
              {page + 1}/{totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Proximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
