import { useEffect, useState } from "react";
import { Button, Field, Label, Textarea, cn } from "@/design-system";

/**
 * Lista estruturada de motivos para facilitar analise posterior de
 * padrao de rejeicao (top 5 razoes perdidas) sem depender de texto
 * livre. Cada chave representa uma categoria agregavel; o detalhe e
 * armazenado junto no rejection_reason como "[chave] texto livre".
 */
const REJECTION_REASONS = [
  {
    key: "preco",
    label: "Preço / valor acima do esperado",
    hint: "Cliente achou caro ou fora do orçamento disponível.",
  },
  {
    key: "prazo",
    label: "Prazo incompatível",
    hint: "Cliente precisava entrega mais rápida ou em janela diferente.",
  },
  {
    key: "escopo",
    label: "Escopo não atende",
    hint: "Proposta não cobria requisitos esperados pelo cliente.",
  },
  {
    key: "concorrente",
    label: "Escolheu concorrente",
    hint: "Fechou com outro fornecedor. Se souber qual, coloque no detalhe.",
  },
  {
    key: "sem_orcamento",
    label: "Sem orçamento no momento",
    hint: "Adiou a decisão por falta de verba. Possível retomada futura.",
  },
  {
    key: "sem_retorno",
    label: "Cliente sumiu / sem retorno",
    hint: "Tentamos contato mas não obtivemos resposta.",
  },
  {
    key: "outro",
    label: "Outro motivo",
    hint: "Descreva no campo de detalhes.",
  },
] as const;

type RejectionKey = (typeof REJECTION_REASONS)[number]["key"];

interface ProposalRejectModalProps {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  /** Recebe a string final formatada "[chave] detalhes" para persistir em rejection_reason */
  onConfirm: (reasonText: string) => void;
}

/**
 * Modal de rejeicao de proposta com motivo estruturado. Forca o admin
 * a categorizar o motivo em uma das 7 categorias padronizadas, o que
 * permite analise posterior de "top motivos de perda" no CRM sem
 * depender de parsing de texto livre.
 *
 * O campo de detalhes e opcional por padrao, exceto quando "Outro"
 * esta selecionado — ai vira obrigatorio para nao perder contexto.
 */
export default function ProposalRejectModal({
  open,
  submitting,
  onCancel,
  onConfirm,
}: ProposalRejectModalProps) {
  const [selectedKey, setSelectedKey] = useState<RejectionKey>("preco");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setSelectedKey("preco");
      setDetails("");
      setError(null);
    }
  }, [open]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, submitting, onCancel]);

  // Trava scroll do body enquanto aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  const selected = REJECTION_REASONS.find((r) => r.key === selectedKey)!;
  const requiresDetails = selectedKey === "outro";

  const handleConfirm = () => {
    if (requiresDetails && details.trim().length < 3) {
      setError("Descreva o motivo com pelo menos 3 caracteres.");
      return;
    }
    const trimmed = details.trim();
    const formatted = trimmed ? `[${selected.label}] ${trimmed}` : `[${selected.label}]`;
    onConfirm(formatted);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-reject-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={submitting ? undefined : onCancel}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-150">
        <div className="rounded-2xl border border-border/70 bg-card shadow-2xl">
          <div className="px-6 pt-6 pb-4">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-destructive"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </div>
            <h2 id="proposal-reject-title" className="text-base font-semibold text-foreground">
              Rejeitar proposta
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Ao rejeitar, a proposta sai do funil ativo e entra nas estatísticas de perda. Escolha
              o motivo mais próximo da realidade — isso alimenta a análise de top motivos de perda
              no CRM.
            </p>
          </div>

          <div className="space-y-4 px-6 pb-4">
            <Field>
              <Label htmlFor="rejection_reason_key">Motivo principal</Label>
              <div className="mt-2 space-y-1.5">
                {REJECTION_REASONS.map((reason) => (
                  <label
                    key={reason.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      selectedKey === reason.key
                        ? "border-destructive/50 bg-destructive/5"
                        : "border-border/60 bg-background hover:border-destructive/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="rejection_reason"
                      value={reason.key}
                      checked={selectedKey === reason.key}
                      onChange={() => setSelectedKey(reason.key)}
                      className="mt-0.5 accent-destructive"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{reason.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{reason.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Field>

            <Field>
              <Label htmlFor="rejection_details">
                Detalhes {requiresDetails ? "*" : "(opcional)"}
              </Label>
              <Textarea
                id="rejection_details"
                value={details}
                onChange={(e) => {
                  setDetails(e.target.value);
                  if (error) setError(null);
                }}
                rows={3}
                placeholder={
                  requiresDetails
                    ? "Descreva o motivo específico..."
                    : "Contexto adicional, nome do concorrente, etc."
                }
                className={cn(error && "border-destructive")}
              />
              {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
            </Field>
          </div>

          <div className="border-t border-border/60" />
          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              loading={submitting}
              loadingText="Rejeitando..."
            >
              Rejeitar proposta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
