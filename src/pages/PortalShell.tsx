import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

declare global {
  interface Window {
    __ELKYS_FULL_CSS__?: string;
  }
}

/**
 * Pathless layout route that provides AuthProvider to all portal-related
 * routes (login, forgot-password, portal/*). Rendered only when one of
 * its child routes matches, so Supabase is never loaded for public pages.
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
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};

export default PortalShell;
