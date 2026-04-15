import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { formatPortalDate } from "@/lib/portal";

type ContractRow = {
  id: string;
  version_no: number;
  status: string | null;
  accepted_at: string | null;
  acceptance_ip: string | null;
  total_amount: number | null;
};

type Props = {
  projectId: string;
  className?: string;
};

/**
 * PA5 — Card read-only no ProjectDetail admin mostrando estado do
 * aceite formal de contrato pelo cliente. Exibe badge claro para
 * cada estado (pendente, aceito, terminal) com data/IP quando
 * aplicavel. Nao tem acao — transicao e aceite moram em Contracts.tsx
 * (admin) e /portal/cliente/contratos (cliente).
 */
export default function ContractAcceptanceStatusCard({ projectId, className }: Props) {
  const [contract, setContract] = useState<ContractRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("project_contracts")
      .select("id, version_no, status, accepted_at, acceptance_ip, total_amount")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setContract((data as ContractRow | null) ?? null);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return null;

  if (!contract) {
    return (
      <Card className={cn("rounded-2xl border-border/80 bg-card/95", className)}>
        <CardContent className="space-y-1 p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Aceite do contrato
          </p>
          <p className="text-sm text-muted-foreground">Nenhum contrato vinculado a este projeto.</p>
        </CardContent>
      </Card>
    );
  }

  const isAccepted = contract.accepted_at !== null;
  const isTerminal = contract.status === "encerrado" || contract.status === "cancelado";
  const badge = isTerminal
    ? {
        text: contract.status === "encerrado" ? "Contrato encerrado" : "Contrato cancelado",
        cls: "bg-muted/40 text-muted-foreground",
      }
    : isAccepted
      ? { text: "Aceito pelo cliente", cls: "bg-success/10 text-success" }
      : { text: "Aguardando aceite", cls: "bg-warning/10 text-warning" };

  return (
    <Card className={cn("rounded-2xl border-border/80 bg-card/95", className)}>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Aceite do contrato
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Contrato v{contract.version_no}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              badge.cls
            )}
          >
            {badge.text}
          </span>
        </div>

        {isAccepted ? (
          <div className="rounded-xl border border-success/25 bg-success/5 p-3">
            <p className="text-xs text-foreground">
              Aceito em {formatPortalDate(contract.accepted_at)}
              {contract.acceptance_ip ? ` · IP ${contract.acceptance_ip}` : ""}
            </p>
          </div>
        ) : !isTerminal ? (
          <div className="rounded-xl border border-warning/25 bg-warning/5 p-3">
            <p className="text-xs text-foreground">
              Cliente ainda não registrou o aceite formal. Após o aceite, o contrato é ativado e a
              execução fica liberada.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
