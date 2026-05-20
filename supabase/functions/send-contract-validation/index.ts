/**
 * Edge Function: send-contract-validation
 * Dispara quando o jurídico envia contrato para validação do cliente.
 * Envia e-mail ao cliente avisando que há contrato para aceitar no portal.
 *
 * Deploy:
 *   supabase functions deploy send-contract-validation
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";
import { requireOperationalAccess, createServiceRoleClient } from "../_shared/auth.ts";
import {
  getFormalGreeting,
  getWhatsAppGreetingFullName,
  truncateAtWord,
} from "../_shared/greeting.ts";
import { createCommunication } from "../_shared/comms-tracking.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";
import { buildWhatsAppMessage, ctaLink, docHighlight } from "../_shared/whatsapp-template.ts";

interface Payload {
  contract_id: string;
  client_id: string;
  project_name: string;
  scope_summary?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const auth = await requireOperationalAccess(req, CORS);
    if (auth instanceof Response) return auth;

    const { contract_id, client_id, project_name, scope_summary } = (await req.json()) as Payload;

    if (!contract_id || !client_id || !project_name) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createServiceRoleClient();

    const { data: client } = await supabase
      .from("clients")
      .select(
        "full_name, email, nome_fantasia, client_type, gender, phone, whatsapp, responsavel_financeiro_phone"
      )
      .eq("id", client_id)
      .single();

    if (!client?.email) {
      return new Response(JSON.stringify({ error: "Client has no email" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/cliente";

    const scopeBlock = scope_summary
      ? `<p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Escopo resumido: <strong>${truncateAtWord(scope_summary, 300)}</strong></p>`
      : "";

    // Telefone para o WhatsApp.
    const recipientPhone = client.whatsapp || client.phone || null;

    const tracking = await createCommunication({
      kind: "contract_validation",
      recipientEmail: client.email,
      recipientPhone,
      clientId: client_id,
      entityType: "contract",
      entityId: contract_id,
    });
    const contractUrl = `${PORTAL_URL}/contratos`;
    const contractHref = await tracking.shorten(contractUrl);
    const contractHrefWa = await tracking.shorten(contractUrl, "whatsapp");

    const html = buildEmail({
      preheader: `Contrato do projeto "${project_name}" aguardando sua validação.`,
      title: "Contrato para validação",
      greeting: getFormalGreeting(client),
      body: `
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">O contrato referente ao projeto <strong>${project_name}</strong> foi finalizado pela nossa equipe jurídica e encontra-se disponível para análise e validação.</p>
        ${scopeBlock}
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Solicitamos a revisão dos termos e a confirmação de aceite diretamente pelo portal.</p>
      `,
      button: {
        label: "Revisar contrato",
        href: contractHref,
      },
      pixelUrl: tracking.pixelUrl,
      note: "Em caso de dúvidas sobre qualquer cláusula, solicitamos contato prévio ao aceite.",
    });

    const result = await sendEmail({
      to: client.email,
      subject: `Contrato para validação — ${project_name}`,
      html,
    });

    // Espelha o aviso no WhatsApp (curto + link). Falha nao afeta o e-mail.
    let waStatus: "sent" | "failed" | "skipped" = "skipped";
    if (recipientPhone) {
      const waText = buildWhatsAppMessage({
        greeting: getWhatsAppGreetingFullName(client),
        paragraphs: [
          "O contrato do seu projeto foi finalizado pela nossa equipe e já está disponível no portal para sua revisão e aceite formal.",
          docHighlight("Contrato pronto para aceite", project_name),
          "É um passo rápido, com leitura do texto completo, escopo e condições, e clique no botão de aceite quando estiver de acordo.",
        ],
        cta: ctaLink("Revisar e aceitar o contrato", contractHrefWa),
        closing:
          "Após o aceite, damos início às próximas etapas do projeto. Para qualquer dúvida, nossa equipe permanece à disposição.",
      });
      waStatus = (await sendWhatsApp(recipientPhone, waText)) ? "sent" : "failed";
    }
    await tracking.finalize(result.ok, waStatus);

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
