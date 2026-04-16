import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, Card, CardContent, Field, Input, Label, Textarea, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ValidationRound = Database["public"]["Tables"]["project_validation_rounds"]["Row"];

type Props = {
  projectId: string;
  acceptedAt: string | null;
  className?: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  em_andamento: {
    label: "Em andamento",
    cls: "bg-warning/10 text-warning",
  },
  aprovada: {
    label: "Aprovada",
    cls: "bg-success/10 text-success",
  },
  reprovada: {
    label: "Reprovada",
    cls: "bg-destructive/10 text-destructive",
  },
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
 * Card de Rodadas de Validacao exibido em ProjectDetail.
 * Mostra rodadas em andamento e historicas, permite iniciar nova,
 * carimbar validacao interna/cliente e fechar como aprovada/reprovada.
 *
 * Auditoria PROBLEMA 9: o sistema nao tinha mecanismo para registrar
 * rodadas de validacao entre execucao e aceite formal. Sem isso, o
 * aceite (PROBLEMA 7) nascia sem trilha de qualidade e o retrabalho
 * era invisivel.
 */
export default function ProjectValidationRounds({ projectId, acceptedAt, className }: Props) {
  const [rounds, setRounds] = useState<ValidationRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [newScope, setNewScope] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closingFeedback, setClosingFeedback] = useState("");
  const isAccepted = Boolean(acceptedAt);
  const hasInProgress = rounds.some((r) => r.status === "em_andamento");

  const loadRounds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_validation_rounds")
      .select("*")
      .eq("project_id", projectId)
      .order("round_no", { ascending: false });
    if (!error) setRounds((data as ValidationRound[]) ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadRounds();
  }, [loadRounds]);

  async function handleStart() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("start_validation_round", {
        p_project_id: projectId,
        p_scope_summary: newScope.trim() || null,
      });
      if (error) {
        toast.error("Erro ao iniciar rodada.", { description: error.message });
        return;
      }
      toast.success("Rodada de validação iniciada.");
      setNewScope("");
      void loadRounds();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkInternal(roundId: string) {
    const { error } = await supabase.rpc("mark_validation_internal", {
      p_round_id: roundId,
    });
    if (error) {
      toast.error("Erro ao marcar validação interna.", { description: error.message });
      return;
    }
    toast.success("Validação interna registrada.");
    void loadRounds();
  }

  async function handleMarkClient(roundId: string) {
    const clientName = window.prompt("Nome ou cargo de quem validou (opcional):");
    if (clientName === null) return; // cancelado
    const { error } = await supabase.rpc("mark_validation_client", {
      p_round_id: roundId,
      p_client_name: clientName.trim() || null,
    });
    if (error) {
      toast.error("Erro ao marcar validação do cliente.", { description: error.message });
      return;
    }
    toast.success("Validação do cliente registrada.");
    void loadRounds();
  }

  async function handleClose(roundId: string, status: "aprovada" | "reprovada") {
    const { error } = await supabase.rpc("close_validation_round", {
      p_round_id: roundId,
      p_status: status,
      p_feedback: closingFeedback.trim() || null,
    });
    if (error) {
      toast.error("Erro ao fechar rodada.", { description: error.message });
      return;
    }
    toast.success(`Rodada ${status}.`);
    setClosingFeedback("");
    setClosingId(null);
    void loadRounds();
  }

  return (
    <Card className={cn("rounded-2xl border-border/80 bg-card/95", className)}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Validação / Ajustes
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {loading
              ? "Carregando..."
              : rounds.length === 0
                ? "Nenhuma rodada registrada"
                : `${rounds.length} rodada${rounds.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {!isAccepted && !hasInProgress ? (
          <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-3">
            <Field>
              <Label className="text-[10px] uppercase tracking-wide">Nova rodada</Label>
              <Input
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
                placeholder="O que está sendo validado nesta rodada (opcional)"
                className="text-xs"
              />
            </Field>
            <Button size="sm" disabled={submitting} onClick={() => void handleStart()}>
              {submitting ? "Iniciando..." : "Iniciar rodada"}
            </Button>
          </div>
        ) : null}

        {isAccepted ? (
          <p className="rounded-md border border-success/30 bg-success/5 p-2 text-xs text-success">
            Projeto já aceito. Não é possível iniciar novas rodadas.
          </p>
        ) : null}

        {rounds.length > 0 ? (
          <ol className="space-y-3">
            {rounds.map((round) => {
              const meta = STATUS_META[round.status] ?? STATUS_META.em_andamento;
              const isOpen = round.status === "em_andamento";
              const internalOk = Boolean(round.internal_validated_at);
              const clientOk = Boolean(round.client_validated_at);
              return (
                <li
                  key={round.id}
                  className={cn(
                    "rounded-xl border p-3",
                    isOpen ? "border-warning/40 bg-warning/5" : "border-border/75 bg-background/70"
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Rodada #{round.round_no}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          meta.cls
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Iniciada em {formatDateTime(round.started_at)}
                    </span>
                  </div>
                  {round.scope_summary ? (
                    <p className="mt-2 text-xs text-muted-foreground">{round.scope_summary}</p>
                  ) : null}

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <div>
                      <dt className="font-semibold uppercase tracking-wide text-muted-foreground">
                        Validação interna
                      </dt>
                      <dd className={internalOk ? "text-success" : "text-muted-foreground"}>
                        {internalOk ? formatDateTime(round.internal_validated_at) : "Pendente"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wide text-muted-foreground">
                        Validação cliente
                      </dt>
                      <dd className={clientOk ? "text-success" : "text-muted-foreground"}>
                        {clientOk
                          ? `${formatDateTime(round.client_validated_at)} ${round.validated_by_client ? `(${round.validated_by_client})` : ""}`
                          : "Pendente"}
                      </dd>
                    </div>
                  </dl>

                  {round.feedback ? (
                    <p className="mt-2 rounded-md border border-border/60 bg-background/80 p-2 text-[11px] text-foreground">
                      <span className="font-semibold">Feedback:</span> {round.feedback}
                    </p>
                  ) : null}

                  {isOpen ? (
                    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                      <div className="flex flex-wrap gap-2">
                        {!internalOk ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleMarkInternal(round.id)}
                          >
                            Marcar interno
                          </Button>
                        ) : null}
                        {!clientOk ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleMarkClient(round.id)}
                          >
                            Marcar cliente
                          </Button>
                        ) : null}
                      </div>

                      {closingId === round.id ? (
                        <div className="space-y-2">
                          <Textarea
                            rows={2}
                            value={closingFeedback}
                            onChange={(e) => setClosingFeedback(e.target.value)}
                            placeholder="Feedback ou motivo (opcional)"
                            className="text-xs"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              disabled={!internalOk || !clientOk}
                              onClick={() => void handleClose(round.id, "aprovada")}
                            >
                              Aprovar rodada
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive/40 text-destructive hover:bg-destructive/10"
                              onClick={() => void handleClose(round.id, "reprovada")}
                            >
                              Reprovar rodada
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setClosingId(null);
                                setClosingFeedback("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setClosingId(round.id)}>
                          Fechar rodada
                        </Button>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : null}
      </CardContent>
    </Card>
  );
}
