import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

/**
 * Pathless layout route that provides AuthProvider to all portal-related
 * routes (login, forgot-password, portal/*).  Rendered only when one of
 * its child routes matches, so Supabase is never loaded for public pages.
 */
const PortalShell = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

export default PortalShell;
