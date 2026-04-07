import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { FileText, Shield } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import StatusBadge from "@/components/portal/StatusBadge";
import { Button, Card, CardContent, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/masks";
import { formatPortalDate } from "@/lib/portal";

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
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar propostas.");
      setLoading(false);
      return;
    }

    setProposals((data ?? []) as ProposalRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

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
                <p className="text-sm font-semibold tabular-nums text-foreground">
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
