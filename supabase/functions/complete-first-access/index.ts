/**
 * Edge Function: complete-first-access
 * Limpa a flag must_change_password do usuário autenticado após a troca inicial de senha.
 *
 * Deploy:
 *   supabase functions deploy complete-first-access --no-verify-jwt
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { CORS } from "../_shared/email-template.ts";
import { createServiceRoleClient } from "../_shared/auth.ts";

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const token = getBearerToken(req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const adminClient = createServiceRoleClient();
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const [clientRes, teamRes] = await Promise.all([
      adminClient
        .from("clients")
        .update({ must_change_password: false })
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle(),
      adminClient
        .from("team_members")
        .update({ must_change_password: false })
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle(),
    ]);

    if (clientRes.error && teamRes.error) {
      return new Response(
        JSON.stringify({ error: clientRes.error.message || teamRes.error.message }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        }
      );
    }

    if (!clientRes.data && !teamRes.data) {
      return new Response(JSON.stringify({ error: "No first-access record found for user" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        updated_client: Boolean(clientRes.data),
        updated_team_member: Boolean(teamRes.data),
      }),
      {
        headers: { ...CORS, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
