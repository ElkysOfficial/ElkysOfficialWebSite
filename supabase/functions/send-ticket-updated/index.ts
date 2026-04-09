/**
 * Edge Function: send-ticket-updated
 * Notifica o cliente por e-mail quando:
 *   - Status muda para em_andamento → "Seu ticket está sendo analisado"
 *   - Status muda para resolvido   → "Seu ticket foi resolvido"
 *   - Admin envia uma resposta       → "Você recebeu uma resposta"
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL,
 *          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";
import { escapeHtml } from "../_shared/validation.ts";

type EventType = "em_andamento" | "resolvido" | "reply";

interface Payload {
  ticket_id: string;
  event: EventType;
  reply_body?: string; // presente quando event = 'reply'
}

const EVENT_SUBJECT: Record<EventType, string> = {
  em_andamento: "Seu ticket está sendo analisado",
  resolvido: "Seu ticket foi resolvido",
  reply: "Nova resposta no seu ticket",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { ticket_id, event, reply_body } = (await req.json()) as Payload;

    const VALID_EVENTS: EventType[] = ["em_andamento", "resolvido", "reply"];

    if (!ticket_id || !event) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (!VALID_EVENTS.includes(event)) {
      return new Response(JSON.stringify({ error: "Invalid event type" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/cliente";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Busca ticket + cliente
    const { data: ticket, error: ticketError } = await admin
      .from("support_tickets")
      .select("subject, body, clients(full_name, email, nome_fantasia)")
      .eq("id", ticket_id)
      .maybeSingle();

    if (ticketError || !ticket) {
      console.error("[send-ticket-updated] ticket not found", ticketError);
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const client = ticket.clients as {
      full_name?: string;
      email?: string;
      nome_fantasia?: string;
    } | null;

    const clientEmail = client?.email ?? "";
    if (!clientEmail) {
      console.warn("[send-ticket-updated] client has no email — skipping");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const clientName = client?.nome_fantasia || client?.full_name || "Cliente";
    const subject = ticket.subject as string;
    const ticketUrl = `${PORTAL_URL}/suporte`;

    let greeting = "";
    let bodyHtml = "";
    let noteHtml: string | undefined;

    if (event === "em_andamento") {
      greeting = `Olá, ${clientName}!`;
      bodyHtml = `<p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Sua solicitação de suporte foi recebida pela equipe Elkys e já está sendo analisada. Retornaremos em breve com uma resposta.</p>`;
    } else if (event === "resolvido") {
      greeting = `Olá, ${clientName}!`;
      bodyHtml = `<p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Sua solicitação de suporte foi marcada como <strong>resolvida</strong>. Caso o problema persista ou surja uma nova dúvida, fique à vontade para abrir um novo ticket pelo portal.</p>`;
    } else if (event === "reply") {
      greeting = `Olá, ${clientName}!`;
      bodyHtml = `<p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">A equipe Elkys respondeu ao seu ticket de suporte. Acesse o portal para visualizar a resposta completa e dar continuidade à conversa.</p>`;
      if (reply_body) {
        const raw = reply_body.length > 400 ? reply_body.slice(0, 397) + "..." : reply_body;
        const preview = escapeHtml(raw);
        noteHtml = `<strong>Resposta da equipe:</strong><br/><em style="color:#52525b;">"${preview}"</em>`;
      }
    }

    const html = buildEmail({
      preheader: `${EVENT_SUBJECT[event]}: "${subject}"`,
      title: EVENT_SUBJECT[event],
      greeting,
      body: bodyHtml,
      highlight: {
        title: "Sua solicitação",
        rows: [{ label: "Assunto", value: subject }],
      },
      button: {
        label: "Acessar suporte →",
        href: ticketUrl,
      },
      note: noteHtml,
    });

    const result = await sendEmail({
      to: clientEmail,
      subject: `[Elkys Suporte] ${EVENT_SUBJECT[event]}: ${subject}`,
      html,
    });

    if (!result.ok) {
      console.error("[send-ticket-updated] email failed:", result.error);
    }

    return new Response(JSON.stringify({ ok: result.ok }), {
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
