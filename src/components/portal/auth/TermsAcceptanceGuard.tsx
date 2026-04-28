import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LEGAL_VERSION } from "@/components/legal/legalConfig";

// Aplica-se apenas ao portal do cliente. Bloqueia o acesso ao portal
// enquanto o cliente nao tiver registrado aceite dos Termos de Uso e
// das politicas de Privacidade/Cookies na versao corrente (LEGAL_VERSION).
//
// Quando publicarmos uma versao nova das politicas, basta incrementar
// LEGAL_VERSION em legalConfig.ts: todos os clientes serao redirecionados
// para a tela de aceite no proximo acesso.
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

  if (needsAcceptance === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (needsAcceptance) {
    return <Navigate to="/portal/cliente/aceitar-termos" replace />;
  }

  return <>{children}</>;
}
