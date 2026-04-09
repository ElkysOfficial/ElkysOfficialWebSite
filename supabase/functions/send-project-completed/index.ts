/**
 * Edge Function: send-project-completed
 * Notifica o cliente quando o projeto e entregue (status -> concluido).
 *
 * Deploy:
 *   supabase functions deploy send-project-completed --no-verify-jwt
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";
import { requireAdminAccess } from "../_shared/auth.ts";

interface Payload {
  client_id: string;
  project_name: string;
  delivered_at?: string;
}

function formatDate(date?: string | null): string {
  if (!date) return "Hoje";
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

    const { client_id, project_name, delivered_at } = (await req.json()) as Payload;

    if (!client_id || !project_name) {
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
      preheader: `Seu projeto "${project_name}" foi entregue com sucesso!`,
      title: "Projeto concluído",
      greeting: `Parabéns, ${firstName}!`,
      body: `
        <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Temos o prazer de informar que o projeto <strong>${project_name}</strong> foi concluído e entregue com sucesso.</p>
        <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Todos os detalhes, documentos e histórico do projeto continuam disponíveis no seu portal para consulta a qualquer momento.</p>
        <p style="margin:0;font-size:14px;line-height:22px;color:#333333;">Agradecemos a confiança e estamos prontos para os próximos passos juntos.</p>
      `,
      highlight: {
        title: "Resumo da entrega",
        rows: [
          { label: "Projeto", value: project_name },
          { label: "Data de entrega", value: formatDate(delivered_at) },
          { label: "Status", value: "Concluído" },
        ],
      },
      button: {
        label: "Ver projeto no portal →",
        href: `${PORTAL_URL}/projetos`,
      },
      note: "Se precisar de qualquer ajuste ou suporte pós-entrega, estamos à disposição.",
    });

    const result = await sendEmail({
      to: client.email,
      subject: `Projeto concluído: ${project_name}`,
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
