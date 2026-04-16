import { useCallback, useEffect, useMemo, useState } from "react";

import ContractActionsButtons from "@/components/portal/ContractActionsButtons";
import { Card, CardContent, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/masks";

type HistoryRow = Database["public"]["Views"]["project_contract_history"]["Row"];

type Props = {
  contractId: string | null;
  clientId?: string;
  projectName?: string;
  scopeSummary?: string | null;
  className?: string;
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

const PAYMENT_MODEL_LABEL: Record<string, string> = {
  "50_50": "50/50",
  a_vista: "À vista",
  personalizado: "Personalizado",
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Linha do tempo de versoes de um project_contract.
 *
 * Le da view `project_contract_history` que une o estado atual
 * (is_current=true) com o historico em `project_contract_versions`.
 *
 * Mostra:
 *   - n da versao
 *   - intervalo de validade
 *   - total_amount, scope_summary, payment_model, status
 *   - razao da mudanca (se setada via app.contract_change_reason)
 *
 * Se houver apenas a versao 1 atual (sem historico), exibe estado vazio.
 */
export default function ContractVersionHistory({
  contractId,
  clientId,
  projectName,
  scopeSummary,
  className,
}: Props) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!contractId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("project_contract_history")
      .select("*")
      .eq("contract_id", contractId)
      .order("version_no", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setRows([]);
    } else {
      setRows((data as HistoryRow[]) ?? []);
    }
    setLoading(false);
  }, [contractId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // PROBLEMA 14: status atual do contrato vem da linha is_current da view.
  const currentStatus = useMemo(() => {
    const current = rows.find((r) => r.is_current);
    return (current?.status ?? null) as "rascunho" | "ativo" | "encerrado" | "cancelado" | null;
  }, [rows]);

  const versionCount = rows.length;
  const hasHistory = useMemo(() => rows.some((r) => !r.is_current), [rows]);

  if (!contractId) return null;

  return (
    <Card className={cn("rounded-2xl border-border/80 bg-card/95", className)}>
      <CardContent className="space-y-3 p-3 sm:p-5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={expanded}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Histórico de versões
            </p>
            <p className="text-sm font-semibold text-foreground">
              {loading
                ? "Carregando..."
                : versionCount === 0
                  ? "Sem versões"
                  : versionCount === 1
                    ? "1 versão (atual)"
                    : `${versionCount} versões${hasHistory ? "" : ""}`}
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {expanded ? "Ocultar" : "Ver tudo"}
          </span>
        </button>

        {/* PROBLEMA 14: ações de ciclo de vida do contrato */}
        {!loading && currentStatus && contractId ? (
          <ContractActionsButtons
            contractId={contractId}
            clientId={clientId ?? ""}
            projectName={projectName ?? "Projeto"}
            scopeSummary={scopeSummary}
            status={currentStatus}
            onTransitioned={() => void loadHistory()}
          />
        ) : null}

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            Falha ao carregar histórico: {error}
          </p>
        ) : null}

        {expanded && !loading && rows.length > 0 ? (
          <ol className="space-y-2">
            {rows.map((row) => (
              <li
                key={`${row.contract_id}-${row.version_no}-${row.is_current}`}
                className={cn(
                  "rounded-xl border p-3",
                  row.is_current
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/75 bg-background/70"
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">v{row.version_no}</span>
                    {row.is_current ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Atual
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {formatDateTime(row.valid_from)}
                    {row.valid_to && !row.is_current ? ` — ${formatDateTime(row.valid_to)}` : ""}
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div>
                    <dt className="font-medium uppercase tracking-wide text-[10px]">Total</dt>
                    <dd className="text-foreground">
                      {row.total_amount != null ? formatBRL(Number(row.total_amount)) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium uppercase tracking-wide text-[10px]">Status</dt>
                    <dd className="text-foreground">
                      {row.status ? (STATUS_LABEL[row.status] ?? row.status) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium uppercase tracking-wide text-[10px]">Modelo</dt>
                    <dd className="text-foreground">
                      {row.payment_model
                        ? (PAYMENT_MODEL_LABEL[row.payment_model] ?? row.payment_model)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium uppercase tracking-wide text-[10px]">Vigência</dt>
                    <dd className="text-foreground">
                      {row.starts_at ?? "—"} → {row.ends_at ?? "—"}
                    </dd>
                  </div>
                </dl>
                {row.scope_summary ? (
                  <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                    {row.scope_summary}
                  </p>
                ) : null}
                {row.change_reason ? (
                  <p className="mt-2 text-[11px] italic text-muted-foreground">
                    Motivo: {row.change_reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}

        {expanded && !loading && rows.length === 0 && !error ? (
          <p className="rounded-md border border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
            Nenhum histórico disponível.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
