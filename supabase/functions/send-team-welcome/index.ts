/**
 * Edge Function: send-team-welcome
 * Dispara quando um membro da equipe é cadastrado pelo admin.
 * Envia e-mail com e-mail de acesso + senha temporária.
 *
 * Deploy:
 *   supabase functions deploy send-team-welcome
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { buildEmail, sendEmail, CORS, getTimeGreeting } from "../_shared/email-template.ts";
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

    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/admin";
    const firstName = name.split(" ")[0];

    const html = buildEmail({
      preheader: `Bem-vindo à equipe Elkys, ${firstName}! Seu acesso ao painel está pronto.`,
      title: "Bem-vindo à equipe Elkys",
      greeting: `${getTimeGreeting()}, ${firstName}!`,
      body: `
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">É com grande satisfação que damos as boas-vindas a você na <strong>Elkys</strong>.</p>
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Aqui, somos mais do que uma equipe — somos uma estrutura integrada, orientada a resultados, colaboração e crescimento contínuo. Sua chegada fortalece esse compromisso.</p>
        <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#333333;">Abaixo estão suas credenciais de acesso ao painel interno. Por segurança, altere sua senha logo após o primeiro login.</p>
      `,
      highlight: {
        title: "Suas credenciais de acesso",
        rows: [
          { label: "E-mail", value: email },
          { label: "Senha temporária", value: temp_password },
        ],
      },
      button: {
        label: "Acessar o painel",
        href: PORTAL_URL,
      },
    });

    const result = await sendEmail({
      to: email,
      subject: `Bem-vindo à equipe Elkys`,
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
