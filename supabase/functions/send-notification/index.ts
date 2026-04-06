/**
 * Edge Function: send-notification
 * Admin-triggered: processes a notification immediately.
 *
 * Deploy:
 *   supabase functions deploy send-notification
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, FROM_EMAIL, PORTAL_URL
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { CORS } from "../_shared/email-template.ts";
import { requireAdminAccess } from "../_shared/auth.ts";
import { processNotification } from "../_shared/notification-sender.ts";

interface Payload {
  notification_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const auth = await requireAdminAccess(req, CORS);
    if (auth instanceof Response) return auth;

    const { notification_id } = (await req.json()) as Payload;

    if (!notification_id) {
      return new Response(JSON.stringify({ error: "Missing notification_id" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const result = await processNotification(auth.adminClient, notification_id);

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent_count: result.sent_count,
        error_count: result.error_count,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
