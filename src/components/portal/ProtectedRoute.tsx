import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  requiredRole?: "admin" | "team" | "cliente";
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, isLoading, isAdmin, isClient, isTeamMember } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // "admin" requiredRole now also accepts all team roles
  if (requiredRole === "admin" && !isTeamMember) {
    return <Navigate to="/portal/cliente" replace />;
  }

  if (requiredRole === "team" && !isTeamMember) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === "cliente" && !isClient && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
