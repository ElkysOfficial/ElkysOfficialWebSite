/**
 * Edge Function: update-user
 * Sincroniza dados de identidade no Auth e no profile do usuário.
 *
 * Deploy:
 *   supabase functions deploy update-user --no-verify-jwt
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { CORS } from "../_shared/email-template.ts";
import { requireAdminAccess } from "../_shared/auth.ts";

interface Payload {
  user_id: string;
  email?: string;
  full_name?: string;
  phone?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const auth = await requireAdminAccess(req, CORS);
    if (auth instanceof Response) return auth;

    const { user_id, email, full_name, phone } = (await req.json()) as Payload;

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: currentUserData, error: currentUserError } =
      await auth.adminClient.auth.admin.getUserById(user_id);

    if (currentUserError || !currentUserData.user) {
      return new Response(
        JSON.stringify({ error: currentUserError?.message ?? "User not found" }),
        {
          status: 404,
          headers: { ...CORS, "Content-Type": "application/json" },
        }
      );
    }

    const authUpdatePayload: {
      email?: string;
      email_confirm?: boolean;
      user_metadata?: Record<string, unknown>;
    } = {};

    const trimmedEmail = email?.trim();
    const trimmedFullName = full_name?.trim();

    if (trimmedEmail) {
      authUpdatePayload.email = trimmedEmail;
      authUpdatePayload.email_confirm = true;
    }

    if (trimmedFullName) {
      authUpdatePayload.user_metadata = {
        ...(currentUserData.user.user_metadata ?? {}),
        full_name: trimmedFullName,
      };
    }

    if (Object.keys(authUpdatePayload).length > 0) {
      const { error: authUpdateError } = await auth.adminClient.auth.admin.updateUserById(
        user_id,
        authUpdatePayload
      );

      if (authUpdateError) {
        return new Response(JSON.stringify({ error: authUpdateError.message }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    const profileUpdatePayload: Record<string, unknown> = {};

    if (trimmedEmail) profileUpdatePayload.email = trimmedEmail;
    if (trimmedFullName) profileUpdatePayload.full_name = trimmedFullName;
    if (phone !== undefined) profileUpdatePayload.phone = phone;

    if (Object.keys(profileUpdatePayload).length > 0) {
      const { error: profileUpdateError } = await auth.adminClient
        .from("profiles")
        .update(profileUpdatePayload)
        .eq("id", user_id);

      if (profileUpdateError) {
        return new Response(JSON.stringify({ error: profileUpdateError.message }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
