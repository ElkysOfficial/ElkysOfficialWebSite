import { Navigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import AdminOverview from "@/pages/portal/admin/Overview";

export default function AdminPortalHome() {
  const { roles } = useAuth();

  if (roles.includes("admin_super") || roles.includes("admin")) {
    return <AdminOverview />;
  }

  if (roles.includes("marketing")) {
    return <Navigate to="/portal/admin/calendario" replace />;
  }

  if (roles.includes("developer")) {
    return <Navigate to="/portal/admin/projetos" replace />;
  }

  if (roles.includes("support")) {
    return <Navigate to="/portal/admin/suporte" replace />;
  }

  return <Navigate to="/login" replace />;
}
