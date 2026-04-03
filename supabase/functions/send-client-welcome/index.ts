/**
 * Edge Function: send-client-welcome
 * Dispara quando um cliente é cadastrado pelo admin.
 * Envia e-mail com e-mail de acesso + senha temporária.
 *
 * Deploy:
 *   supabase functions deploy send-client-welcome
 *
 * Secrets necessários (configurar via Dashboard ou CLI):
 *   supabase secrets set RESEND_API_KEY=re_xxxx
 *   supabase secrets set FROM_EMAIL=noreply@elkys.com.br
 *   supabase secrets set PORTAL_URL=https://elkys.com.br/portal/cliente
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";
import { requireAdminAccess } from "../_shared/auth.ts";

interface Payload {
  email: string;
  name: string;
  temp_password: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const auth = await requireAdminAccess(req, CORS);
    if (auth instanceof Response) return auth;

    const { email, name, temp_password } = (await req.json()) as Payload;

    if (!email || !name || !temp_password) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/cliente";
    const firstName = name.split(" ")[0];

    const html = buildEmail({
      preheader: `Seu acesso ao portal Elkys está pronto, ${firstName}.`,
      title: "Bem-vindo ao Portal Elkys",
      greeting: `Olá, ${firstName},`,
      body: `
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Seja bem-vindo à Elkys.</p>
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Seu acesso ao portal foi criado com sucesso. A partir de agora, você poderá acompanhar seus projetos, acessar documentos e visualizar todas as informações relacionadas aos serviços contratados em um único lugar.</p>
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Trabalhamos com proximidade, transparência e organização, para que você tenha total clareza sobre cada etapa do que está sendo desenvolvido.</p>
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Para acessar o portal, utilize as credenciais enviadas neste e-mail. No primeiro acesso, será necessário definir uma nova senha por segurança.</p>
        <p style="margin:0 0 20px 0;font-size:14px;line-height:22px;color:#333333;">Seguimos à disposição para qualquer necessidade.</p>
      `,
      highlight: {
        title: "Suas credenciais de acesso",
        rows: [
          { label: "E-mail", value: email },
          { label: "Senha temporária", value: temp_password },
        ],
      },
      button: {
        label: "Ir para o seu portal",
        href: PORTAL_URL,
      },
    });

    const result = await sendEmail({
      to: email,
      subject: `Seu acesso ao Portal Elkys foi criado`,
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
