/**
 * Edge Function: expire-proposals
 * Cron job that marks sent proposals as expired when valid_until < today.
 *
 * Deploy:
 *   supabase functions deploy expire-proposals --no-verify-jwt
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const today = new Date().toISOString().slice(0, 10);

    // Find proposals that should be expired
    const { data: expiredProposals, error: queryError } = await admin
      .from("proposals")
      .select("id, title")
      .eq("status", "enviada")
      .lt("valid_until", today);

    if (queryError || !expiredProposals?.length) {
      return new Response(
        JSON.stringify({
          ok: true,
          expired: 0,
          reason: queryError?.message ?? "No proposals to expire",
        }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const ids = expiredProposals.map((p) => p.id);

    // Update all at once
    const { error: updateError } = await admin
      .from("proposals")
      .update({
        status: "expirada",
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (updateError) {
      return new Response(JSON.stringify({ ok: false, error: updateError.message }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Notify admins about expired proposals
    if (expiredProposals.length > 0) {
      const titles = expiredProposals
        .slice(0, 5)
        .map((p) => p.title)
        .join(", ");
      const suffix = expiredProposals.length > 5 ? ` e mais ${expiredProposals.length - 5}` : "";

      void admin.from("admin_notifications").insert({
        type: "propostas_expiradas",
        title: `${expiredProposals.length} proposta(s) expirada(s)`,
        body: `As seguintes propostas foram marcadas como expiradas: ${titles}${suffix}.`,
        severity: "warning",
        target_roles: ["admin_super", "admin"],
      });
    }

    return new Response(JSON.stringify({ ok: true, expired: expiredProposals.length }), {
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
