import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ExternalLink, FileText, Shield } from "@/assets/icons";
import StatusBadge from "@/components/portal/StatusBadge";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Label,
  Textarea,
  cn,
} from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL, maskCurrency, unmaskCurrency } from "@/lib/masks";
import { formatPortalDate, formatPortalDateTime } from "@/lib/portal";

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
type DestinationType = "client" | "lead";

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

type FormState = {
  title: string;
  destination_type: DestinationType;
  client_id: string;
  lead_id: string;
  solution_type: string;
  total_amount: string;
  valid_until: string;
  scope_summary: string;
  payment_conditions: string;
  observations: string;
  document_url: string;
  technical_document_url: string;
};

const selectClass =
  "flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function getClientDisplayName(client: ClientRow): string {
  if (client.client_type === "pj" && client.nome_fantasia) return client.nome_fantasia;
  return client.full_name;
}

function formDefaults(proposal?: ProposalRow | null): FormState {
  return {
    title: proposal?.title ?? "",
    destination_type: proposal?.lead_id ? "lead" : "client",
    client_id: proposal?.client_id ?? "",
    lead_id: proposal?.lead_id ?? "",
    solution_type: proposal?.solution_type ?? "",
    total_amount: proposal ? maskCurrency(String(Math.round(proposal.total_amount * 100))) : "",
    valid_until: proposal?.valid_until ?? "",
    scope_summary: proposal?.scope_summary ?? "",
    payment_conditions: proposal?.payment_conditions ?? "",
    observations: proposal?.observations ?? "",
    document_url: proposal?.document_url ?? "",
    technical_document_url: proposal?.technical_document_url ?? "",
  };
}

/* ------------------------------------------------------------------ */
/*  Read-only view (for sent / approved / rejected / expired)          */
/* ------------------------------------------------------------------ */

function ProposalReadOnly({
  proposal,
  destinationLabel,
  onApprove,
  approving,
  linkedProjectId,
}: {
  proposal: ProposalRow;
  destinationLabel: string;
  onApprove: () => void;
  approving: boolean;
  linkedProjectId: string | null;
}) {
  const meta =
    PROPOSAL_STATUS_META[proposal.status as ProposalStatus] ?? PROPOSAL_STATUS_META.rascunho;

  const canApprove =
    proposal.status === "enviada" || (proposal.status === "aprovada" && !linkedProjectId);

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge label={meta.label} tone={meta.tone} />
        {proposal.sent_at ? (
          <span className="text-sm text-muted-foreground">
            Enviada em {formatPortalDateTime(proposal.sent_at)}
          </span>
        ) : null}
        {proposal.approved_at ? (
          <span className="text-sm text-success">
            Aprovada em {formatPortalDateTime(proposal.approved_at)}
          </span>
        ) : null}
        {proposal.rejected_at ? (
          <span className="text-sm text-destructive">
            Rejeitada em {formatPortalDateTime(proposal.rejected_at)}
          </span>
        ) : null}
      </div>

      {/* Warning: proposal for lead without client */}
      {canApprove && !proposal.client_id && proposal.lead_id && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <Shield size={18} className="text-warning shrink-0" />
          <span className="text-sm text-warning">
            Esta proposta e para um lead. Para criar o projeto, primeiro converta o lead em cliente
            na{" "}
            <Link to="/portal/admin/crm" className="font-medium underline">
              pagina do CRM
            </Link>
            .
          </span>
        </div>
      )}

      {/* Admin approve action */}
      {canApprove && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <Button type="button" disabled={approving} onClick={onApprove}>
            {approving
              ? "Criando projeto..."
              : proposal.status === "aprovada"
                ? "Criar projeto a partir desta proposta"
                : "Aprovar e criar projeto"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {proposal.status === "aprovada"
              ? "Cliente ja aprovou. Clique para criar o projeto e contrato vinculados."
              : "Ao aprovar, um projeto sera criado automaticamente vinculado a esta proposta."}
          </span>
        </div>
      )}

      {/* Linked project reference */}
      {linkedProjectId && (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
          <span className="text-sm text-success font-medium">
            Projeto criado a partir desta proposta:
          </span>
          <Link
            to={`/portal/admin/projetos/${linkedProjectId}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver projeto →
          </Link>
        </div>
      )}

      {/* Rejection reason */}
      {proposal.rejection_reason ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-destructive">Motivo da rejeicao</p>
            <p className="mt-1 text-sm text-foreground">{proposal.rejection_reason}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Titulo
          </p>
          <p className="mt-1 text-sm text-foreground">{proposal.title}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Destinatario
          </p>
          <p className="mt-1 text-sm text-foreground">{destinationLabel}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Valor total
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatBRL(proposal.total_amount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Validade
          </p>
          <p className="mt-1 text-sm text-foreground">{formatPortalDate(proposal.valid_until)}</p>
        </div>
        {proposal.solution_type ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tipo de solucao
            </p>
            <p className="mt-1 text-sm text-foreground">{proposal.solution_type}</p>
          </div>
        ) : null}
      </div>

      {proposal.scope_summary ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumo do escopo
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {proposal.scope_summary}
          </p>
        </div>
      ) : null}

      {proposal.payment_conditions ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Condicoes de pagamento
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {proposal.payment_conditions}
          </p>
        </div>
      ) : null}

      {proposal.observations ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Observacoes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {proposal.observations}
          </p>
        </div>
      ) : null}

      {proposal.document_url ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Documento
          </p>
          <a
            href={proposal.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Abrir documento
            <ExternalLink size={14} />
          </a>
        </div>
      ) : null}

      {proposal.technical_document_url ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Anexo tecnico
          </p>
          <a
            href={proposal.technical_document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Abrir anexo tecnico
            <ExternalLink size={14} />
          </a>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEditing = Boolean(id);

  const [proposal, setProposal] = useState<ProposalRow | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [form, setForm] = useState<FormState>(formDefaults());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [approving, setApproving] = useState(false);
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);

  /* ── Helpers ── */

  const clientsMap = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);
  const leadsMap = useMemo(() => Object.fromEntries(leads.map((l) => [l.id, l])), [leads]);

  const destinationLabel = useMemo(() => {
    if (form.destination_type === "client" && form.client_id) {
      const c = clientsMap[form.client_id];
      return c ? getClientDisplayName(c) : "—";
    }
    if (form.destination_type === "lead" && form.lead_id) {
      const l = leadsMap[form.lead_id];
      return l ? (l.company ? `${l.name} (${l.company})` : l.name) : "—";
    }
    return "—";
  }, [form, clientsMap, leadsMap]);

  const isReadOnly = isEditing && proposal !== null && proposal.status !== "rascunho";

  const canSend =
    form.title.trim().length > 0 &&
    ((form.destination_type === "client" && form.client_id) ||
      (form.destination_type === "lead" && form.lead_id)) &&
    form.document_url.trim().length > 0;

  /* ── Set form field ── */

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* ── Load data ── */

  const loadData = useCallback(async () => {
    setLoading(true);

    const queries: Promise<unknown>[] = [
      supabase
        .from("clients")
        .select("id, full_name, client_type, nome_fantasia")
        .eq("is_active", true),
      supabase.from("leads").select("id, name, company").neq("status", "perdido"),
    ];

    if (id) {
      queries.push(supabase.from("proposals").select("*").eq("id", id).single());
    }

    const results = await Promise.all(queries);

    const clientsRes = results[0] as {
      data: ClientRow[] | null;
      error: { message: string } | null;
    };
    const leadsRes = results[1] as { data: LeadRow[] | null; error: { message: string } | null };

    if (clientsRes.error || leadsRes.error) {
      toast.error("Erro ao carregar dados.", {
        description: (clientsRes.error ?? leadsRes.error)?.message,
      });
      setLoading(false);
      return;
    }

    setClients(clientsRes.data ?? []);
    setLeads(leadsRes.data ?? []);

    if (id && results[2]) {
      const proposalRes = results[2] as {
        data: ProposalRow | null;
        error: { message: string } | null;
      };

      if (proposalRes.error || !proposalRes.data) {
        toast.error("Proposta nao encontrada.");
        navigate("/portal/admin/propostas");
        return;
      }

      setProposal(proposalRes.data);
      setForm(formDefaults(proposalRes.data));

      // Check if a project was already created from this proposal
      const { data: linkedProject } = await supabase
        .from("projects")
        .select("id")
        .eq("proposal_id", proposalRes.data.id)
        .limit(1)
        .maybeSingle();

      setLinkedProjectId(linkedProject?.id ?? null);
    }

    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ── Build payload ── */

  function buildPayload(status: string) {
    const payload: Database["public"]["Tables"]["proposals"]["Insert"] = {
      title: form.title.trim(),
      client_id: form.destination_type === "client" && form.client_id ? form.client_id : null,
      lead_id: form.destination_type === "lead" && form.lead_id ? form.lead_id : null,
      total_amount: unmaskCurrency(form.total_amount),
      valid_until: form.valid_until || null,
      scope_summary: form.scope_summary.trim() || null,
      payment_conditions: form.payment_conditions.trim() || null,
      observations: form.observations.trim() || null,
      document_url: form.document_url.trim() || null,
      solution_type: form.solution_type.trim() || null,
      technical_document_url: form.technical_document_url.trim() || null,
      status,
      created_by: user?.id ?? null,
    };

    if (status === "enviada") {
      (payload as Record<string, unknown>).sent_at = new Date().toISOString();
    }

    return payload;
  }

  /* ── Save as draft ── */

  async function handleSaveDraft() {
    if (!form.title.trim()) {
      toast.error("Informe o titulo da proposta.");
      return;
    }

    if (!form.client_id && !form.lead_id) {
      toast.error("Selecione um cliente ou lead para a proposta.");
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload("rascunho");

      if (isEditing && proposal) {
        const { error } = await supabase.from("proposals").update(payload).eq("id", proposal.id);

        if (error) {
          toast.error("Erro ao salvar proposta.", { description: error.message });
          return;
        }

        toast.success("Rascunho salvo com sucesso.");
        void loadData();
      } else {
        const { data, error } = await supabase
          .from("proposals")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          toast.error("Erro ao criar proposta.", { description: error.message });
          return;
        }

        toast.success("Proposta criada como rascunho.");
        navigate(`/portal/admin/propostas/${data.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado.";
      toast.error("Erro ao salvar proposta.", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  /* ── Send to client ── */

  async function handleSend() {
    if (!form.title.trim()) {
      toast.error("Informe o titulo da proposta.");
      return;
    }

    if (!canSend) {
      toast.error("Preencha o destinatario e o link do documento antes de enviar.");
      return;
    }

    setSending(true);

    try {
      const payload = buildPayload("enviada");

      if (isEditing && proposal) {
        const { error } = await supabase.from("proposals").update(payload).eq("id", proposal.id);

        if (error) {
          toast.error("Erro ao enviar proposta.", { description: error.message });
          return;
        }

        toast.success("Proposta enviada com sucesso.");

        // Notify client by email (fire-and-forget)
        if (form.destination_type === "client" && form.client_id) {
          try {
            const headers = await getSupabaseFunctionAuthHeaders();
            void supabase.functions.invoke("send-proposal-sent", {
              body: { proposal_id: proposal!.id, client_id: form.client_id },
              headers,
            });
          } catch {
            // Non-blocking
          }
        }

        // Sync: update lead status to "proposta" if linked to a lead
        if (form.destination_type === "lead" && form.lead_id) {
          void supabase
            .from("leads")
            .update({ status: "proposta", updated_at: new Date().toISOString() })
            .eq("id", form.lead_id)
            .in("status", ["novo", "qualificado"]);
        }

        // Timeline: record proposal sent event
        if (form.destination_type === "client" && form.client_id) {
          void supabase.from("timeline_events").insert({
            client_id: form.client_id,
            event_type: "proposta_enviada",
            title: "Proposta enviada",
            summary: `Proposta "${form.title.trim()}" enviada para avaliacao.`,
            visibility: "ambos",
            source_table: "proposals",
            source_id: proposal?.id ?? null,
            actor_user_id: user?.id ?? null,
          });
        }

        void loadData();
      } else {
        const { data, error } = await supabase
          .from("proposals")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          toast.error("Erro ao criar e enviar proposta.", { description: error.message });
          return;
        }

        toast.success("Proposta criada e enviada.");

        // Notify client by email (fire-and-forget)
        if (form.destination_type === "client" && form.client_id) {
          try {
            const headers = await getSupabaseFunctionAuthHeaders();
            void supabase.functions.invoke("send-proposal-sent", {
              body: { proposal_id: data.id, client_id: form.client_id },
              headers,
            });
          } catch {
            // Non-blocking
          }
        }

        // Sync lead status
        if (form.destination_type === "lead" && form.lead_id) {
          void supabase
            .from("leads")
            .update({ status: "proposta", updated_at: new Date().toISOString() })
            .eq("id", form.lead_id)
            .in("status", ["novo", "qualificado"]);
        }

        // Timeline event
        if (form.destination_type === "client" && form.client_id) {
          void supabase.from("timeline_events").insert({
            client_id: form.client_id,
            event_type: "proposta_enviada",
            title: "Proposta enviada",
            summary: `Proposta "${form.title.trim()}" enviada para avaliacao.`,
            visibility: "ambos",
            source_table: "proposals",
            source_id: data.id,
            actor_user_id: user?.id ?? null,
          });
        }

        navigate(`/portal/admin/propostas/${data.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado.";
      toast.error("Erro ao enviar proposta.", { description: msg });
    } finally {
      setSending(false);
    }
  }

  /* ── Approve proposal (admin) ── */

  async function handleApprove() {
    if (!proposal) return;

    setApproving(true);

    // 1. Update proposal status to approved (skip if already approved by client)
    if (proposal.status !== "aprovada") {
      const { error: approveError } = await supabase
        .from("proposals")
        .update({
          status: "aprovada",
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal.id);

      if (approveError) {
        setApproving(false);
        toast.error("Erro ao aprovar proposta.", { description: approveError.message });
        return;
      }
    }

    // 2. Resolve client_id (may come from lead conversion)
    let clientId = proposal.client_id;

    if (!clientId && proposal.lead_id) {
      // Check if the lead was already converted to a client
      const { data: leadData } = await supabase
        .from("leads")
        .select("converted_client_id")
        .eq("id", proposal.lead_id)
        .maybeSingle();

      if (leadData?.converted_client_id) {
        clientId = leadData.converted_client_id;
      }
    }

    if (!clientId) {
      setApproving(false);
      toast.error("Nao e possivel criar o projeto.", {
        description: proposal.lead_id
          ? "O lead desta proposta ainda nao foi convertido em cliente. Converta o lead primeiro e tente novamente."
          : "A proposta nao possui um cliente vinculado.",
      });
      return;
    }

    // 3. Create project linked to this proposal
    if (clientId) {
      const { data: newProject } = await supabase
        .from("projects")
        .insert({
          client_id: clientId,
          name: proposal.title,
          description: proposal.scope_summary ?? null,
          status: "negociacao" as const,
          current_stage: "Acordo Formal",
          billing_type: "projeto" as const,
          proposal_id: proposal.id,
          solution_type: proposal.solution_type ?? null,
        })
        .select("id")
        .single();

      // 3. Create draft contract pre-filled from proposal
      if (newProject) {
        const approvedDate = new Date().toISOString().slice(0, 10);
        void supabase.from("project_contracts").insert({
          project_id: newProject.id,
          client_id: clientId,
          total_amount: proposal.total_amount,
          scope_summary: proposal.scope_summary ?? null,
          starts_at: approvedDate,
          status: "rascunho" as const,
          payment_model: "50_50" as const,
          created_by: user?.id ?? null,
        });
      }

      // 3b. Auto-create document entry for technical attachment
      if (newProject && proposal.technical_document_url) {
        void supabase.from("documents").insert({
          client_id: clientId,
          project_id: newProject.id,
          label: `Anexo tecnico - ${proposal.title}`,
          url: proposal.technical_document_url,
          type: "outro" as const,
          uploaded_by: user?.id ?? null,
        });
      }

      // 4. Timeline event
      void supabase.from("timeline_events").insert({
        client_id: clientId,
        project_id: newProject?.id ?? null,
        event_type: "proposta_aprovada",
        title: "Projeto criado a partir de proposta",
        summary: `Proposta "${proposal.title}" aprovada. Projeto e contrato rascunho criados.`,
        visibility: "ambos",
        source_table: "proposals",
        source_id: proposal.id,
        actor_user_id: user?.id ?? null,
      });
    }

    // 5. If linked to a lead, advance lead status
    if (proposal.lead_id) {
      void supabase
        .from("leads")
        .update({ status: "negociacao", updated_at: new Date().toISOString() })
        .eq("id", proposal.lead_id);
    }

    setApproving(false);
    toast.success("Projeto e contrato criados com sucesso!");
    void loadData();
  }

  /* ── Render ── */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-[400px] animate-pulse rounded-xl border border-border/50 bg-card/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {isEditing
              ? isReadOnly
                ? "Detalhes da proposta"
                : "Editar proposta"
              : "Nova proposta"}
          </h2>
          {isEditing && proposal ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Criada em {formatPortalDateTime(proposal.created_at)}
            </p>
          ) : null}
        </div>

        <Link to="/portal/admin/propostas">
          <Button type="button" variant="outline">
            Voltar
          </Button>
        </Link>
      </div>

      {/* ── Read-only mode ── */}
      {isReadOnly && proposal ? (
        <Card>
          <CardContent className="pt-6">
            <ProposalReadOnly
              proposal={proposal}
              destinationLabel={destinationLabel}
              onApprove={() => void handleApprove()}
              approving={approving}
              linkedProjectId={linkedProjectId}
            />
          </CardContent>
        </Card>
      ) : (
        /* ── Edit / Create form ── */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da proposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <Field>
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Ex: Proposta de desenvolvimento de site institucional"
              />
            </Field>

            {/* Destination type */}
            <Field>
              <Label>Destinatario *</Label>
              <div className="mt-2 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="destination_type"
                    value="client"
                    checked={form.destination_type === "client"}
                    onChange={() => {
                      setField("destination_type", "client");
                      setField("lead_id", "");
                    }}
                    className="accent-primary"
                  />
                  Cliente existente
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="destination_type"
                    value="lead"
                    checked={form.destination_type === "lead"}
                    onChange={() => {
                      setField("destination_type", "lead");
                      setField("client_id", "");
                    }}
                    className="accent-primary"
                  />
                  Lead
                </label>
              </div>
            </Field>

            {/* Client select */}
            {form.destination_type === "client" ? (
              <Field>
                <Label htmlFor="client_id">Cliente</Label>
                <select
                  id="client_id"
                  value={form.client_id}
                  onChange={(e) => setField("client_id", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getClientDisplayName(c)}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field>
                <Label htmlFor="lead_id">Lead</Label>
                <select
                  id="lead_id"
                  value={form.lead_id}
                  onChange={(e) => setField("lead_id", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecione um lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                      {l.company ? ` (${l.company})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Solution type */}
            <Field>
              <Label htmlFor="solution_type">Tipo de solucao</Label>
              <Input
                id="solution_type"
                value={form.solution_type}
                onChange={(e) => setField("solution_type", e.target.value)}
                placeholder="Ex: Site institucional, E-commerce, Sistema web..."
              />
            </Field>

            {/* Value + Valid until */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <Label htmlFor="total_amount">Valor total</Label>
                <Input
                  id="total_amount"
                  value={form.total_amount}
                  onChange={(e) => setField("total_amount", maskCurrency(e.target.value))}
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                />
              </Field>
              <Field>
                <Label htmlFor="valid_until">Validade</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setField("valid_until", e.target.value)}
                />
              </Field>
            </div>

            {/* Scope summary */}
            <Field>
              <Label htmlFor="scope_summary">Resumo do escopo</Label>
              <Textarea
                id="scope_summary"
                value={form.scope_summary}
                onChange={(e) => setField("scope_summary", e.target.value)}
                placeholder="Descreva o escopo principal da proposta..."
                rows={4}
              />
            </Field>

            {/* Payment conditions */}
            <Field>
              <Label htmlFor="payment_conditions">Condicoes de pagamento</Label>
              <Textarea
                id="payment_conditions"
                value={form.payment_conditions}
                onChange={(e) => setField("payment_conditions", e.target.value)}
                placeholder="Ex: 50% na assinatura, 50% na entrega..."
                rows={3}
              />
            </Field>

            {/* Observations */}
            <Field>
              <Label htmlFor="observations">Observacoes</Label>
              <Textarea
                id="observations"
                value={form.observations}
                onChange={(e) => setField("observations", e.target.value)}
                placeholder="Notas internas ou comentarios adicionais..."
                rows={3}
              />
            </Field>

            {/* Document URL */}
            <Field>
              <Label htmlFor="document_url">Link do documento</Label>
              <Input
                id="document_url"
                value={form.document_url}
                onChange={(e) => setField("document_url", e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              {form.document_url.trim() ? (
                <a
                  href={form.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Abrir link
                  <ExternalLink size={12} />
                </a>
              ) : null}
            </Field>

            {/* Technical Document URL */}
            <Field>
              <Label htmlFor="technical_document_url">Anexo tecnico (link)</Label>
              <Input
                id="technical_document_url"
                value={form.technical_document_url}
                onChange={(e) => setField("technical_document_url", e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              {form.technical_document_url.trim() ? (
                <a
                  href={form.technical_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Abrir anexo tecnico
                  <ExternalLink size={12} />
                </a>
              ) : null}
            </Field>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSaveDraft()}
                disabled={saving || sending}
              >
                {saving ? "Salvando..." : "Salvar rascunho"}
              </Button>
              <Button
                type="button"
                onClick={() => void handleSend()}
                disabled={saving || sending || !canSend}
                title={
                  !canSend ? "Preencha o destinatario e o link do documento para enviar" : undefined
                }
              >
                {sending ? "Enviando..." : "Enviar para cliente"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
