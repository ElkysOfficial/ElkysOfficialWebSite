/**
 * Edge Function: send-charge-overdue
 * Notifica o cliente quando uma cobranca entra em atraso.
 *
 * Pode ser invocado manualmente pelo admin ou via cron (mark_overdue_charges).
 *
 * Deploy:
 *   supabase functions deploy send-charge-overdue --no-verify-jwt
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";

interface Payload {
  client_id: string;
  charge_description: string;
  charge_amount: number;
  due_date: string;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { client_id, charge_description, charge_amount, due_date } =
      (await req.json()) as Payload;

    if (!client_id || !charge_description || !due_date) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
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

    const { data: client } = await admin
      .from("clients")
      .select("full_name, email, nome_fantasia")
      .eq("id", client_id)
      .maybeSingle();

    if (!client?.email) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const firstName = client.full_name.split(" ")[0];

    const html = buildEmail({
      preheader: `A cobranca "${charge_description}" esta em atraso.`,
      title: "Cobranca em atraso",
      greeting: `Ola, ${firstName}.`,
      body: `
        <p style="margin:0 0 12px;">Identificamos que a cobranca abaixo ultrapassou a data de vencimento e consta como <strong>em atraso</strong> na sua conta.</p>
        <p style="margin:0 0 12px;">Pedimos que regularize a situacao o mais breve possivel para evitar impactos no andamento dos seus projetos.</p>
        <p style="margin:0;">Se ja realizou o pagamento, desconsidere este aviso. Caso precise de suporte, estamos a disposicao pelo portal.</p>
      `,
      highlight: {
        title: "Detalhes da cobranca",
        rows: [
          { label: "Descricao", value: charge_description },
          { label: "Valor", value: formatBRL(charge_amount) },
          { label: "Vencimento", value: formatDate(due_date) },
          { label: "Situacao", value: "Em atraso" },
        ],
      },
      button: {
        label: "Ver financeiro no Portal →",
        href: `${PORTAL_URL}/financeiro`,
      },
      warning: "Mantenha seus pagamentos em dia para garantir a continuidade dos servicos.",
    });

    const result = await sendEmail({
      to: client.email,
      subject: `Cobranca em atraso: ${charge_description}`,
      html,
    });

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
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
