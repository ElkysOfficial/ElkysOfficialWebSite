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

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

export function createServiceRoleClient() {
  return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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
