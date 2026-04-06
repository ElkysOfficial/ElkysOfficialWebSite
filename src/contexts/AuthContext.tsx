import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin_super" | "admin" | "cliente" | "marketing" | "developer" | "support";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isSuperAdmin: boolean;
  isMarketing: boolean;
  isDeveloper: boolean;
  isSupport: boolean;
  isTeamMember: boolean;
}

interface AuthContextType extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 min
const WARNING_BEFORE = 2 * 60 * 1000; // 2 min warning

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    isLoading: true,
    isAdmin: false,
    isClient: false,
    isSuperAdmin: false,
    isMarketing: false,
    isDeveloper: false,
    isSupport: false,
    isTeamMember: false,
  });

  const inactivityTimer = useRef<ReturnType<typeof setTimeout>>();
  const warningTimer = useRef<ReturnType<typeof setTimeout>>();
  const authSyncId = useRef(0);

  const fetchRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (error) throw error;
    if (!data) return [];
    return data.map((r) => r.role as AppRole);
  }, []);

  const updateState = useCallback(
    (user: User | null, session: Session | null, roles: AppRole[]) => {
      setState({
        user,
        session,
        roles,
        isLoading: false,
        isAdmin: roles.includes("admin_super") || roles.includes("admin"),
        isClient: roles.includes("cliente"),
        isSuperAdmin: roles.includes("admin_super"),
        isMarketing: roles.includes("marketing"),
        isDeveloper: roles.includes("developer"),
        isSupport: roles.includes("support"),
        isTeamMember:
          roles.includes("admin_super") ||
          roles.includes("admin") ||
          roles.includes("marketing") ||
          roles.includes("developer") ||
          roles.includes("support"),
      });
    },
    []
  );

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Auth bootstrap timeout")), ms);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    clearTimeout(inactivityTimer.current);
    clearTimeout(warningTimer.current);
    await supabase.auth.signOut();
    updateState(null, null, []);
  }, [updateState]);

  const resolveSessionState = useCallback(
    async (session: Session | null) => {
      const syncId = ++authSyncId.current;

      try {
        if (!session?.user) {
          if (syncId === authSyncId.current) updateState(null, null, []);
          return;
        }

        const roles = await withTimeout(fetchRoles(session.user.id), 8000);

        if (syncId !== authSyncId.current) return;

        if (roles.length === 0) {
          await supabase.auth.signOut();

          if (syncId === authSyncId.current) {
            updateState(null, null, []);
            window.dispatchEvent(
              new CustomEvent("auth-no-access", {
                detail:
                  "Sua conta não possui acesso ao portal. Entre em contato com a Elkys para solicitar o cadastro.",
              })
            );
          }
          return;
        }

        updateState(session.user, session, roles);
      } catch (error) {
        console.error("Failed to resolve auth state", error);

        if (syncId !== authSyncId.current) return;

        updateState(null, null, []);
      }
    },
    [fetchRoles, updateState, withTimeout]
  );

  // Inactivity timeout
  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    clearTimeout(warningTimer.current);
    if (!state.user) return;

    warningTimer.current = setTimeout(() => {
      // Dispatch custom event for UI warning
      window.dispatchEvent(new CustomEvent("session-expiring"));
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    inactivityTimer.current = setTimeout(() => {
      handleSignOut();
      window.dispatchEvent(new CustomEvent("session-expired"));
    }, INACTIVITY_TIMEOUT);
  }, [state.user, handleSignOut]);

  useEffect(() => {
    if (!state.user) return;
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handler = () => resetInactivityTimer();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearTimeout(inactivityTimer.current);
      clearTimeout(warningTimer.current);
    };
  }, [state.user, resetInactivityTimer]);

  // Auth state listener
  useEffect(() => {
    let active = true;

    const queueSessionResolution = (session: Session | null) => {
      window.setTimeout(() => {
        if (!active) return;
        void resolveSessionState(session);
      }, 0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queueSessionResolution(session);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        void resolveSessionState(session);
      })
      .catch((error) => {
        console.error("Failed to bootstrap auth session", error);
        if (active) setState((prev) => ({ ...prev, isLoading: false }));
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [resolveSessionState]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login")) {
        return { error: "E-mail ou senha incorretos." };
      }
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/login" },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithEmail,
        signInWithGoogle,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
