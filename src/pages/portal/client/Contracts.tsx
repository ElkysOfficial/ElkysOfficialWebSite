import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { FileText } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import PortalLoading from "@/components/portal/PortalLoading";
import StatusBadge from "@/components/portal/StatusBadge";
import { Button, Card, CardContent, cn } from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/masks";
import { formatPortalDate } from "@/lib/portal";
import { resolveClientForUser } from "@/lib/portal-data";

type ContractRow = Pick<
  Database["public"]["Tables"]["project_contracts"]["Row"],
  | "id"
  | "project_id"
  | "version_no"
  | "status"
  | "signed_at"
  | "starts_at"
  | "ends_at"
  | "total_amount"
  | "scope_summary"
  | "payment_model"
  | "accepted_at"
  | "created_at"
>;

type ProjectRef = { id: string; name: string };

const STATUS_META: Record<
  string,
  { label: string; tone: "primary" | "success" | "warning" | "secondary" | "destructive" }
> = {
  rascunho: { label: "Aguardando seu aceite", tone: "warning" },
  ativo: { label: "Ativo", tone: "success" },
  encerrado: { label: "Encerrado", tone: "primary" },
  cancelado: { label: "Cancelado", tone: "destructive" },
};

const PAYMENT_MODEL_LABEL: Record<string, string> = {
  "50_50": "50/50",
  a_vista: "À vista",
  personalizado: "Personalizado",
};

/**
 * Tela do portal cliente: lista contratos do cliente autenticado e
 * permite registrar aceite formal via RPC register_contract_acceptance
 * (PA3). Fecha lacuna juridica C3 da auditoria — cliente agora tem
 * ponto formal de aceite antes da execucao comecar.
 */
export default function ClientContracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [projects, setProjects] = useState<Map<string, ProjectRef>>(new Map());
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);

    const clientRes = await resolveClientForUser(user.id);
    if (clientRes.error || !clientRes.client) {
      setPageError(clientRes.error?.message ?? "Cadastro do cliente não encontrado.");
      setLoading(false);
      return;
    }

    const [contractsRes, projectsRes] = await Promise.all([
      supabase
        .from("project_contracts")
        .select(
          "id, project_id, version_no, status, signed_at, starts_at, ends_at, total_amount, scope_summary, payment_model, accepted_at, created_at"
        )
        .eq("client_id", clientRes.client.id)
        .order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name").eq("client_id", clientRes.client.id),
    ]);

    if (contractsRes.error) {
      setPageError(contractsRes.error.message);
      setLoading(false);
      return;
    }

    setContracts((contractsRes.data ?? []) as ContractRow[]);
    const pMap = new Map<string, ProjectRef>();
    for (const p of (projectsRes.data ?? []) as ProjectRef[]) pMap.set(p.id, p);
    setProjects(pMap);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  async function handleAccept(contractId: string) {
    if (acceptingId) return;
    const confirmed = window.confirm(
      "Confirma o aceite formal deste contrato? Esta ação é registrada e não pode ser desfeita."
    );
    if (!confirmed) return;

    setAcceptingId(contractId);
    try {
      const { error } = await supabase.rpc("register_contract_acceptance", {
        p_contract_id: contractId,
        p_ip: null,
      });
      if (error) {
        toast.error("Erro ao registrar aceite.", { description: error.message });
        return;
      }
      toast.success("Contrato aceito.");
      void loadContracts();
    } finally {
      setAcceptingId(null);
    }
  }

  if (loading) return <PortalLoading />;

  if (pageError) {
    return (
      <AdminEmptyState icon={FileText} title="Erro ao carregar contratos" description={pageError} />
    );
  }

  if (contracts.length === 0) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="Nenhum contrato disponível"
        description="Seus contratos aparecerão aqui quando forem emitidos pela Elkys."
      />
    );
  }

  return (
    <div className="space-y-3">
      {contracts.map((contract) => {
        const project = projects.get(contract.project_id);
        const meta = STATUS_META[contract.status ?? ""] ?? STATUS_META.rascunho;
        const needsAcceptance = contract.accepted_at === null && contract.status !== "cancelado";
        const isAccepting = acceptingId === contract.id;

        return (
          <Card
            key={contract.id}
            className={cn(
              "border-border/70 bg-card/95",
              needsAcceptance ? "border-primary/40 ring-1 ring-primary/10" : ""
            )}
          >
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {project?.name ?? "Contrato"}
                    </h3>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                    <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      v{contract.version_no}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {contract.payment_model
                      ? (PAYMENT_MODEL_LABEL[contract.payment_model] ?? contract.payment_model)
                      : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {formatBRL(Number(contract.total_amount ?? 0))}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {contract.signed_at
                      ? `Assinado em ${formatPortalDate(contract.signed_at)}`
                      : "Não assinado"}
                  </p>
                </div>
              </div>

              {contract.scope_summary ? (
                <p className="line-clamp-3 text-xs text-muted-foreground">
                  {contract.scope_summary}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
                <div className="text-[11px] text-muted-foreground">
                  Vigência: {contract.starts_at ?? "—"} → {contract.ends_at ?? "—"}
                </div>
                {contract.accepted_at ? (
                  <span className="text-[11px] font-medium text-success">
                    Aceito em {formatPortalDate(contract.accepted_at)}
                  </span>
                ) : null}
              </div>

              {needsAcceptance ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs text-foreground">
                    Revise o escopo e os valores acima. Ao aceitar, o contrato passa a vigorar
                    formalmente e a execução é liberada.
                  </p>
                  <Button
                    size="sm"
                    className="mt-2"
                    disabled={isAccepting}
                    onClick={() => void handleAccept(contract.id)}
                  >
                    {isAccepting ? "Registrando..." : "Aceitar contrato"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
