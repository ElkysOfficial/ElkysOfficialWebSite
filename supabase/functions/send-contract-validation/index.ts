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
      .select("full_name, email, nome_fantasia, client_type")
      .eq("id", client_id)
      .single();

    if (!client?.email) {
      return new Response(JSON.stringify({ error: "Client has no email" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const clientName =
      client.client_type === "pj" && client.nome_fantasia ? client.nome_fantasia : client.full_name;
    const firstName = clientName.split(" ")[0];

    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/cliente";

    const scopeBlock = scope_summary
      ? `<p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Escopo resumido: <strong>${scope_summary.substring(0, 300)}${scope_summary.length > 300 ? "..." : ""}</strong></p>`
      : "";

    const html = buildEmail({
      preheader: `Seu contrato para o projeto "${project_name}" está pronto para validação.`,
      title: "Contrato disponível para validação",
      greeting: `Olá, ${firstName}!`,
      body: `
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">O contrato referente ao projeto <strong>${project_name}</strong> foi preparado pela nossa equipe jurídica e está disponível para sua análise e validação.</p>
        ${scopeBlock}
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Acesse o portal para revisar os termos e confirmar o aceite do contrato.</p>
      `,
      button: {
        label: "Revisar contrato",
        href: `${PORTAL_URL}/contratos`,
      },
      note: "Se tiver dúvidas sobre os termos, entre em contato conosco antes de aceitar.",
    });

    const result = await sendEmail({
      to: client.email,
      subject: `Contrato disponível: ${project_name}`,
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
