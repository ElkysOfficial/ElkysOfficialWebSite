/**
 * Edge Function: send-proposal-sent
 * Notifica o cliente quando uma proposta comercial e enviada para avaliacao.
 *
 * Deploy:
 *   supabase functions deploy send-proposal-sent
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";
import { requireAdminAccess } from "../_shared/auth.ts";

interface Payload {
  proposal_id: string;
  client_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const auth = await requireAdminAccess(req, CORS);
    if (auth instanceof Response) return auth;

    const { proposal_id, client_id } = (await req.json()) as Payload;

    if (!proposal_id || !client_id) {
      return new Response(JSON.stringify({ error: "Missing proposal_id or client_id" }), {
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

    const [clientRes, proposalRes] = await Promise.all([
      admin
        .from("clients")
        .select("full_name, email, nome_fantasia")
        .eq("id", client_id)
        .maybeSingle(),
      admin
        .from("proposals")
        .select("title, total_amount, valid_until, scope_summary")
        .eq("id", proposal_id)
        .maybeSingle(),
    ]);

    const client = clientRes.data;
    const proposal = proposalRes.data;

    if (!client?.email) {
      return new Response(JSON.stringify({ error: "Client not found or no email" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (!proposal) {
      return new Response(JSON.stringify({ error: "Proposal not found" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const firstName = client.full_name.split(" ")[0];
    const displayName = client.nome_fantasia || client.full_name;
    const formattedAmount = Number(proposal.total_amount).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const validUntilText = proposal.valid_until
      ? new Date(`${proposal.valid_until}T00:00:00`).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;

    const html = buildEmail({
      preheader: `A Elkys enviou uma proposta comercial para ${displayName}.`,
      title: "Nova proposta comercial",
      greeting: `Ola, ${firstName}!`,
      body: `
        <p style="margin:0 0 12px;">Uma nova <strong>proposta comercial</strong> foi enviada para voce pela <strong>Elkys</strong> e ja esta disponivel para avaliacao no seu portal.</p>
        <p style="margin:0 0 12px;">Acesse o portal para visualizar todos os detalhes, incluindo escopo, condicoes de pagamento e valor. Voce pode aprovar ou solicitar ajustes diretamente pelo portal.</p>
        <p style="margin:0;">Estamos a disposicao para qualquer duvida.</p>
      `,
      highlight: {
        title: "Resumo da proposta",
        rows: [
          { label: "Proposta", value: proposal.title },
          { label: "Valor", value: formattedAmount },
          ...(validUntilText ? [{ label: "Valida ate", value: validUntilText }] : []),
          ...(proposal.scope_summary
            ? [{ label: "Escopo", value: proposal.scope_summary.slice(0, 200) }]
            : []),
        ],
      },
      button: {
        label: "Ver proposta no portal",
        href: `${PORTAL_URL}/propostas`,
      },
      note: "Voce pode aprovar ou rejeitar a proposta diretamente pelo portal a qualquer momento.",
    });

    const result = await sendEmail({
      to: client.email,
      subject: `Elkys — Nova proposta: ${proposal.title}`,
      html,
    });

    return new Response(JSON.stringify({ ok: result.ok, error: result.error ?? null }), {
      status: result.ok ? 200 : 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-proposal-sent] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
