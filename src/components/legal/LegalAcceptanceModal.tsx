import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LEGAL_VERSION } from "@/components/legal/legalConfig";
import TermsBody from "@/components/legal/TermsBody";
import PrivacyBody from "@/components/legal/PrivacyBody";
import CookieBody from "@/components/legal/CookieBody";

// Tolerancia em pixels para considerar que o scroll chegou ao fim.
// Evita falso negativo por subpixel rounding em telas DPI alto.
const SCROLL_BOTTOM_TOLERANCE_PX = 20;

interface LegalAcceptanceModalProps {
  // Callback chamado apos aceite bem-sucedido. Permite ao guard sair
  // do estado "needsAcceptance" sem refetch ou navigate.
  onAccepted: () => void;
}

export default function LegalAcceptanceModal({ onAccepted }: LegalAcceptanceModalProps) {
  const { user, signOut } = useAuth();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [reachedBottom, setReachedBottom] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Trava o scroll do body enquanto o modal estiver aberto.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkBottom = () => {
      const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceToBottom <= SCROLL_BOTTOM_TOLERANCE_PX) {
        setReachedBottom(true);
      }
    };

    if (el.scrollHeight - el.clientHeight <= SCROLL_BOTTOM_TOLERANCE_PX) {
      setReachedBottom(true);
      return;
    }

    el.addEventListener("scroll", checkBottom, { passive: true });
    return () => el.removeEventListener("scroll", checkBottom);
  }, []);

  const canSubmit = reachedBottom && acceptTerms && acceptPrivacy && !submitting;

  const handleAccept = async () => {
    if (!user || !canSubmit) return;
    setSubmitting(true);

    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null;

    const { data, error } = await supabase.rpc(
      "client_accept_terms" as never,
      {
        p_version: LEGAL_VERSION,
        p_user_agent: userAgent,
      } as never
    );

    setSubmitting(false);

    if (error) {
      toast.error("Nao foi possivel registrar o aceite. Tente novamente.");
      return;
    }

    if (data !== true) {
      toast.error("Nao foi possivel localizar seu cadastro de cliente. Contate o suporte.");
      return;
    }

    toast.success("Aceite registrado. Bem-vindo(a) ao portal Elkys!");
    onAccepted();
  };

  const handleDecline = async () => {
    await signOut();
  };

  // Aciona o dialogo nativo de impressao do navegador, que oferece
  // "Salvar como PDF" como destino. Vetorial, com texto pesquisavel,
  // sem dependencias adicionais. O conteudo impresso e somente o no
  // marcado com #legal-print-area (regras em styles/_utilities.scss
  // sob body.printing-legal @media print).
  const handleDownloadPdf = () => {
    const printRoot = document.getElementById("legal-print-area");
    if (!printRoot) return;
    document.body.classList.add("printing-legal");
    window.print();
    document.body.classList.remove("printing-legal");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
    >
      <div className="flex h-full w-full flex-col bg-card shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl">
        <header className="border-b border-border px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary mb-1 sm:text-xs">
            Aceite obrigatorio
          </p>
          <h2 id="legal-modal-title" className="text-lg font-bold text-foreground sm:text-xl">
            Termos de Uso, Politica de Privacidade e Cookies
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Para acessar o portal pela primeira vez, role o documento ate o fim e marque os dois
            aceites abaixo. Versao {LEGAL_VERSION}.
          </p>
        </header>

        <div
          ref={scrollRef}
          id="legal-print-area"
          className="legal-print-area flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6"
        >
          <article className="max-w-none">
            <h3 className="text-2xl font-bold text-foreground mb-2">Parte I - Termos de Uso</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Versao {LEGAL_VERSION} - Vigencia atual
            </p>
            <TermsBody />

            <hr className="my-12 border-border" />

            <h3 className="text-2xl font-bold text-foreground mb-2">
              Parte II - Politica de Privacidade
            </h3>
            <p className="text-sm text-muted-foreground mb-8">
              Em conformidade com a LGPD (Lei n. 13.709/2018)
            </p>
            <PrivacyBody />

            <hr className="my-12 border-border" />

            <h3 className="text-2xl font-bold text-foreground mb-2">
              Parte III - Politica de Cookies
            </h3>
            <p className="text-sm text-muted-foreground mb-8">
              Tecnologias de armazenamento utilizadas pela aplicacao
            </p>
            <CookieBody />

            <div className="mt-10 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center print:hidden">
              <p className="text-sm font-semibold text-foreground">Fim do documento</p>
              <p className="text-xs text-muted-foreground mt-1">
                Voce ja pode marcar os aceites abaixo.
              </p>
            </div>
          </article>
        </div>

        <footer className="border-t border-border bg-card/95 px-5 py-4 sm:px-6 sm:py-5 print:hidden">
          {!reachedBottom && (
            <p className="mb-3 text-center text-xs text-muted-foreground">
              Role o documento ate o fim para liberar os aceites.
            </p>
          )}

          <div className="space-y-3">
            <label
              className={`flex items-start gap-3 ${reachedBottom ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-border accent-primary"
                checked={acceptTerms}
                disabled={!reachedBottom}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                aria-describedby="accept-terms-desc"
              />
              <span id="accept-terms-desc" className="text-sm text-foreground">
                Li e aceito os <strong>Termos de Uso</strong> da Elkys (Parte I).
              </span>
            </label>

            <label
              className={`flex items-start gap-3 ${reachedBottom ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-border accent-primary"
                checked={acceptPrivacy}
                disabled={!reachedBottom}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                aria-describedby="accept-privacy-desc"
              />
              <span id="accept-privacy-desc" className="text-sm text-foreground">
                Li e aceito a <strong>Politica de Privacidade</strong> e a{" "}
                <strong>Politica de Cookies</strong> (Partes II e III).
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button variant="ghost" onClick={handleDecline} disabled={submitting}>
                Recusar e sair
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf} disabled={submitting}>
                Baixar PDF
              </Button>
            </div>
            <Button onClick={handleAccept} disabled={!canSubmit} loading={submitting}>
              Aceitar e continuar
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
