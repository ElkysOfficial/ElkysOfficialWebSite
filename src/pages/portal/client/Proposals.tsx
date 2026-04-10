import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { FileText } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import StatusBadge from "@/components/portal/StatusBadge";
import { cn } from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/masks";
import { formatPortalDate } from "@/lib/portal";
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

export default function ClientProposals() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProposals = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError(null);

      const clientRes = await resolveClientForUser(user.id);
      if (cancelled) return;
      if (clientRes.error || !clientRes.client) {
        setPageError(clientRes.error?.message ?? "Cadastro do cliente nao encontrado.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("client_id", clientRes.client.id)
        .neq("status", "rascunho")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        toast.error("Erro ao carregar propostas.");
        setLoading(false);
        return;
      }

      setProposals((data ?? []) as ProposalRow[]);
      setLoading(false);
    };

    void loadProposals();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-border/50 bg-card/60"
          />
        ))}
      </div>
    );
  }

  if (pageError) {
    return (
      <AdminEmptyState icon={FileText} title="Erro ao carregar propostas" description={pageError} />
    );
  }

  if (proposals.length === 0) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="Nenhuma proposta disponivel"
        description="Quando uma proposta for enviada pela Elkys, ela aparecera aqui para sua avaliacao."
      />
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => {
        const meta = STATUS_META[proposal.status] ?? STATUS_META.enviada;
        const isActionable = proposal.status === "enviada";

        return (
          <Link
            key={proposal.id}
            to={`/portal/cliente/propostas/${proposal.id}`}
            className={cn(
              "block rounded-xl border bg-card/92 p-4 transition-all hover:shadow-md",
              isActionable
                ? "border-primary/30 hover:border-primary/50"
                : "border-border/60 hover:border-border"
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{proposal.title}</h3>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </div>
                {proposal.scope_summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {proposal.scope_summary}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">
                  {formatBRL(proposal.total_amount)}
                </p>
                {proposal.valid_until && (
                  <p className="text-[11px] text-muted-foreground">
                    Valida ate {formatPortalDate(proposal.valid_until)}
                  </p>
                )}
              </div>
            </div>
            {isActionable && (
              <p className="mt-2 text-[11px] font-medium text-primary">
                Clique para avaliar esta proposta →
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
