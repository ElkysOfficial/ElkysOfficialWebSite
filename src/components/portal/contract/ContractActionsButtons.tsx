import { useState } from "react";
import { toast } from "sonner";

import { Button, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";

type ContractStatus = "rascunho" | "em_validacao" | "ativo" | "encerrado" | "cancelado";

type Props = {
  contractId: string;
  clientId: string;
  projectName: string;
  scopeSummary?: string | null;
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
  clientId,
  projectName,
  scopeSummary,
  status,
  onTransitioned,
  className,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  async function transitionTo(toStatus: "em_validacao" | "ativo" | "encerrado" | "cancelado") {
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

      // Enviar email ao cliente quando contrato é enviado para validação
      if (toStatus === "em_validacao" && clientId) {
        try {
          const headers = await getSupabaseFunctionAuthHeaders();
          void supabase.functions.invoke("send-contract-validation", {
            body: {
              contract_id: contractId,
              client_id: clientId,
              project_name: projectName,
              scope_summary: scopeSummary ?? undefined,
            },
            headers,
          });
        } catch {
          // Fire-and-forget
        }

        // L3: Notif in-app para admin sobre envio
        void supabase.from("admin_notifications").insert({
          type: "contrato_enviado_validacao",
          title: `Contrato enviado: ${projectName}`,
          body: `O contrato do projeto "${projectName}" foi enviado para assinatura do cliente.`,
          severity: "info",
          target_roles: ["admin_super", "admin"],
          entity_type: "project_contract",
          entity_id: contractId,
          action_url: "/portal/admin/contratos",
        });
      }

      // Quando contrato é ATIVADO: criar projeto + cobranças + onboarding via RPC
      if (toStatus === "ativo") {
        const { data: activateResult, error: activateError } = await supabase.rpc(
          "activate_contract_to_project",
          { p_contract_id: contractId }
        );
        if (activateError) {
          toast.error("Contrato ativado, mas erro ao criar projeto.", {
            description: activateError.message,
          });
        } else {
          toast.success("Projeto e cobranças criados automaticamente.");

          // L4: Email ao cliente notificando que projeto foi criado
          const result = activateResult as { project_id?: string; already_exists?: boolean } | null;
          if (result?.project_id && !result?.already_exists && clientId) {
            try {
              const emailHeaders = await getSupabaseFunctionAuthHeaders();
              void supabase.functions.invoke("send-project-created", {
                body: {
                  client_id: clientId,
                  project_name: projectName,
                },
                headers: emailHeaders,
              });
            } catch {
              // Fire-and-forget
            }
          }
        }
      }

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
        <>
          <Button size="sm" disabled={submitting} onClick={() => void transitionTo("em_validacao")}>
            Enviar para validação
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => void transitionTo("ativo")}
          >
            Ativar direto
          </Button>
        </>
      ) : null}
      {status === "em_validacao" ? (
        <Button size="sm" disabled={submitting} onClick={() => void transitionTo("ativo")}>
          Validar assinatura e ativar
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
