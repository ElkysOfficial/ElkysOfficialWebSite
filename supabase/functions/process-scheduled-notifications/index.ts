// Edge Function: process-scheduled-notifications
// Cron-triggered: picks up due scheduled notifications and processes them.
// Deploy: supabase functions deploy process-scheduled-notifications
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, FROM_EMAIL, PORTAL_URL

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { CORS } from "../_shared/email-template.ts";
import { createServiceRoleClient } from "../_shared/auth.ts";
import { processNotification } from "../_shared/notification-sender.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const adminClient = createServiceRoleClient();

    // Find all due scheduled notifications
    const { data: dueNotifications, error } = await adminClient
      .from("notifications")
      .select("id")
      .eq("status", "agendada")
      .lte("send_at", new Date().toISOString())
      .limit(20);

    if (error) {
      console.error("[cron] Failed to query scheduled notifications:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (!dueNotifications?.length) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const notification of dueNotifications) {
      const result = await processNotification(adminClient, notification.id);
      if (result.ok) processed++;
      else errors++;
    }

    return new Response(JSON.stringify({ ok: true, processed, errors }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[cron] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
