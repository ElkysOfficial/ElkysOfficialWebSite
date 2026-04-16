/**
 * Helper de autenticacao para chamar Supabase Edge Functions.
 *
 * As edge functions exigem header Authorization com o access_token.
 * Este helper garante que o token esta valido (refresh automatico
 * se expira em menos de 60s).
 *
 * @module supabase-functions
 */

import { supabase } from "@/integrations/supabase/client";

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;

/** Retorna headers de auth para invocar edge functions. Faz refresh se necessario. */
export async function getSupabaseFunctionAuthHeaders() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error("Não foi possível validar a sessão atual.");

  let session = sessionData.session;
  const expiresSoon =
    session?.expires_at !== undefined &&
    session.expires_at * 1000 <= Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS;

  if (!session?.access_token || expiresSoon) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session?.access_token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    session = refreshData.session;
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}
