import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Clock, Headphones, Mail, Phone, Send } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/admin/AdminEmptyState";
import StatusBadge from "@/components/portal/shared/StatusBadge";
import { Button, Card, CardContent, Field, Input, Label, cn } from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { CONTACT } from "@/constants";
import { supabase } from "@/integrations/supabase/client";
import type { TicketStatus } from "@/lib/portal";
import { TICKET_STATUS_META } from "@/lib/portal";
import { formatSlaPromise, getSlaBadge } from "@/lib/portal-sla";
import { loadProjectsForClient, resolveClientForUser } from "@/lib/portal-data";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: TicketStatus;
  created_at: string;
  project_name?: string;
  rating: number | null;
  rating_feedback: string | null;
  sla_deadline: string | null;
  first_response_at: string | null;
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
/*  TicketForm                                                         */
/* ------------------------------------------------------------------ */

function TicketForm({
  clientId,
  projects,
  onSent,
}: {
  clientId: string;
  projects: { id: string; name: string }[];
  onSent?: () => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!subject.trim() || !body.trim()) {
      toast.error("Preencha o assunto e a mensagem.");
      return;
    }

    setSubmitting(true);
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        client_id: clientId,
        project_id: projectId || null,
        subject: subject.trim(),
        body: body.trim(),
      })
      .select("id")
      .single();
    setSubmitting(false);

    if (error) {
      toast.error("Não foi possível enviar a solicitação.", { description: error.message });
      return;
    }

    void supabase.functions.invoke("send-ticket-opened", {
      body: {
        ticket_id: ticket.id,
        client_id: clientId,
        subject: subject.trim(),
        body: body.trim(),
      },
    });

    // Notify admin team about new ticket
    void supabase.from("admin_notifications").insert({
      type: "ticket_aberto",
      title: `Novo ticket de suporte`,
      body: `O cliente abriu o ticket "${subject.trim()}".`,
      severity: "warning",
      target_roles: ["admin_super", "admin", "support"],
      entity_type: "support_ticket",
      entity_id: ticket.id,
      action_url: "/portal/admin/suporte",
    });

    toast.success("Solicitação enviada!", {
      description: "Nossa equipe de suporte recebera sua mensagem e entrara em contato em breve.",
    });
    setSent(true);
    setProjectId("");
    setSubject("");
    setBody("");
    onSent?.();
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <Send size={20} className="text-success" />
        </div>
        <p className="text-base font-semibold tracking-tight text-foreground">
          Solicitação enviada com sucesso!
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Nossa equipe entrara em contato em breve.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-medium text-primary hover:underline"
        >
          Abrir nova solicitação
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      {projects.length > 0 ? (
        <Field>
          <Label>Projeto relacionado</Label>
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Selecionar depois</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field>
        <Label required>Assunto</Label>
        <Input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Ex: Duvida sobre prazo do projeto"
          maxLength={120}
        />
      </Field>

      <Field>
        <Label required>Mensagem</Label>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          placeholder="Descreva sua solicitação com o maximo de detalhes possivel..."
          className="flex min-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </Field>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={submitting} loadingText="Enviando..." className="gap-2">
          <Send size={15} />
          Enviar solicitação
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

type Channel = "ticket" | "whatsapp" | "email";

export default function ClientSupport() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState<Channel>("ticket");
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("Cliente");
  const [slaHours, setSlaHours] = useState<number | null>(null);
  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingClientId, setLoadingClientId] = useState(true);

  // Ticket history state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, TicketMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  // Rating state
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, number>>({});
  const [ratingFeedbacks, setRatingFeedbacks] = useState<Record<string, string>>({});
  const [submittingRating, setSubmittingRating] = useState<string | null>(null);

  const handleSubmitRating = async (ticket: Ticket) => {
    const rating = ratingDrafts[ticket.id];
    if (!rating || rating < 1 || rating > 5 || !clientId) return;

    setSubmittingRating(ticket.id);
    const { error } = await supabase
      .from("support_tickets")
      .update({
        rating,
        rating_feedback: (ratingFeedbacks[ticket.id] ?? "").trim() || null,
        rated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id)
      .eq("client_id", clientId);

    setSubmittingRating(null);

    if (error) {
      toast.error("Erro ao enviar avaliacao.", { description: error.message });
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? { ...t, rating, rating_feedback: (ratingFeedbacks[ticket.id] ?? "").trim() || null }
          : t
      )
    );
    setRatingDrafts((prev) => {
      const next = { ...prev };
      delete next[ticket.id];
      return next;
    });
    setRatingFeedbacks((prev) => {
      const next = { ...prev };
      delete next[ticket.id];
      return next;
    });
    toast.success("Obrigado pela sua avaliacao!");
  };

  /* ── Load client context ────���────────────��──────────────────────── */

  const loadTickets = useCallback(async (cid: string) => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*, projects(name)")
      .eq("client_id", cid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[loadTickets]", error);
      return;
    }

    const mapped: Ticket[] = (data ?? []).map((t: Record<string, unknown>) => {
      const project = t["projects"] as { name?: string } | null;
      return {
        id: t["id"] as string,
        subject: t["subject"] as string,
        body: t["body"] as string,
        status: t["status"] as TicketStatus,
        created_at: t["created_at"] as string,
        project_name: project?.name || undefined,
        rating: (t["rating"] as number | null) ?? null,
        rating_feedback: (t["rating_feedback"] as string | null) ?? null,
        sla_deadline: (t["sla_deadline"] as string | null) ?? null,
        first_response_at: (t["first_response_at"] as string | null) ?? null,
      };
    });

    setTickets(mapped);
    setTicketsLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSupportContext = async () => {
      if (!user?.id) return;

      const clientRes = await resolveClientForUser(user.id);
      if (cancelled) return;
      if (!clientRes.client) {
        setClientId(null);
        setProjectOptions([]);
        setLoadingClientId(false);
        return;
      }

      const [projectsRes] = await Promise.all([
        loadProjectsForClient(clientRes.client.id),
        loadTickets(clientRes.client.id),
      ]);

      if (cancelled) return;
      const name = clientRes.client.nome_fantasia || clientRes.client.full_name || "Cliente";

      setClientId(clientRes.client.id);
      setClientName(name);
      setSlaHours(clientRes.client.sla_hours ?? null);
      setProjectOptions(
        projectsRes.projects.map((project) => ({ id: project.id, name: project.name }))
      );
      setLoadingClientId(false);
    };

    void loadSupportContext();
    return () => {
      cancelled = true;
    };
  }, [user?.id, loadTickets]);

  /* ── Load messages for a ticket ──────────────────────────────────── */

  const loadMessages = useCallback(
    async (ticketId: string) => {
      if (loadingMessages[ticketId]) return;

      // Only load messages for tickets that belong to the current client
      if (!tickets.some((t) => t.id === ticketId)) return;

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
    [loadingMessages, tickets]
  );

  useEffect(() => {
    if (expandedId && !(expandedId in messagesMap)) {
      void loadMessages(expandedId);
    }
  }, [expandedId, messagesMap, loadMessages]);

  /* ── Realtime: new messages on expanded ticket (degrades gracefully) ── */

  useEffect(() => {
    if (!expandedId || !tickets.some((t) => t.id === expandedId)) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`ticket-messages-${expandedId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ticket_messages",
            filter: `ticket_id=eq.${expandedId}`,
          },
          (payload) => {
            const msg = payload.new as TicketMessage;
            setMessagesMap((prev) => {
              const existing = prev[expandedId] ?? [];
              if (existing.some((m) => m.id === msg.id)) return prev;
              return { ...prev, [expandedId]: [...existing, msg] };
            });
          }
        )
        .subscribe((status, err) => {
          if (err) console.warn("[realtime] ticket-messages subscribe error:", err.message);
        });
    } catch {
      console.warn("[realtime] WebSocket unavailable — realtime ticket messages disabled");
    }

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [expandedId, tickets]);

  /* ── Send reply ───────────────────────────────────────────────────── */

  const handleSendReply = async (ticket: Ticket) => {
    const body = (replyBodies[ticket.id] ?? "").trim();
    if (!body || !clientId) return;

    // Verify ticket belongs to current client (loaded list is filtered by client_id)
    if (!tickets.some((t) => t.id === ticket.id)) return;

    setSendingReply(ticket.id);

    const { data: msg, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_role: "client",
        author_name: clientName,
        body,
      })
      .select()
      .single();

    setSendingReply(null);

    if (error) {
      toast.error("Erro ao enviar mensagem.", { description: error.message });
      return;
    }

    setMessagesMap((prev) => ({
      ...prev,
      [ticket.id]: [...(prev[ticket.id] ?? []), msg as TicketMessage],
    }));
    setReplyBodies((prev) => ({ ...prev, [ticket.id]: "" }));

    toast.success("Mensagem enviada.");
  };

  /* ── Channel tabs ─────────────────────────────────────────────────── */

  const channels: {
    key: Channel;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { key: "ticket", label: "Abrir ticket", description: "Registre sua solicitação", icon: Send },
    { key: "whatsapp", label: "WhatsApp", description: "Resposta mais rapida", icon: Phone },
    { key: "email", label: "E-mail", description: "Detalhes e anexos", icon: Mail },
  ];

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Suporte</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha o canal de atendimento mais adequado para sua necessidade.
          </p>
        </div>
        <div
          role="note"
          aria-label="Tempo medio de resposta"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success"
        >
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
          Respondemos em até 24h úteis
        </div>
      </div>

      {/* Channel selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {channels.map(({ key, label, description, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveChannel(key)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all",
              activeChannel === key
                ? "border-primary/40 bg-card"
                : "border-border/50 bg-background/60 hover:border-primary/25 hover:bg-card"
            )}
          >
            <Icon
              size={22}
              className={cn(
                "transition-colors",
                activeChannel === key ? "text-primary" : "text-muted-foreground"
              )}
            />
            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  activeChannel === key ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Active channel card */}
      <Card className="rounded-xl border-border/50 bg-background/60">
        <CardContent className="p-6">
          {activeChannel === "ticket" ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Abrir solicitação de suporte
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sua mensagem sera registrada e, quando fizer sentido, pode ficar vinculada ao
                  projeto correto.
                </p>
              </div>

              <div
                className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
                role="note"
              >
                <Clock size={15} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-foreground">
                  <span className="font-semibold">SLA de resposta:</span>{" "}
                  <span className="text-muted-foreground">{formatSlaPromise(slaHours)}</span>
                </p>
              </div>

              {loadingClientId ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : clientId ? (
                <TicketForm
                  clientId={clientId}
                  projects={projectOptions}
                  onSent={() => clientId && void loadTickets(clientId)}
                />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Não foi possível identificar seu cadastro. Entre em contato pelo e-mail.
                </p>
              )}
            </div>
          ) : activeChannel === "whatsapp" ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">WhatsApp</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Canal mais rapido para conversas operacionais durante o horario comercial.
                </p>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Ideal para duvidas rapidas, alinhamentos e acompanhamento de andamento. Atendemos de
                segunda a sexta, das 8h as 18h.
              </p>

              <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2 sm:w-auto">
                  <Phone size={15} />
                  Conversar no WhatsApp - {CONTACT.phone}
                </Button>
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">E-mail</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Indicado para solicitações que precisam de contexto detalhado ou anexos.
                </p>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Envie sua mensagem para o e-mail abaixo com o maximo de detalhes. Respondemos em ate
                1 dia útil.
              </p>

              <a href={`mailto:${CONTACT.email}?subject=Suporte - Portal do Cliente`}>
                <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                  <Mail size={15} />
                  Enviar e-mail - {CONTACT.email}
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meus tickets */}
      {ticketsLoaded && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Meus tickets
            </p>
            {tickets.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {tickets.length} solicitac{tickets.length === 1 ? "ao" : "oes"}
              </span>
            )}
          </div>

          {tickets.length === 0 ? (
            <AdminEmptyState
              icon={Headphones}
              title="Nenhuma solicitação aberta"
              description="Quando você abrir um ticket, ele aparecerá aqui com o histórico da conversa."
            />
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const meta = TICKET_STATUS_META[ticket.status];
                const slaBadge = getSlaBadge(
                  ticket.sla_deadline,
                  ticket.status,
                  ticket.first_response_at
                );
                const isExpanded = expandedId === ticket.id;
                const msgs = messagesMap[ticket.id] ?? [];
                const isLoadingMsgs = !!loadingMessages[ticket.id];
                const replyBody = replyBodies[ticket.id] ?? "";
                const isSending = sendingReply === ticket.id;
                const canReply = ticket.status !== "fechado";

                return (
                  <article
                    key={ticket.id}
                    className="rounded-xl border border-border/50 bg-background/60 transition-all"
                  >
                    {/* Ticket header */}
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
                            <StatusBadge label={meta.label} tone={meta.tone} />
                            {slaBadge && (
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                                  slaBadge.className
                                )}
                                title={slaBadge.title}
                              >
                                {slaBadge.label}
                              </span>
                            )}
                            <p className="truncate text-sm font-semibold text-foreground">
                              {ticket.subject}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {ticket.project_name ? `${ticket.project_name} · ` : ""}
                            {formatDate(ticket.created_at)}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : ticket.id);
                          }}
                        >
                          {isExpanded ? "Fechar" : "Ver conversa"}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded: original message + thread + reply */}
                    {isExpanded && (
                      <div className="space-y-4 border-t border-border/50 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                        {/* Original message */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Sua solicitação
                          </p>
                          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                            <p className="mb-1 text-xs text-muted-foreground">
                              {formatDate(ticket.created_at)}
                            </p>
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
                                        ? `Equipe Elkys · ${msg.author_name}`
                                        : "Voce"}
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
                        {canReply && (
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
                              placeholder="Escreva uma mensagem para a equipe Elkys..."
                              className="flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                size="sm"
                                loading={isSending}
                                loadingText="Enviando..."
                                disabled={!replyBody.trim()}
                                onClick={() => void handleSendReply(ticket)}
                                className="gap-2"
                              >
                                <Send size={14} />
                                Enviar mensagem
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Rating widget — show when resolved and not yet rated */}
                        {(ticket.status === "resolvido" || ticket.status === "fechado") &&
                          !ticket.rating && (
                            <div className="space-y-3 rounded-lg border border-primary/15 bg-primary-soft/50 p-4 dark:bg-primary/8">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                                Avalie nosso atendimento
                              </p>
                              <p className="text-sm text-foreground">
                                Como foi sua experiencia com o suporte neste ticket?
                              </p>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const draft = ratingDrafts[ticket.id] ?? 0;
                                  const filled = star <= draft;
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() =>
                                        setRatingDrafts((prev) => ({ ...prev, [ticket.id]: star }))
                                      }
                                      className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors",
                                        filled
                                          ? "bg-warning/15 text-warning"
                                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                      )}
                                      aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                                    >
                                      {filled ? "\u2605" : "\u2606"}
                                    </button>
                                  );
                                })}
                              </div>
                              <div
                                className={`space-y-3 transition-all duration-200 ${(ratingDrafts[ticket.id] ?? 0) > 0 ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden"}`}
                              >
                                <textarea
                                  value={ratingFeedbacks[ticket.id] ?? ""}
                                  onChange={(e) =>
                                    setRatingFeedbacks((prev) => ({
                                      ...prev,
                                      [ticket.id]: e.target.value,
                                    }))
                                  }
                                  rows={2}
                                  placeholder="Comentario opcional..."
                                  className="flex min-h-[60px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    loading={submittingRating === ticket.id}
                                    loadingText="Enviando..."
                                    onClick={() => void handleSubmitRating(ticket)}
                                  >
                                    Enviar avaliacao
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Already rated */}
                        {ticket.rating && (
                          <div className="rounded-lg border border-success/15 bg-success/5 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-success">
                              Sua avaliacao
                            </p>
                            <div className="mt-1 flex items-center gap-1 text-warning">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-lg">
                                  {star <= ticket.rating! ? "\u2605" : "\u2606"}
                                </span>
                              ))}
                            </div>
                            {ticket.rating_feedback && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {ticket.rating_feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
