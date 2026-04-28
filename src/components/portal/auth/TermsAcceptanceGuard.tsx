import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LEGAL_VERSION } from "@/components/legal/legalConfig";
import LegalAcceptanceModal from "@/components/legal/LegalAcceptanceModal";

// Aplica-se apenas ao portal do cliente. Quando o cliente nao tiver
// aceitado a versao corrente das politicas (LEGAL_VERSION), renderiza
// um modal full-screen sobreposto sem alterar a URL — o cliente
// percebe como "diálogo bloqueante" em cima do portal, conforme padrao
// observado em bancos brasileiros (Nubank, Itau, Inter).
//
// Quando publicarmos uma nova versao das politicas, basta incrementar
// LEGAL_VERSION em legalConfig.ts: todos os clientes serao apresentados
// ao modal no proximo acesso.
export default function TermsAcceptanceGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [needsAcceptance, setNeedsAcceptance] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("clients")
      // Cast: colunas adicionadas em 20260427120000_clients_terms_acceptance.sql.
      // Quando os types Supabase forem regenerados pelo CI, este cast pode sair.
      .select("terms_version, privacy_version" as never)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const row = (data ?? {}) as {
          terms_version?: string | null;
          privacy_version?: string | null;
        };
        const accepted =
          row.terms_version === LEGAL_VERSION && row.privacy_version === LEGAL_VERSION;
        setNeedsAcceptance(!accepted);
      });
  }, [user]);

  const handleAccepted = useCallback(() => {
    setNeedsAcceptance(false);
  }, []);

  if (needsAcceptance === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Renderizamos os children por baixo do modal: a UI do portal carrega
  // (queries iniciais aquecem o cache), mas o modal bloqueia interacao
  // ate o aceite. Pos-aceite, o cliente ja entra com tudo pronto.
  return (
    <>
      {children}
      {needsAcceptance && <LegalAcceptanceModal onAccepted={handleAccepted} />}
    </>
  );
}
