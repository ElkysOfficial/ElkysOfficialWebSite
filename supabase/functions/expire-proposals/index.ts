/**
 * Edge Function: expire-proposals
 *
 * Cron diario: marca propostas com status='enviada' e valid_until < hoje
 * como 'expirada'. Alem disso, notifica o cliente (email + WhatsApp) que
 * a proposta expirou e abre oportunidade de retomar a conversa. Sem essa
 * notificacao o lead fica frio sem aviso.
 *
 * Deploy:
 *   supabase functions deploy expire-proposals --no-verify-jwt
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
 *          FROM_EMAIL, PORTAL_URL, SHORT_LINK_BASE, WHATSAPP_API_URL,
 *          WHATSAPP_API_TOKEN
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail } from "../_shared/email-template.ts";
import {
  getFormalGreeting,
  getWhatsAppGreetingFullName,
  truncateAtWord,
} from "../_shared/greeting.ts";
import { createCommunication } from "../_shared/comms-tracking.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";
import { buildWhatsAppMessage, ctaLink, docHighlight } from "../_shared/whatsapp-template.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/cliente";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const today = new Date().toISOString().slice(0, 10);

    // Expandi o select para ter o que precisamos pra notificar o cliente.
    const { data: expiredProposals, error: queryError } = await admin
      .from("proposals")
      .select("id, title, total_amount, client_id, lead_id, valid_until")
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

    // Re-check status='enviada' protege contra race com aprovacao/rejeicao
    // manual durante a janela entre SELECT e UPDATE.
    const { error: updateError } = await admin
      .from("proposals")
      .update({
        status: "expirada",
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .eq("status", "enviada");

    if (updateError) {
      return new Response(JSON.stringify({ ok: false, error: updateError.message }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Notif interna admin (mantem comportamento anterior).
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

    // Notificacao para cada destinatario (cliente OU lead) — fecha o loop
    // comercial em vez de deixar o relacionamento esfriar em silencio.
    // Best-effort: erro de envio individual nao bloqueia o batch.
    let clientNotifiedCount = 0;
    let clientNotifyFailed = 0;
    for (const proposal of expiredProposals) {
      try {
        // Resolve destinatario — proposta pode estar vinculada a cliente
        // (com cadastro completo) ou a lead (sem portal, so dados basicos).
        let recipientEmail: string | null = null;
        let recipientPhone: string | null = null;
        let recipientName = "Cliente";
        let clientLike: Parameters<typeof getFormalGreeting>[0] = {};

        if (proposal.client_id) {
          const { data: client } = await admin
            .from("clients")
            .select("full_name, nome_fantasia, email, phone, whatsapp, client_type, gender")
            .eq("id", proposal.client_id)
            .maybeSingle();
          if (client) {
            recipientEmail = client.email;
            recipientPhone = client.whatsapp || client.phone || null;
            recipientName = client.nome_fantasia || client.full_name || "Cliente";
            clientLike = client;
          }
        } else if (proposal.lead_id) {
          const { data: lead } = await admin
            .from("leads")
            .select("name, email, phone, company")
            .eq("id", proposal.lead_id)
            .maybeSingle();
          if (lead) {
            recipientEmail = lead.email;
            recipientPhone = lead.phone || null;
            recipientName = lead.name || "Cliente";
            clientLike = {
              full_name: lead.name,
              nome_fantasia: lead.company,
              client_type: "pf",
            };
          }
        }

        if (!recipientEmail) continue;

        const tracking = await createCommunication({
          kind: "proposal_expired",
          recipientEmail,
          recipientPhone,
          clientId: proposal.client_id,
          entityType: "proposal",
          entityId: proposal.id,
        });
        const proposalUrl = `${PORTAL_URL}/propostas/${proposal.id}`;
        const proposalHref = await tracking.shorten(proposalUrl);
        const proposalHrefWa = await tracking.shorten(proposalUrl, "whatsapp");

        const amount = formatBRL(Number(proposal.total_amount ?? 0));
        const docRef = `${proposal.title} - ${amount}`;

        // Texto deliberadamente distinto do send-proposal-expiry-warning
        // (que avisa ANTES de expirar). Aqui o tom e de fechamento + abertura
        // de novo dialogo: "expirou, mas ainda podemos retomar". Evita o
        // efeito "voce ja me avisou disso" do cliente que recebeu warning
        // dias antes.
        const html = buildEmail({
          preheader: `Sua proposta expirou — mas a conversa pode continuar.`,
          title: "Proposta encerrada por prazo",
          greeting: getFormalGreeting(clientLike),
          body: `
            <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">A proposta detalhada abaixo passou da data de validade e foi encerrada automaticamente pelo nosso sistema. Isso é apenas um marcador interno — não significa que o interesse mútuo acabou.</p>
            <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Se ainda fizer sentido para você, é simples retomar: ajustamos o escopo, atualizamos valores conforme o cenário atual e emitimos uma nova proposta personalizada. Basta um sinal seu pelo portal ou respondendo este e-mail.</p>
          `,
          highlight: {
            title: "Proposta encerrada por prazo",
            rows: [
              { label: "Título", value: proposal.title },
              { label: "Valor original", value: amount },
              {
                label: "Validade até",
                value: new Date(`${proposal.valid_until}T00:00:00`).toLocaleDateString("pt-BR"),
              },
            ],
          },
          button: { label: "Retomar conversa pelo portal", href: proposalHref },
          pixelUrl: tracking.pixelUrl,
        });

        const result = await sendEmail({
          to: recipientEmail,
          subject: `Proposta encerrada por prazo — retomamos quando quiser`,
          html,
        });

        let waStatus: "sent" | "failed" | "skipped" = "skipped";
        if (recipientPhone) {
          const waText = buildWhatsAppMessage({
            greeting: getWhatsAppGreetingFullName(clientLike),
            paragraphs: [
              "A proposta abaixo passou da data de validade e foi encerrada automaticamente pelo nosso sistema. Isso é apenas um marcador interno — não significa que o interesse mútuo acabou.",
              docHighlight("Proposta encerrada por prazo", docRef),
              "Se ainda fizer sentido para você, ajustamos escopo e valores conforme o cenário atual e emitimos uma nova proposta. Basta um sinal seu.",
            ],
            cta: ctaLink("Retomar conversa pelo portal", proposalHrefWa),
            closing:
              "Nossa equipe comercial está pronta para retomar o diálogo a qualquer momento.",
          });
          waStatus = (await sendWhatsApp(recipientPhone, waText)) ? "sent" : "failed";
        }

        await tracking.finalize(result.ok, waStatus);
        if (result.ok) clientNotifiedCount++;
      } catch (notifyErr) {
        clientNotifyFailed++;
        console.error(`[expire-proposals] notify failed for proposal ${proposal.id}:`, notifyErr);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        expired: expiredProposals.length,
        clients_notified: clientNotifiedCount,
        notify_failures: clientNotifyFailed,
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
