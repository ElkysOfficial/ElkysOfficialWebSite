/**
 * Edge Function: send-password-reset
 * Gera um link de reset de senha via Supabase Auth Admin API
 * e envia por e-mail usando Resend.
 *
 * Deploy:
 *   supabase functions deploy send-password-reset
 *
 * Secrets necessários:
 *   RESEND_API_KEY, FROM_EMAIL, PORTAL_URL
 *   SUPABASE_URL (automático no ambiente Supabase)
 *   SUPABASE_SERVICE_ROLE_KEY (automático no ambiente Supabase)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";

interface Payload {
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { email } = (await req.json()) as Payload;

    if (!email) {
      return new Response(JSON.stringify({ error: "E-mail obrigatório" }), {
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

    // Generate a password reset link via Supabase Auth Admin
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${PORTAL_URL}/alterar-senha`,
      },
    });

    if (error || !data?.properties?.action_link) {
      // Always return success to avoid email enumeration attacks
      console.warn("[send-password-reset] generateLink error or user not found:", error?.message);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const resetLink = data.properties.action_link;

    const html = buildEmail({
      preheader: "Você solicitou a redefinição de senha do Portal Elkys.",
      title: "Redefinição de senha",
      greeting: "Olá!",
      body: `
        <p class="text-body" style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Recebemos uma solicitação para redefinir a senha da conta <strong>${email}</strong> no Portal Elkys.</p>
        <p class="text-body" style="margin:0;font-size:14px;line-height:22px;color:#333333;">Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong> e pode ser usado uma única vez.</p>
      `,
      button: {
        label: "Redefinir minha senha →",
        href: resetLink,
      },
      warning:
        "Se você não solicitou esta redefinição, ignore este e-mail com tranquilidade. Sua senha permanece inalterada e sua conta está segura.",
      note: `Link não funcionou? Copie e cole este endereço no navegador: <a href="${resetLink}" style="word-break:break-all;">${resetLink}</a>`,
    });

    const result = await sendEmail({
      to: email,
      subject: "Redefinição de senha — Portal Elkys",
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
