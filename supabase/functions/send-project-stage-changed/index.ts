/**
 * Edge Function: send-project-stage-changed
 * Notifica o cliente quando a etapa ou status do projeto muda.
 *
 * Deploy:
 *   supabase functions deploy send-project-stage-changed --no-verify-jwt
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
  change_type: "stage" | "status";
  from_value: string;
  to_value: string;
  client_visible_summary?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const auth = await requireAdminAccess(req, CORS);
    if (auth instanceof Response) return auth;

    const {
      client_id,
      project_id,
      project_name,
      change_type,
      from_value,
      to_value,
      client_visible_summary,
    } = (await req.json()) as Payload;

    if (!client_id || !project_name || !change_type || !to_value) {
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
    const isStageChange = change_type === "stage";
    const title = isStageChange ? "Progresso do projeto" : "Atualizacao do projeto";
    const subject = isStageChange
      ? `Progresso: ${project_name} avanc\u0327ou para ${to_value}`
      : `Atualizac\u0327a\u0303o: ${project_name} - ${to_value}`;

    const highlightRows = [
      { label: "Projeto", value: project_name },
      ...(from_value
        ? [{ label: isStageChange ? "Etapa anterior" : "Status anterior", value: from_value }]
        : []),
      { label: isStageChange ? "Nova etapa" : "Novo status", value: to_value },
    ];

    const bodyParagraphs = isStageChange
      ? `
        <p style="margin:0 0 12px;">Boas noticias! O seu projeto <strong>${project_name}</strong> avancou para uma nova etapa.</p>
        <p style="margin:0 0 12px;">Acompanhe o progresso completo, documentos e proximos passos diretamente no seu portal.</p>
        ${client_visible_summary ? `<p style="margin:0;"><strong>Resumo:</strong> ${client_visible_summary}</p>` : ""}
      `
      : `
        <p style="margin:0 0 12px;">O status do seu projeto <strong>${project_name}</strong> foi atualizado.</p>
        <p style="margin:0;">Acesse o portal para ver os detalhes completos.</p>
      `;

    const html = buildEmail({
      preheader: isStageChange
        ? `Seu projeto "${project_name}" avancou para ${to_value}.`
        : `O status do projeto "${project_name}" foi atualizado para ${to_value}.`,
      title,
      greeting: `Ola, ${firstName}!`,
      body: bodyParagraphs,
      highlight: { title: "Detalhes da atualizacao", rows: highlightRows },
      button: {
        label: "Acompanhar no Portal →",
        href: `${PORTAL_URL}/projetos/${project_id}`,
      },
      note: "Qualquer duvida, abra um ticket de suporte pelo portal.",
    });

    const result = await sendEmail({
      to: client.email,
      subject,
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
