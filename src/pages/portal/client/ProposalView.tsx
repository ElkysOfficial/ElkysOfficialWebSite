import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { CheckCircle, ExternalLink, FileText, X } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
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
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/masks";
import { formatPortalDate, formatPortalDateTime } from "@/lib/portal";

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
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProposal = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("proposals").select("*").eq("id", id).single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setProposal(data as ProposalRow);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void loadProposal();
  }, [loadProposal]);

  const handleApprove = async () => {
    if (!proposal) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("proposals")
      .update({
        status: "aprovada",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    setActionLoading(false);
    if (error) {
      toast.error("Erro ao aprovar proposta.");
      return;
    }

    // Auto-create project in "negociacao" status from approved proposal
    const clientId = proposal.client_id;
    if (clientId) {
      const { data: newProject } = await supabase
        .from("projects")
        .insert({
          client_id: clientId,
          name: proposal.title,
          description: proposal.scope_summary ?? null,
          status: "negociacao",
          current_stage: "Acordo Formal",
          billing_type: "projeto",
          proposal_id: proposal.id,
        })
        .select("id")
        .single();

      // Timeline: proposal approved + project created
      void supabase.from("timeline_events").insert({
        client_id: clientId,
        project_id: newProject?.id ?? null,
        event_type: "proposta_aprovada",
        title: "Proposta aprovada pelo cliente",
        summary: `Proposta "${proposal.title}" aprovada. Projeto criado automaticamente em negociacao.`,
        visibility: "ambos",
        source_table: "proposals",
        source_id: proposal.id,
      });
    }

    // If linked to a lead, update lead status to "negociacao"
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
    if (!proposal) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("proposals")
      .update({
        status: "rejeitada",
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    setActionLoading(false);
    if (error) {
      toast.error("Erro ao rejeitar proposta.");
      return;
    }

    toast.success("Proposta rejeitada.");
    setShowRejectForm(false);
    void loadProposal();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-xl border border-border/50 bg-card/60" />
        <div className="h-[400px] animate-pulse rounded-xl border border-border/50 bg-card/60" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="Proposta nao encontrada"
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
                  Observacoes
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
