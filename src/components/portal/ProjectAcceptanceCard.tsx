import { useState } from "react";
import { toast } from "sonner";

import { Button, Card, CardContent, Field, Label, Textarea, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  projectId: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  acceptanceNotes: string | null;
  deliveredAt: string | null;
  onAccepted?: () => void;
  className?: string;
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
 * Card de Entrega + Aceite Formal exibido em ProjectDetail.
 * Antes do aceite: textarea de notas + botao "Registrar aceite formal".
 * Apos o aceite: estado readonly mostrando data e notas.
 *
 * Auditoria PROBLEMA 7: o sistema so tinha projects.delivered_at, sem
 * registro estruturado de aceitacao. Agora aceita_at/by/notes guardam
 * a prova documental e a RPC register_project_acceptance encadeia o
 * status do projeto + a liberacao da charge final em uma transacao.
 */
export default function ProjectAcceptanceCard({
  projectId,
  acceptedAt,
  acceptanceNotes,
  deliveredAt,
  onAccepted,
  className,
}: Props) {
  const [notes, setNotes] = useState(acceptanceNotes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const isAccepted = Boolean(acceptedAt);

  async function handleAccept() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("register_project_acceptance", {
        p_project_id: projectId,
        p_notes: notes.trim() || null,
      });
      if (error) {
        toast.error("Erro ao registrar aceite.", { description: error.message });
        return;
      }
      toast.success("Aceite registrado com sucesso.");
      onAccepted?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className={cn("rounded-2xl border-border/80 bg-card/95", className)}>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Entrega e Aceite Formal
          </p>
          {isAccepted ? (
            <p className="mt-1 text-sm font-semibold text-success">
              Aceito em {formatDateTime(acceptedAt)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {deliveredAt
                ? `Entregue em ${deliveredAt}. Aguardando aceite formal do cliente.`
                : "Registre o aceite formal quando o cliente confirmar."}
            </p>
          )}
        </div>

        {isAccepted ? (
          <div className="rounded-xl border border-success/30 bg-success/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-success">
              Notas do aceite
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
              {acceptanceNotes?.trim() || "Sem ressalvas registradas."}
            </p>
          </div>
        ) : (
          <>
            <Field>
              <Label>Notas do aceite (opcional)</Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ressalvas, observações ou contexto do aceite..."
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={submitting} onClick={() => void handleAccept()}>
                {submitting ? "Registrando..." : "Registrar aceite formal"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
