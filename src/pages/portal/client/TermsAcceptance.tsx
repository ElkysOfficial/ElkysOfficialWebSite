import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function TermsAcceptance() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [reachedBottom, setReachedBottom] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkBottom = () => {
      const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceToBottom <= SCROLL_BOTTOM_TOLERANCE_PX) {
        setReachedBottom(true);
      }
    };

    // Caso o conteudo seja menor que a viewport (improvavel, mas defensivo).
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
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("clients")
      .update({
        terms_accepted_at: now,
        terms_version: LEGAL_VERSION,
        privacy_accepted_at: now,
        privacy_version: LEGAL_VERSION,
      } as never)
      .eq("user_id", user.id);

    setSubmitting(false);

    if (error) {
      toast.error("Nao foi possivel registrar o aceite. Tente novamente.");
      return;
    }

    toast.success("Aceite registrado. Bem-vindo(a) ao portal Elkys!");
    navigate("/portal/cliente", { replace: true });
  };

  const handleDecline = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-5 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary mb-1">
            Aceite obrigatorio
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Termos de Uso, Politica de Privacidade e Cookies
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Para acessar o portal pela primeira vez, role o documento ate o fim e marque os dois
            aceites abaixo. Versao {LEGAL_VERSION}.
          </p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl w-full">
        <div
          ref={scrollRef}
          className="h-[60vh] sm:h-[65vh] overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm"
        >
          <article className="max-w-none">
            <h2 className="text-2xl font-bold text-foreground mb-2">Parte I - Termos de Uso</h2>
            <p className="text-sm text-muted-foreground mb-8">Versao 2.0 - Vigencia atual</p>
            <TermsBody />

            <hr className="my-12 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Parte II - Politica de Privacidade
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Em conformidade com a LGPD (Lei n. 13.709/2018)
            </p>
            <PrivacyBody />

            <hr className="my-12 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Parte III - Politica de Cookies
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Tecnologias de armazenamento utilizadas pela aplicacao
            </p>
            <CookieBody />

            <div className="mt-10 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-sm font-semibold text-foreground">Fim do documento</p>
              <p className="text-xs text-muted-foreground mt-1">
                Voce ja pode marcar os aceites abaixo.
              </p>
            </div>
          </article>
        </div>

        {!reachedBottom && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Role o documento ate o fim para liberar os aceites.
          </p>
        )}

        <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
          <label
            className={`flex items-start gap-3 ${reachedBottom ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-border accent-primary"
              checked={acceptTerms}
              disabled={!reachedBottom}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <span className="text-sm text-foreground">
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
            />
            <span className="text-sm text-foreground">
              Li e aceito a <strong>Politica de Privacidade</strong> e a{" "}
              <strong>Politica de Cookies</strong> (Partes II e III).
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button variant="ghost" onClick={handleDecline} disabled={submitting}>
            Recusar e sair
          </Button>
          <Button onClick={handleAccept} disabled={!canSubmit} loading={submitting}>
            Aceitar e continuar
          </Button>
        </div>
      </main>
    </div>
  );
}
