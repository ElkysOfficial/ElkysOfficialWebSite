import { useState } from "react";
import { toast } from "sonner";

import { Button, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";

type ContractStatus = "rascunho" | "ativo" | "encerrado" | "cancelado";

type Props = {
  contractId: string;
  status: ContractStatus | null;
  onTransitioned?: () => void;
  className?: string;
};

/**
 * Botoes contextuais para transitar um contrato pelo ciclo de vida
 * juridico (rascunho → ativo → encerrado/cancelado). Chama a RPC
 * transition_project_contract (PROBLEMA 14) que e atomica e dispara
 * o trigger de versionamento automaticamente.
 *
 * Retorna null para estados terminais (encerrado/cancelado) — sem acoes.
 */
export default function ContractActionsButtons({
  contractId,
  status,
  onTransitioned,
  className,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  async function transitionTo(toStatus: "ativo" | "encerrado" | "cancelado") {
    if (submitting) return;
    const reason = window.prompt(`Motivo da transição para "${toStatus}" (opcional):`);
    if (reason === null) return; // cancelado pelo admin
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("transition_project_contract", {
        p_contract_id: contractId,
        p_to_status: toStatus,
        p_signed_at: null,
        p_ends_at: null,
        p_reason: reason.trim() || null,
      });
      if (error) {
        toast.error("Erro ao transicionar contrato.", {
          description: error.message,
        });
        return;
      }
      toast.success(`Contrato ${toStatus}.`);
      onTransitioned?.();
    } finally {
      setSubmitting(false);
    }
  }

  if (!status || status === "encerrado" || status === "cancelado") {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {status === "rascunho" ? (
        <Button size="sm" disabled={submitting} onClick={() => void transitionTo("ativo")}>
          Ativar contrato
        </Button>
      ) : null}
      {status === "ativo" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={submitting}
          onClick={() => void transitionTo("encerrado")}
        >
          Encerrar
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        className="border-destructive/40 text-destructive hover:bg-destructive/10"
        disabled={submitting}
        onClick={() => void transitionTo("cancelado")}
      >
        Cancelar contrato
      </Button>
    </div>
  );
}
