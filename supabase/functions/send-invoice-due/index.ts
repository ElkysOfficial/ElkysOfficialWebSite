/**
 * Edge Function: send-invoice-due
 * Notifica clientes com fatura próxima do vencimento.
 * Deve ser chamada por um cron job ou manualmente.
 *
 * Lógica: busca cobranças com due_date == hoje + DAYS_BEFORE,
 * status em ('pendente', 'agendada'), is_historical = false,
 * e envia aviso por e-mail para o cliente vinculado.
 *
 * Deploy:
 *   supabase functions deploy send-invoice-due
 *
 * Cron sugerido (no Supabase Dashboard > Edge Functions > Cron):
 *   0 9 * * *   → todo dia às 9h (UTC)
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL,
 *          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *          INVOICE_DAYS_BEFORE (padrão: 3)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/cliente";
    const DAYS_BEFORE = parseInt(Deno.env.get("INVOICE_DAYS_BEFORE") ?? "3", 10);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Target date: today + DAYS_BEFORE
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + DAYS_BEFORE);
    const targetDateIso = targetDate.toISOString().slice(0, 10);

    // Fetch charges due on the target date that are operational (non-historical, non-cancelled)
    const { data: charges, error: chargesError } = await admin
      .from("charges")
      .select("id, client_id, description, amount, due_date, status")
      .eq("due_date", targetDateIso)
      .in("status", ["pendente", "agendada"])
      .eq("is_historical", false);

    if (chargesError) {
      console.error("[send-invoice-due] charges query error:", chargesError.message);
      return new Response(JSON.stringify({ error: chargesError.message }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (!charges || charges.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "No invoices due" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Collect unique client IDs from the charges
    const clientIds = [...new Set(charges.map((c) => c.client_id))];

    const { data: clients, error: clientsError } = await admin
      .from("clients")
      .select("id, full_name, email, nome_fantasia, contract_status")
      .in("id", clientIds)
      .eq("is_active", true);

    if (clientsError) {
      console.error("[send-invoice-due] clients query error:", clientsError.message);
      return new Response(JSON.stringify({ error: clientsError.message }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c]));

    const dueDateFormatted = targetDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Group charges by client to send a single email per client
    const chargesByClient = charges.reduce<Record<string, typeof charges>>((acc, charge) => {
      if (!acc[charge.client_id]) acc[charge.client_id] = [];
      acc[charge.client_id].push(charge);
      return acc;
    }, {});

    let sent = 0;
    let failed = 0;

    for (const [clientId, clientCharges] of Object.entries(chargesByClient)) {
      const client = clientMap[clientId];
      if (!client?.email) {
        failed++;
        continue;
      }

      const firstName = client.full_name.split(" ")[0];
      const totalAmount = clientCharges.reduce((sum, c) => sum + Number(c.amount), 0);
      const amountFormatted = formatBRL(totalAmount);
      const isInadimplente = client.contract_status === "inadimplente";

      const chargeRows = clientCharges.map((c) => ({
        label: c.description,
        value: formatBRL(Number(c.amount)),
      }));

      const html = buildEmail({
        preheader: `Lembrete: sua(s) fatura(s) de ${amountFormatted} vencem em ${DAYS_BEFORE} dia(s).`,
        title: "Lembrete de vencimento",
        greeting: `Olá, ${firstName}!`,
        body: isInadimplente
          ? `
            <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Identificamos uma <strong>pendência financeira</strong> em sua conta. Entre em contato com nossa equipe para regularizar a situação e garantir a continuidade dos serviços.</p>
          `
          : `
            <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Este é um lembrete: sua(s) fatura(s) vence(m) em <strong>${DAYS_BEFORE} dia(s)</strong>, no dia <strong>${dueDateFormatted}</strong>.</p>
            <p style="margin:0;font-size:14px;line-height:22px;color:#333333;">Mantenha o pagamento em dia para garantir a continuidade dos serviços sem interrupção.</p>
          `,
        highlight: {
          title: "Resumo da cobrança",
          rows: [
            ...chargeRows,
            { label: "Total", value: amountFormatted },
            { label: "Vencimento", value: dueDateFormatted },
            {
              label: "Status",
              value: isInadimplente ? "⚠ Inadimplente" : "✓ Ativo",
            },
          ],
        },
        button: {
          label: "Acessar o portal →",
          href: PORTAL_URL,
        },
        ...(isInadimplente && {
          warning:
            "Sua conta apresenta pendências financeiras. Entre em contato com nossa equipe para evitar a suspensão dos serviços.",
        }),
        note: "Em caso de dúvidas sobre cobranças, entre em contato pelo suporte do portal ou pelo WhatsApp.",
      });

      const result = await sendEmail({
        to: client.email,
        subject: isInadimplente
          ? `[Elkys] Atenção: pendência financeira em sua conta`
          : `[Elkys] Lembrete: fatura(s) vence(m) em ${DAYS_BEFORE} dia(s)`,
        html,
      });

      if (result.ok) sent++;
      else failed++;
    }

    return new Response(
      JSON.stringify({ ok: true, sent, failed, total: Object.keys(chargesByClient).length }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
