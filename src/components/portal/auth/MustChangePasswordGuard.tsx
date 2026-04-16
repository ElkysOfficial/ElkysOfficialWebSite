import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Redirects clients to the password-change page when must_change_password = true.
 * Wraps the ClientLayout so it applies to all client portal routes.
 */
export default function MustChangePasswordGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mustChange, setMustChange] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("clients")
      .select("must_change_password")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setMustChange(data?.must_change_password ?? false);
      });
  }, [user]);

  // Still loading
  if (mustChange === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (mustChange) {
    return <Navigate to="/portal/cliente/alterar-senha" replace />;
  }

  return <>{children}</>;
}
