import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface JsonHeaders extends HeadersInit {
  [key: string]: string;
}

function jsonResponse(body: Record<string, unknown>, status: number, headers: JsonHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

/**
 * Compara duas strings em tempo constante para evitar timing attacks.
 * Usar sempre que comparar segredos (tokens, API keys, etc).
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Detecta se a request traz o service-role key como Bearer.
 * Usado por cron/triggers SQL que chamam a função com service-role.
 * Comparacao constant-time para mitigar timing attack.
 */
export function isServiceRoleRequest(req: Request): boolean {
  const token = getBearerToken(req);
  if (!token) return false;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey) return false;
  return timingSafeEqualStr(token, serviceKey);
}

export function createServiceRoleClient() {
  return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Valida que o request traz um Bearer token de usuário autenticado valido.
 * Nao exige role especifica — util para funcoes invocadas por qualquer
 * usuario logado (ex: cliente abrindo ticket).
 * Retorna { user, adminClient } em sucesso, ou Response de erro.
 */
export async function requireAuthenticatedUser(req: Request, headers: JsonHeaders) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return jsonResponse({ error: "Missing authorization header" }, 401, headers);
    }

    const adminClient = createServiceRoleClient();

    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401, headers);
    }

    return { user, adminClient };
  } catch (error) {
    console.error("[auth] unexpected authorization failure", error);
    return jsonResponse({ error: "Internal error" }, 500, headers);
  }
}

export async function requireAdminAccess(req: Request, headers: JsonHeaders) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return jsonResponse({ error: "Missing authorization header" }, 401, headers);
    }

    const adminClient = createServiceRoleClient();

    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401, headers);
    }

    const { data: adminRole, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin_super", "admin"])
      .limit(1)
      .maybeSingle();

    if (roleError) {
      console.error("[auth] failed to validate admin role", roleError);
      return jsonResponse({ error: "Failed to validate permissions" }, 500, headers);
    }

    if (!adminRole) {
      return jsonResponse({ error: "Insufficient permissions" }, 403, headers);
    }

    return { user, adminClient };
  } catch (error) {
    console.error("[auth] unexpected authorization failure", error);
    return jsonResponse({ error: "Internal error" }, 500, headers);
  }
}

/**
 * Valida acesso operacional — roles que executam ações no fluxo
 * (admin, jurídico, comercial, po, financeiro).
 * Usado por edge functions de email/notificação que são chamadas
 * durante operações normais por qualquer membro da equipe.
 */
export async function requireOperationalAccess(req: Request, headers: JsonHeaders) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return jsonResponse({ error: "Missing authorization header" }, 401, headers);
    }

    const adminClient = createServiceRoleClient();

    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401, headers);
    }

    const { data: teamRole, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", [
        "admin_super",
        "admin",
        "comercial",
        "juridico",
        "financeiro",
        "po",
        "developer",
        "designer",
        "support",
      ])
      .limit(1)
      .maybeSingle();

    if (roleError) {
      console.error("[auth] failed to validate operational role", roleError);
      return jsonResponse({ error: "Failed to validate permissions" }, 500, headers);
    }

    if (!teamRole) {
      return jsonResponse({ error: "Insufficient permissions" }, 403, headers);
    }

    return { user, adminClient };
  } catch (error) {
    console.error("[auth] unexpected authorization failure", error);
    return jsonResponse({ error: "Internal error" }, 500, headers);
  }
}
