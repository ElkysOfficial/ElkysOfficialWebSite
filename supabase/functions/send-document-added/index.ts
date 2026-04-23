/**
 * Edge Function: send-document-added
 * Notifica o cliente quando o admin adiciona um novo documento ao seu perfil.
 *
 * Deploy:
 *   supabase functions deploy send-document-added --no-verify-jwt
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";
import { requireAdminAccess } from "../_shared/auth.ts";

interface Payload {
  client_id: string;
  document_label: string;
  document_type: string;
  document_url: string;
}

const DOC_TYPE_LABEL: Record<string, string> = {
  contrato: "Contrato",
  aditivo: "Aditivo contratual",
  nota_fiscal: "Nota Fiscal",
  codigo_fonte: "Código Fonte",
  outro: "Documento",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const auth = await requireAdminAccess(req, CORS);
    if (auth instanceof Response) return auth;

    const { client_id, document_label, document_type, document_url } =
      (await req.json()) as Payload;

    if (!client_id || !document_label) {
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

    // Fetch client email and name
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
    const typeLabel = DOC_TYPE_LABEL[document_type] ?? "Documento";

    const html = buildEmail({
      preheader: `Um novo ${typeLabel} foi disponibilizado para você no Portal Elkys.`,
      title: "Novo documento disponível",
      greeting: `${getTimeGreeting()}, ${firstName}!`,
      body: `
        <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Um novo documento foi disponibilizado no seu <strong>Portal Elkys</strong> e já está pronto para acesso.</p>
        <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Você pode visualizar, baixar ou compartilhar o arquivo a qualquer momento, de forma simples e segura.</p>
        <p style="margin:0;font-size:14px;line-height:22px;color:#333333;">Mantemos todas as informações centralizadas para garantir organização e fácil acesso sempre que necessário.</p>
      `,
      highlight: {
        title: "Detalhes do documento",
        rows: [
          { label: "Tipo", value: typeLabel },
          { label: "Nome", value: document_label },
        ],
      },
      button: {
        label: "Ver documentos no Portal →",
        href: `${PORTAL_URL}/documentos`,
      },
      note: "Qualquer dúvida, nossa equipe está à disposição.",
    });

    const result = await sendEmail({
      to: client.email,
      subject: `Novo documento disponível: ${document_label}`,
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
