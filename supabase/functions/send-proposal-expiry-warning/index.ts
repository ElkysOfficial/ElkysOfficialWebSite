/**
 * Edge Function: send-proposal-expiry-warning
 * Cron diario que avisa clientes cujas propostas expiram em N dias
 * (default 2), pra evitar proposta morrer por esquecimento.
 *
 * Deploy:
 *   supabase functions deploy send-proposal-expiry-warning --no-verify-jwt
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Opcional: PROPOSAL_EXPIRY_WARNING_DAYS (default 2)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS, getTimeGreeting } from "../_shared/email-template.ts";

interface ProposalRow {
  id: string;
  title: string;
  total_amount: number;
  valid_until: string;
  client_id: string;
}

interface ClientRow {
  id: string;
  full_name: string;
  email: string;
  nome_fantasia: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/cliente";
    const WARNING_DAYS = Number(Deno.env.get("PROPOSAL_EXPIRY_WARNING_DAYS") ?? "2");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const target = new Date();
    target.setUTCDate(target.getUTCDate() + WARNING_DAYS);
    const targetDate = target.toISOString().slice(0, 10);

    const { data: proposals, error: queryError } = await admin
      .from("proposals")
      .select("id, title, total_amount, valid_until, client_id")
      .eq("status", "enviada")
      .eq("valid_until", targetDate)
      .not("client_id", "is", null);

    if (queryError) {
      return new Response(JSON.stringify({ ok: false, error: queryError.message }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const rows = (proposals ?? []) as ProposalRow[];
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, reason: "No proposals expiring in N days" }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const clientIds = [...new Set(rows.map((p) => p.client_id))];
    const { data: clientsData } = await admin
      .from("clients")
      .select("id, full_name, email, nome_fantasia")
      .in("id", clientIds);

    const clientMap = new Map(((clientsData ?? []) as ClientRow[]).map((c) => [c.id, c]));

    let sent = 0;
    let failed = 0;

    for (const proposal of rows) {
      const client = clientMap.get(proposal.client_id);
      if (!client?.email) {
        failed++;
        continue;
      }

      const firstName = client.full_name.split(" ")[0];
      const formattedAmount = Number(proposal.total_amount).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      const validUntilText = new Date(`${proposal.valid_until}T00:00:00`).toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "long", year: "numeric" }
      );

      const html = buildEmail({
        preheader: `Sua proposta "${proposal.title}" expira em ${WARNING_DAYS} dia(s).`,
        title: "Proposta prestes a expirar",
        greeting: `${getTimeGreeting()}, ${firstName}!`,
        body: `
          <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Sua proposta <strong>${proposal.title}</strong> está aguardando avaliação e expira em <strong>${WARNING_DAYS} dia(s)</strong>.</p>
          <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Após o vencimento, ela sai automaticamente da validade e precisa ser renegociada. Se ainda tem interesse, é só entrar no portal e responder.</p>
          <p style="margin:0;font-size:14px;line-height:22px;color:#333333;">Qualquer dúvida, estamos à disposição.</p>
        `,
        highlight: {
          title: "Resumo da proposta",
          rows: [
            { label: "Proposta", value: proposal.title },
            { label: "Valor", value: formattedAmount },
            { label: "Válida até", value: validUntilText },
          ],
        },
        button: {
          label: "Responder agora →",
          href: `${PORTAL_URL}/propostas/${proposal.id}`,
        },
        note: "Se preferir aprovar direto, é só clicar no botão acima.",
      });

      const result = await sendEmail({
        to: client.email,
        subject: `Elkys — Sua proposta expira em ${WARNING_DAYS} dia(s): ${proposal.title}`,
        html,
      });

      if (result.ok) sent++;
      else failed++;
    }

    if (sent > 0) {
      void admin.from("admin_notifications").insert({
        type: "propostas_prestes_a_expirar",
        title: `${sent} lembrete(s) de proposta enviado(s)`,
        body: `Propostas expirando em ${WARNING_DAYS} dia(s): ${rows.length} candidata(s), ${sent} e-mail(s) enviado(s).`,
        severity: "info",
        target_roles: ["admin_super", "admin", "comercial"],
      });
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, total: rows.length }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-proposal-expiry-warning] error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
