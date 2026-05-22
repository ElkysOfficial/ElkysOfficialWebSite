import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/design-system";

declare global {
  interface Window {
    __ELKYS_FULL_CSS__?: string;
  }
}

// QueryClient vive aqui (nao no root App.tsx): nenhuma pagina publica
// consome React Query — so o portal (AuthContext + hooks useAdmin*/
// useClient*). Como PortalShell e lazy, o chunk query-vendor (~9KB gzip)
// so baixa quando o usuario entra em /login, /forgot-password ou /portal/*.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 2 minutes — no refetch during this window
      staleTime: 2 * 60 * 1000,
      // Keep inactive data in memory for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Background refetch when user returns to tab — apenas se stale
      // (coerente com staleTime; antes estava "always", que forcava refetch
      // mesmo dentro da janela fresca, contradizendo a intencao do staleTime).
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is still fresh
      refetchOnMount: true,
      // Single retry on failure
      retry: 1,
    },
  },
});

/**
 * Pathless layout route that provides AuthProvider + QueryClientProvider to
 * all portal-related routes (login, forgot-password, portal/*). Rendered
 * only when one of its child routes matches, so Supabase e React Query
 * nunca sao carregados para paginas publicas.
 *
 * Tambem carrega o CSS completo (com utilities Tailwind portal-only) sob
 * demanda. O HTML inline contem so o subset usado pela landing; quando o
 * usuario navega pra /login ou /portal/*, esse useEffect dispara e baixa
 * o restante do CSS (lazy, sem bloquear primeira renderizacao da landing).
 * Path do CSS vem de window.__ELKYS_FULL_CSS__ injetado no build pelo
 * plugin landingCssSplit (vite.config.ts).
 */
const PortalShell = () => {
  useEffect(() => {
    const fullCssPath = window.__ELKYS_FULL_CSS__;
    if (!fullCssPath) return;
    if (document.querySelector('link[data-portal-css="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fullCssPath;
    link.dataset.portalCss = "true";
    document.head.appendChild(link);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Toaster montado aqui (em vez de no root App.tsx): 39 dos 40
            consumers de toast() vivem no portal, e PortalShell ja e lazy.
            Visitantes que nao entram no portal/login nao baixam sonner. */}
        <Toaster />
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default PortalShell;
