/**
 * Edge Function: send-client-action-required
 * Notifica o cliente quando o admin solicita uma acao/dados vinculada ao projeto.
 *
 * Deploy:
 *   supabase functions deploy send-client-action-required --no-verify-jwt
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";
import { requireAdminAccess } from "../_shared/auth.ts";

interface Payload {
  client_id: string;
  project_id: string;
  project_name: string;
  step_title: string;
  step_description?: string;
  due_date?: string;
}

function formatDate(date?: string | null): string | null {
  if (!date) return null;
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const auth = await requireAdminAccess(req, CORS);
    if (auth instanceof Response) return auth;

    const { client_id, project_id, project_name, step_title, step_description, due_date } =
      (await req.json()) as Payload;

    if (!client_id || !project_name || !step_title) {
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
    const formattedDueDate = formatDate(due_date);

    const highlightRows = [
      { label: "Projeto", value: project_name },
      { label: "Solicitacao", value: step_title },
      ...(step_description ? [{ label: "Detalhes", value: step_description }] : []),
      ...(formattedDueDate ? [{ label: "Prazo", value: formattedDueDate }] : []),
    ];

    const html = buildEmail({
      preheader: `Acao necessaria: ${step_title} - projeto ${project_name}`,
      title: "Acao necessaria",
      greeting: `Ola, ${firstName}!`,
      body: `
        <p style="margin:0 0 12px;">Precisamos da sua colaboracao para dar continuidade ao projeto <strong>${project_name}</strong>.</p>
        <p style="margin:0 0 12px;">Acesse o portal para visualizar os detalhes da solicitacao e enviar sua resposta.</p>
        ${formattedDueDate ? `<p style="margin:0;"><strong>Prazo sugerido:</strong> ${formattedDueDate}</p>` : ""}
      `,
      highlight: { title: "Detalhes da solicitacao", rows: highlightRows },
      button: {
        label: "Responder no Portal →",
        href: `${PORTAL_URL}/projetos/${project_id}`,
      },
      note: "Sua resposta e importante para o andamento do projeto. Se tiver duvidas, abra um ticket de suporte.",
    });

    const result = await sendEmail({
      to: client.email,
      subject: `Acao necessaria: ${step_title} - ${project_name}`,
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
