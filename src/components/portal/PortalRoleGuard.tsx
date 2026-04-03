import { Navigate } from "react-router-dom";

import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { getDefaultAdminRoute } from "@/lib/portal-access";

interface PortalRoleGuardProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export default function PortalRoleGuard({
  children,
  allowedRoles,
  redirectTo,
}: PortalRoleGuardProps) {
  const { isLoading, roles } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-border/70 bg-card/90">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (roles.some((role) => allowedRoles.includes(role))) {
    return <>{children}</>;
  }

  return <Navigate to={redirectTo ?? getDefaultAdminRoute(roles)} replace />;
}
