import { type ComponentType, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CheckCircle, Clock, Headphones, type IconProps, Search, Send } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import PortalLoading from "@/components/portal/PortalLoading";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { TicketStatus } from "@/lib/portal";
import { TICKET_STATUS_META } from "@/lib/portal";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: TicketStatus;
  category: string;
  created_at: string;
  client_id: string;
  project_id?: string | null;
  client_name?: string;
  client_email?: string;
  project_name?: string;
  rating: number | null;
  rating_feedback: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_role: "admin" | "client";
  author_name: string;
  body: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  aberto: { label: TICKET_STATUS_META.aberto.label, className: "bg-warning/10 text-warning" },
  em_andamento: {
    label: TICKET_STATUS_META.em_andamento.label,
    className: "bg-primary/10 text-primary",
  },
  resolvido: { label: TICKET_STATUS_META.resolvido.label, className: "bg-success/10 text-success" },
  fechado: { label: TICKET_STATUS_META.fechado.label, className: "bg-muted text-muted-foreground" },
};

const STATUS_ORDER: TicketStatus[] = ["aberto", "em_andamento", "resolvido", "fechado"];

type StatusFilter = "all" | TicketStatus;

/* ------------------------------------------------------------------ */
/*  MetricTile                                                         */
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminSupport() {
  const { user, isSupport, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const supportOnlyView = isSupport && !isAdmin;

  // Messaging state
  const [messagesMap, setMessagesMap] = useState<Record<string, TicketMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  // Derive admin display name for messages
  const adminName =
    (user?.user_metadata?.full_name as string | undefined) || user?.email || "Equipe";

  /* ── Load tickets ─────────────────────────────────────────────── */

  const loadTickets = useCallback(
    async (background = false) => {
      if (!background || !hasLoaded) {
        setLoading(true);
        setPageError(null);
      }

      let query = supabase
        .from("support_tickets")
        .select("*, clients(full_name, email, nome_fantasia), projects(name)")
        .order("created_at", { ascending: false });

      if (supportOnlyView) {
        query = query.eq("status", "aberto");
      }

      const { data, error } = await query;

      if (error) {
        if (!hasLoaded) {
          setPageError(error.message);
          setLoading(false);
        }
        return;
      }

      const mapped: Ticket[] = (data ?? []).map((t: Record<string, unknown>) => {
        const client = t["clients"] as {
          full_name?: string;
          email?: string;
          nome_fantasia?: string;
        } | null;
        const project = t["projects"] as { name?: string } | null;
        return {
          id: t["id"] as string,
          subject: t["subject"] as string,
          body: t["body"] as string,
          status: t["status"] as TicketStatus,
          created_at: t["created_at"] as string,
          client_id: t["client_id"] as string,
          project_id: (t["project_id"] as string | null | undefined) ?? null,
          client_name: client?.nome_fantasia || client?.full_name || "Cliente",
          client_email: client?.email || "",
          rating: (t["rating"] as number | null) ?? null,
          rating_feedback: (t["rating_feedback"] as string | null) ?? null,
          project_name: project?.name || "",
          category: (t["category"] as string) || "outro",
          first_response_at: (t["first_response_at"] as string | null) ?? null,
          resolved_at: (t["resolved_at"] as string | null) ?? null,
        };
      });

      setTickets(mapped);
      setHasLoaded(true);
      setLoading(false);
    },
    [hasLoaded, supportOnlyView]
  );

  useEffect(() => {
    void loadTickets();

    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void loadTickets(true);
    };

    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadTickets]);

  /* ── Load messages for a ticket ──────────────────────────────── */

  const loadMessages = useCallback(
    async (ticketId: string) => {
      if (loadingMessages[ticketId]) return;

      setLoadingMessages((prev) => ({ ...prev, [ticketId]: true }));
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      setLoadingMessages((prev) => ({ ...prev, [ticketId]: false }));

      if (error) {
        console.error("[loadMessages]", error);
        return;
      }

      setMessagesMap((prev) => ({
        ...prev,
        [ticketId]: (data ?? []) as TicketMessage[],
      }));
    },
    [loadingMessages]
  );

  // Load messages when a ticket is expanded
  useEffect(() => {
    if (expandedId && !(expandedId in messagesMap)) {
      void loadMessages(expandedId);
    }
  }, [expandedId, messagesMap, loadMessages]);

  /* ── Status change + notification ────────────────────────────── */

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    setUpdatingId(ticketId);
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };
    if (newStatus === "resolvido") {
      updatePayload.resolved_at = now;
    } else if (newStatus === "aberto" || newStatus === "em_andamento") {
      updatePayload.resolved_at = null;
    }
    const { error } = await supabase
      .from("support_tickets")
      .update(updatePayload)
      .eq("id", ticketId);
    setUpdatingId(null);

    if (error) {
      toast.error("Erro ao atualizar status.");
      return;
    }

    const resolvedAtUpdate: Partial<{ resolved_at: string | null }> =
      newStatus === "resolvido"
        ? { resolved_at: now }
        : newStatus === "aberto" || newStatus === "em_andamento"
          ? { resolved_at: null }
          : {}; // "fechado": preserve existing resolved_at
    setTickets((prev) => {
      const nextTickets = prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus, ...resolvedAtUpdate } : ticket
      );
      if (supportOnlyView && newStatus !== "aberto") {
        return nextTickets.filter((ticket) => ticket.id !== ticketId);
      }
      return nextTickets;
    });

    toast.success("Status atualizado.");

    // Notify client for em_andamento and resolvido
    if (newStatus === "em_andamento" || newStatus === "resolvido") {
      try {
        const headers = await getSupabaseFunctionAuthHeaders();
        void supabase.functions.invoke("send-ticket-updated", {
          body: { ticket_id: ticketId, event: newStatus },
          headers,
        });
      } catch {
        // Fire-and-forget: do not block UI on email failure
      }
    }
  };

  /* ── Send reply ───────────────────────────────────────────────── */

  const handleSendReply = async (ticket: Ticket) => {
    const body = (replyBodies[ticket.id] ?? "").trim();
    if (!body) return;

    setSendingReply(ticket.id);

    const { data: msg, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_role: "admin",
        author_name: adminName,
        body,
      })
      .select()
      .single();

    setSendingReply(null);

    if (error) {
      toast.error("Erro ao enviar resposta.", { description: error.message });
      return;
    }

    // Set first_response_at if this is the first admin reply
    const existingMessages = messagesMap[ticket.id] ?? [];
    const hadAdminReply = existingMessages.some((m) => m.sender_role === "admin");
    if (!hadAdminReply && !ticket.first_response_at) {
      void supabase
        .from("support_tickets")
        .update({ first_response_at: new Date().toISOString() })
        .eq("id", ticket.id);
    }

    // Add to local state
    setMessagesMap((prev) => ({
      ...prev,
      [ticket.id]: [...(prev[ticket.id] ?? []), msg as TicketMessage],
    }));
    setReplyBodies((prev) => ({ ...prev, [ticket.id]: "" }));

    // If ticket is still "aberto", move to "em_andamento"
    if (ticket.status === "aberto") {
      void handleStatusChange(ticket.id, "em_andamento");
    } else {
      // Send reply notification
      try {
        const headers = await getSupabaseFunctionAuthHeaders();
        void supabase.functions.invoke("send-ticket-updated", {
          body: { ticket_id: ticket.id, event: "reply", reply_body: body },
          headers,
        });
      } catch {
        // Fire-and-forget
      }
    }

    toast.success("Resposta enviada.");
  };

  /* ── Filters ──────────────────────────────────────────────────── */

  const filtered = tickets.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.subject.toLowerCase().includes(q) ||
      (t.client_name ?? "").toLowerCase().includes(q) ||
      (t.client_email ?? "").toLowerCase().includes(q);
    const matchStatus =
      supportOnlyView || statusFilter === "all" ? true : t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCount = tickets.filter((t) => t.status === "aberto").length;
  const inProgressCount = tickets.filter((t) => t.status === "em_andamento").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolvido").length;
  const uniqueClientsCount = new Set(tickets.map((ticket) => ticket.client_id)).size;
  const uniqueProjectsCount = new Set(tickets.map((ticket) => ticket.project_id).filter(Boolean))
    .size;
  const ratedTickets = tickets.filter((t) => t.rating !== null);
  const averageRating =
    ratedTickets.length > 0
      ? (ratedTickets.reduce((sum, t) => sum + (t.rating ?? 0), 0) / ratedTickets.length).toFixed(1)
      : null;

  /* ── SLA metrics ──────────────────────────────────────────────── */

  const slaMetrics = (() => {
    const withFirstResponse = tickets.filter((t) => t.first_response_at);
    const avgFirstResponseHours =
      withFirstResponse.length > 0
        ? withFirstResponse.reduce((sum, t) => {
            const diff =
              new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime();
            return sum + diff;
          }, 0) /
          withFirstResponse.length /
          3600000
        : null;

    const withResolved = tickets.filter((t) => t.resolved_at);
    const avgResolutionHours =
      withResolved.length > 0
        ? withResolved.reduce((sum, t) => {
            const diff = new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime();
            return sum + diff;
          }, 0) /
          withResolved.length /
          3600000
        : null;

    const byCategory: Record<string, number> = {};
    for (const t of tickets) {
      const cat = t.category || "outro";
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }

    return { avgFirstResponseHours, avgResolutionHours, byCategory };
  })();

  function formatHours(hours: number | null) {
    if (hours === null) return "—";
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainHours = Math.round(hours % 24);
    return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`;
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading && !hasLoaded) return <PortalLoading />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Suporte</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {supportOnlyView
              ? "Leitura operacional apenas dos tickets abertos para o time de suporte."
              : "Solicitações abertas pelos clientes pelo portal."}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <MetricTile
          label="Tickets abertos"
          value={openCount.toString()}
          icon={Headphones}
          tone="accent"
        />
        <MetricTile
          label={supportOnlyView ? "Clientes aguardando" : "Em andamento"}
          value={supportOnlyView ? uniqueClientsCount.toString() : inProgressCount.toString()}
          icon={Clock}
          tone="secondary"
        />
        <MetricTile
          label={supportOnlyView ? "Projetos impactados" : "Resolvidos"}
          value={supportOnlyView ? uniqueProjectsCount.toString() : resolvedCount.toString()}
          icon={CheckCircle}
          tone="success"
        />
        {!supportOnlyView && (
          <MetricTile
            label="Satisfacao media"
            value={averageRating ? `${averageRating}/5` : "—"}
            icon={CheckCircle}
            tone={
              averageRating && Number(averageRating) >= 4
                ? "success"
                : averageRating
                  ? "warning"
                  : "secondary"
            }
          />
        )}
      </div>

      {/* SLA Dashboard */}
      {!supportOnlyView && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3 pl-4">
            <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-accent" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Tempo medio 1a resposta
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight text-accent">
              {formatHours(slaMetrics.avgFirstResponseHours)}
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3 pl-4">
            <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-success" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Tempo medio resolucao
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight text-success">
              {formatHours(slaMetrics.avgResolutionHours)}
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3 pl-4">
            <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-primary" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Por categoria
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {Object.entries(slaMetrics.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {cat} <span className="font-bold text-foreground">{count}</span>
                  </span>
                ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3 pl-4">
            <span
              className={cn(
                "absolute inset-y-0 left-0 w-[3px] rounded-l-xl",
                averageRating && Number(averageRating) >= 4 ? "bg-success" : "bg-warning"
              )}
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Satisfacao media
            </p>
            <p
              className={cn(
                "mt-1 text-base font-semibold tracking-tight",
                averageRating && Number(averageRating) >= 4 ? "text-success" : "text-warning"
              )}
            >
              {averageRating ? `${averageRating}/5` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">{ratedTickets.length} avaliacao(es)</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por assunto ou cliente"
            className="pl-9"
          />
        </div>

        {!supportOnlyView && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-48"
          >
            <option value="all">Todos os status</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Ticket list */}
      {pageError ? (
        <AdminEmptyState
          icon={Headphones}
          title="Nao foi possivel carregar os tickets"
          description={pageError}
          action={
            <Button type="button" onClick={() => void loadTickets()}>
              Tentar novamente
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={Headphones}
          title={tickets.length === 0 ? "Nenhum ticket aberto" : "Nenhum resultado"}
          description={
            tickets.length === 0
              ? supportOnlyView
                ? "Quando houver novo ticket aberto, ele aparecera aqui para o suporte."
                : "Quando clientes abrirem solicitacoes de suporte, elas aparecerao aqui."
              : "Ajuste o filtro ou o termo de busca."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const cfg = STATUS_CONFIG[ticket.status];
            const isExpanded = expandedId === ticket.id;
            const msgs = messagesMap[ticket.id] ?? [];
            const isLoadingMsgs = !!loadingMessages[ticket.id];
            const replyBody = replyBodies[ticket.id] ?? "";
            const isSending = sendingReply === ticket.id;

            return (
              <article
                key={ticket.id}
                className="rounded-xl border border-border/50 bg-background/60 transition-all"
              >
                {/* Ticket header — clickable to expand */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : ticket.id);
                    }
                  }}
                  className="cursor-pointer px-4 py-3 hover:bg-card sm:px-5 sm:py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            cfg.className
                          )}
                        >
                          {cfg.label}
                        </span>
                        {ticket.rating && (
                          <span
                            className="inline-flex items-center gap-0.5 text-xs text-warning"
                            title={`Avaliacao: ${ticket.rating}/5`}
                          >
                            {Array.from({ length: ticket.rating }).map((_, i) => (
                              <span key={i}>{"\u2605"}</span>
                            ))}
                          </span>
                        )}
                        <p className="truncate text-sm font-semibold text-foreground">
                          {ticket.subject}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticket.client_name}
                        {ticket.client_email ? ` · ${ticket.client_email}` : ""}
                        {ticket.project_name ? ` · ${ticket.project_name}` : ""}
                        {" · "}
                        {formatDate(ticket.created_at)}
                      </p>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          void handleStatusChange(ticket.id, e.target.value as TicketStatus)
                        }
                        disabled={updatingId === ticket.id}
                        className="flex h-9 min-w-[140px] rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_CONFIG[s].label}
                          </option>
                        ))}
                      </select>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : ticket.id);
                        }}
                      >
                        {isExpanded ? "Fechar" : "Ver"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded: original message + thread + reply */}
                {isExpanded && (
                  <div className="space-y-4 border-t border-border/50 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                    {/* Original message */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Mensagem original
                      </p>
                      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {ticket.client_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · {formatDate(ticket.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {ticket.body}
                        </p>
                      </div>
                    </div>

                    {/* Message thread */}
                    {isLoadingMsgs ? (
                      <div className="flex justify-center py-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : msgs.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Conversa
                        </p>
                        <div className="space-y-2">
                          {msgs.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "rounded-lg border p-4",
                                msg.sender_role === "admin"
                                  ? "border-primary/20 bg-primary/5"
                                  : "border-border/50 bg-muted/30"
                              )}
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground">
                                  {msg.sender_role === "admin"
                                    ? `Elkys · ${msg.author_name}`
                                    : msg.author_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  · {formatDate(msg.created_at)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                {msg.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Reply form */}
                    {ticket.status !== "fechado" && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Responder
                        </p>
                        <textarea
                          ref={replyRef}
                          value={replyBody}
                          onChange={(e) =>
                            setReplyBodies((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                          }
                          rows={3}
                          placeholder="Escreva sua resposta para o cliente..."
                          className="flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            disabled={!replyBody.trim() || isSending}
                            onClick={() => void handleSendReply(ticket)}
                            className="gap-2"
                          >
                            <Send size={14} />
                            {isSending ? "Enviando..." : "Enviar resposta"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
