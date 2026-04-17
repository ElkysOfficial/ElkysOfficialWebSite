/**
 * Edge Function: send-ticket-opened
 * Notifica a equipe interna quando um cliente abre um ticket de suporte.
 *
 * ─── CONFIGURAÇÃO DE DESTINATÁRIOS ───────────────────────────────────────────
 * Edite o secret TICKET_NOTIFY_EMAILS no Supabase Dashboard ou CLI:
 *
 *   supabase secrets set TICKET_NOTIFY_EMAILS="suporte@elkys.com.br,fulano@elkys.com.br"
 *
 * Separe múltiplos e-mails com vírgula. Fácil de alterar sem re-deploy.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deploy:
 *   supabase functions deploy send-ticket-opened
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL,
 *          TICKET_NOTIFY_EMAILS, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";
import { escapeHtml } from "../_shared/validation.ts";
import { requireAuthenticatedUser } from "../_shared/auth.ts";

interface Payload {
  ticket_id: string;
  client_id: string;
  subject: string;
  body: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Cliente invoca ao abrir ticket. Aceita qualquer usuario autenticado valido
    // (role nao e necessaria aqui — a origem do ticket ja e validada via RLS no insert).
    const auth = await requireAuthenticatedUser(req, CORS);
    if (auth instanceof Response) return auth;

    const { ticket_id, client_id, subject, body } = (await req.json()) as Payload;

    if (!ticket_id || !client_id || !subject || !body) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ─── Configuração de destinatários via Secret ─────────────────────────────
    const NOTIFY_EMAILS_RAW = Deno.env.get("TICKET_NOTIFY_EMAILS") ?? "";
    const notifyEmails = NOTIFY_EMAILS_RAW.split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (notifyEmails.length === 0) {
      console.warn("[send-ticket-opened] TICKET_NOTIFY_EMAILS not set - skipping notification");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/admin";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch client info
    const { data: client } = await admin
      .from("clients")
      .select("full_name, email, nome_fantasia")
      .eq("id", client_id)
      .maybeSingle();

    const clientName = client?.nome_fantasia || client?.full_name || "Cliente";
    const clientEmail = client?.email ?? "";
    const ticketUrl = `${PORTAL_URL}/suporte`;

    // Truncate body preview for email
    const bodyPreview = body.length > 300 ? body.slice(0, 297) + "..." : body;

    const html = buildEmail({
      preheader: `Novo ticket aberto por ${clientName}: "${subject}"`,
      title: "Novo ticket de suporte",
      greeting: "Nova solicitação recebida",
      body: `
        <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Um cliente abriu um novo ticket de suporte no portal. Verifique e responda o mais breve possível.</p>
      `,
      highlight: {
        title: "Detalhes da solicitação",
        rows: [
          { label: "Cliente", value: clientName },
          { label: "E-mail", value: clientEmail },
          { label: "Assunto", value: subject },
        ],
      },
      button: {
        label: "Ver ticket no painel →",
        href: ticketUrl,
      },
      note: `<strong>Mensagem do cliente:</strong><br/><em style="color:#52525b;">"${escapeHtml(bodyPreview)}"</em>`,
    });

    // Send to all configured recipients
    const results = await Promise.allSettled(
      notifyEmails.map((email) =>
        sendEmail({
          to: email,
          subject: `[Suporte] Novo ticket: ${subject}`,
          html,
        })
      )
    );

    const failures = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)
    );
    if (failures.length > 0) {
      console.warn(`[send-ticket-opened] ${failures.length} email(s) failed`);
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
