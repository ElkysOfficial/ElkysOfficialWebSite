import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

const AdminOverview = lazy(() => import("@/pages/portal/admin/Overview"));

export default function AdminPortalHome() {
  const { roles } = useAuth();

  if (roles.includes("admin_super") || roles.includes("admin")) {
    return (
      <Suspense fallback={null}>
        <AdminOverview />
      </Suspense>
    );
  }

  if (roles.includes("juridico")) {
    return <Navigate to="/portal/admin/contratos" replace />;
  }

  if (roles.includes("comercial")) {
    return <Navigate to="/portal/admin/crm" replace />;
  }

  if (roles.includes("financeiro")) {
    return <Navigate to="/portal/admin/financeiro" replace />;
  }

  if (roles.includes("marketing")) {
    return <Navigate to="/portal/admin/calendario" replace />;
  }

  if (roles.includes("developer") || roles.includes("designer") || roles.includes("po")) {
    return <Navigate to="/portal/admin/projetos" replace />;
  }

  if (roles.includes("support")) {
    return <Navigate to="/portal/admin/suporte" replace />;
  }

  return <Navigate to="/login" replace />;
}
