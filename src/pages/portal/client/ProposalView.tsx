import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { CheckCircle, ExternalLink, FileText, X } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import PortalLoading from "@/components/portal/PortalLoading";
import StatusBadge from "@/components/portal/StatusBadge";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
  cn,
  buttonVariants,
} from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/masks";
import { canTransitionProposal, formatPortalDate, formatPortalDateTime } from "@/lib/portal";
import { resolveClientForUser } from "@/lib/portal-data";

type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];

const STATUS_META: Record<
  string,
  { label: string; tone: "accent" | "success" | "warning" | "destructive" | "secondary" }
> = {
  rascunho: { label: "Rascunho", tone: "secondary" },
  enviada: { label: "Pendente", tone: "accent" },
  aprovada: { label: "Aprovada", tone: "success" },
  rejeitada: { label: "Rejeitada", tone: "destructive" },
  expirada: { label: "Expirada", tone: "warning" },
};

export default function ProposalView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalRow | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProposal = useCallback(async () => {
    if (!id || !user?.id) return;
    setLoading(true);
    setPageError(null);

    const clientRes = await resolveClientForUser(user.id);
    if (clientRes.error || !clientRes.client) {
      setPageError(clientRes.error?.message ?? "Cadastro do cliente não encontrado.");
      setLoading(false);
      return;
    }

    const resolvedClientId = clientRes.client.id;
    setClientId(resolvedClientId);

    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .eq("client_id", resolvedClientId)
      .neq("status", "rascunho")
      .single();

    if (error || !data) {
      setProposal(null);
      setLoading(false);
      return;
    }

    setProposal(data as ProposalRow);
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
      if (!id || !user?.id) return;
      setLoading(true);
      setPageError(null);

      const clientRes = await resolveClientForUser(user.id);
      if (cancelled) return;
      if (clientRes.error || !clientRes.client) {
        setPageError(clientRes.error?.message ?? "Cadastro do cliente não encontrado.");
        setLoading(false);
        return;
      }

      const resolvedCid = clientRes.client.id;
      setClientId(resolvedCid);

      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id)
        .eq("client_id", resolvedCid)
        .neq("status", "rascunho")
        .single();

      if (cancelled) return;
      if (error || !data) {
        setProposal(null);
        setLoading(false);
        return;
      }

      setProposal(data as ProposalRow);
      setLoading(false);
    };

    void initialLoad();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  const handleApprove = async () => {
    if (!proposal || !clientId) return;
    if (!canTransitionProposal(proposal.status, "aprovada")) {
      toast.error("Esta proposta não pode ser aprovada no status atual.");
      return;
    }
    setActionLoading(true);

    const { error } = await supabase
      .from("proposals")
      .update({
        status: "aprovada",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposal.id)
      .eq("client_id", clientId);

    setActionLoading(false);
    if (error) {
      toast.error("Erro ao aprovar proposta.");
      return;
    }

    // Timeline: proposal approved by client
    if (proposal.client_id) {
      void supabase.from("timeline_events").insert({
        client_id: proposal.client_id,
        event_type: "proposta_aprovada",
        title: "Proposta aprovada pelo cliente",
        summary: `Proposta "${proposal.title}" aprovada pelo cliente. Aguardando criacao do projeto pelo admin.`,
        visibility: "ambos",
        source_table: "proposals",
        source_id: proposal.id,
      });
    }

    // Notify admin team via admin_notifications
    void supabase.from("admin_notifications").insert({
      type: "proposta_aprovada",
      title: `Proposta aprovada: ${proposal.title}`,
      body: `O cliente aprovou a proposta "${proposal.title}" no valor de R$ ${Number(proposal.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Acesse para criar o projeto.`,
      severity: "action_required",
      target_roles: ["admin_super", "admin"],
      entity_type: "proposal",
      entity_id: proposal.id,
      action_url: `/portal/admin/propostas/${proposal.id}`,
    });

    // If linked to a lead, update lead status
    if (proposal.lead_id) {
      void supabase
        .from("leads")
        .update({ status: "negociacao", updated_at: new Date().toISOString() })
        .eq("id", proposal.lead_id);
    }

    toast.success("Proposta aprovada com sucesso!");
    void loadProposal();
  };

  const handleReject = async () => {
    if (!proposal || !clientId) return;
    if (!canTransitionProposal(proposal.status, "rejeitada")) {
      toast.error("Esta proposta não pode ser rejeitada no status atual.");
      return;
    }
    setActionLoading(true);

    const { error } = await supabase
      .from("proposals")
      .update({
        status: "rejeitada",
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposal.id)
      .eq("client_id", clientId);

    setActionLoading(false);
    if (error) {
      toast.error("Erro ao rejeitar proposta.");
      return;
    }

    toast.success("Proposta rejeitada.");
    setShowRejectForm(false);
    void loadProposal();
  };

  if (loading) return <PortalLoading />;

  if (pageError) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="Erro ao carregar proposta"
        description={pageError}
        action={
          <Link to="/portal/cliente/propostas" className={buttonVariants({ variant: "default" })}>
            Voltar para propostas
          </Link>
        }
      />
    );
  }

  if (!proposal) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="Proposta não encontrada"
        description="A proposta pode ter sido removida ou o link esta incorreto."
        action={
          <Link to="/portal/cliente/propostas" className={buttonVariants({ variant: "default" })}>
            Voltar para propostas
          </Link>
        }
      />
    );
  }

  const meta = STATUS_META[proposal.status] ?? STATUS_META.enviada;
  const canRespond = proposal.status === "enviada";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary dark:bg-primary/15">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{proposal.title}</h1>
            <StatusBadge label={meta.label} tone={meta.tone} />
          </div>
        </div>
        <Link to="/portal/cliente/propostas" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </div>

      {/* Proposal details */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/92">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">Detalhes da proposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Valor total
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-primary">
                  {formatBRL(proposal.total_amount)}
                </p>
              </div>
              {proposal.valid_until && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Valida ate
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {formatPortalDate(proposal.valid_until)}
                  </p>
                </div>
              )}
              {proposal.solution_type && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Tipo de solucao
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {proposal.solution_type}
                  </p>
                </div>
              )}
            </div>

            {proposal.scope_summary && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Escopo</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {proposal.scope_summary}
                </p>
              </div>
            )}

            {proposal.payment_conditions && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Condicoes de pagamento
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {proposal.payment_conditions}
                </p>
              </div>
            )}

            {proposal.observations && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Observações
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {proposal.observations}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Document link */}
          {proposal.document_url && (
            <Card className="border-border/70 bg-card/92">
              <CardContent className="p-4">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                  Documento da proposta
                </p>
                <a
                  href={proposal.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <ExternalLink size={16} />
                  Abrir documento
                </a>
              </CardContent>
            </Card>
          )}

          {/* Technical document link */}
          {proposal.technical_document_url && (
            <Card className="border-border/70 bg-card/92">
              <CardContent className="p-4">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                  Anexo tecnico
                </p>
                <a
                  href={proposal.technical_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <ExternalLink size={16} />
                  Abrir anexo tecnico
                </a>
              </CardContent>
            </Card>
          )}

          {/* Status info for responded proposals */}
          {proposal.status === "aprovada" && proposal.approved_at && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle size={20} className="text-success" />
                <div>
                  <p className="text-sm font-semibold text-success">Proposta aprovada</p>
                  <p className="text-xs text-muted-foreground">
                    Em {formatPortalDateTime(proposal.approved_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {proposal.status === "rejeitada" && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center gap-3">
                  <X size={20} className="text-destructive" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Proposta rejeitada</p>
                    {proposal.rejected_at && (
                      <p className="text-xs text-muted-foreground">
                        Em {formatPortalDateTime(proposal.rejected_at)}
                      </p>
                    )}
                  </div>
                </div>
                {proposal.rejection_reason && (
                  <p className="text-sm text-muted-foreground">{proposal.rejection_reason}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          {canRespond && (
            <Card className="border-primary/30 bg-card/95">
              <CardContent className="space-y-4 p-4">
                <h3 className="text-sm font-semibold text-foreground">Responder a esta proposta</h3>

                {showRejectForm ? (
                  <div className="space-y-3">
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Motivo da rejeicao (opcional)..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleReject()}
                        disabled={actionLoading}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        {actionLoading ? "Rejeitando..." : "Confirmar rejeicao"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRejectForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      onClick={() => void handleApprove()}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Aprovando..." : "Aprovar proposta"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                      className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      Rejeitar proposta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
