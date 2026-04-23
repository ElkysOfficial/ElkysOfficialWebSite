/**
 * Edge Function: send-inadimplencia-warning
 *
 * Envia email cordial a clientes que acabaram de entrar em inadimplencia.
 * Le client_inadimplencia_warnings com warning_sent_at IS NULL
 * AND exited_at IS NULL AND warning_error IS NULL, envia email, e marca
 * warning_sent_at (ou warning_error em caso de falha).
 *
 * Idempotencia:
 *  - Unique index em (client_id) WHERE exited_at IS NULL garante 1 evento aberto.
 *  - warning_sent_at preenchido => nao reenviado.
 *  - warning_error preenchido => nao retentado automaticamente (decisao: sem
 *    reenvio ruidoso; admin pode limpar warning_error manualmente para reenviar).
 *  - Se cliente sair e reentrar, o trigger abre novo evento => novo envio.
 *
 * Deploy:
 *   supabase functions deploy send-inadimplencia-warning --no-verify-jwt
 *
 * Secrets: RESEND_API_KEY, FROM_EMAIL, PORTAL_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { buildEmail, sendEmail, CORS } from "../_shared/email-template.ts";
import {
  isServiceRoleRequest,
  requireOperationalAccess,
  createServiceRoleClient,
} from "../_shared/auth.ts";

const MAX_PER_RUN = 200;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    if (!isServiceRoleRequest(req)) {
      const auth = await requireOperationalAccess(req, CORS);
      if (auth instanceof Response) return auth;
    }

    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/cliente";
    const admin = createServiceRoleClient();

    const { data: pending, error: pendingError } = await admin
      .from("client_inadimplencia_warnings")
      .select("id, client_id, entered_at")
      .is("warning_sent_at", null)
      .is("exited_at", null)
      .is("warning_error", null)
      .order("entered_at", { ascending: true })
      .limit(MAX_PER_RUN);

    if (pendingError) {
      console.error("[inadimplencia-warning] query error:", pendingError.message);
      return new Response(JSON.stringify({ error: pendingError.message }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, failed: 0, skipped: 0 }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const event of pending) {
      const { data: client } = await admin
        .from("clients")
        .select("full_name, email, nome_fantasia, client_type, contract_status")
        .eq("id", event.client_id)
        .maybeSingle();

      if (!client) {
        skipped++;
        await admin
          .from("client_inadimplencia_warnings")
          .update({ warning_error: "Client not found" })
          .eq("id", event.id);
        continue;
      }

      if (!client.email) {
        skipped++;
        await admin
          .from("client_inadimplencia_warnings")
          .update({ warning_error: "Client without email" })
          .eq("id", event.id);
        continue;
      }

      // Guarda extra: se o cliente nao estiver mais inadimplente, nao envia.
      // O trigger deveria ter fechado o evento, mas cobre o caso de o trigger
      // nao ter rodado (ex: migracao manual).
      if (client.contract_status !== "inadimplente") {
        skipped++;
        await admin
          .from("client_inadimplencia_warnings")
          .update({ exited_at: new Date().toISOString() })
          .eq("id", event.id);
        continue;
      }

      const clientName =
        client.client_type === "pj" && client.nome_fantasia
          ? client.nome_fantasia
          : client.full_name;
      const firstName = clientName.split(" ")[0];

      const html = buildEmail({
        preheader: "Aviso sobre o status do seu contrato.",
        title: "Aviso importante sobre seu contrato",
        greeting: `Olá, ${firstName}.`,
        body: `
          <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Identificamos pendências financeiras em sua conta que resultaram na alteração do status do seu contrato.</p>
          <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">Solicitamos a regularização da situação o quanto antes para evitar medidas administrativas e escalação do caso. Se os pagamentos já foram efetuados, desconsidere este aviso; caso precise negociar, entre em contato com nosso time financeiro pelo portal.</p>
          <p style="margin:0;font-size:14px;line-height:22px;color:#333333;">Estamos à disposição para esclarecer dúvidas e encontrar a melhor solução em conjunto.</p>
        `,
        button: {
          label: "Acessar financeiro →",
          href: `${PORTAL_URL}/financeiro`,
        },
      });

      const result = await sendEmail({
        to: client.email,
        subject: "Aviso importante sobre seu contrato",
        html,
      });

      if (result.ok) {
        const { error: updErr } = await admin
          .from("client_inadimplencia_warnings")
          .update({ warning_sent_at: new Date().toISOString() })
          .eq("id", event.id);
        if (updErr) {
          console.error("[inadimplencia-warning] update success row failed:", updErr.message);
        }
        sent++;
      } else {
        await admin
          .from("client_inadimplencia_warnings")
          .update({ warning_error: result.error ?? "Unknown error" })
          .eq("id", event.id);
        failed++;
      }
    }

    console.log(`[inadimplencia-warning] sent=${sent} failed=${failed} skipped=${skipped}`);

    return new Response(JSON.stringify({ ok: true, sent, failed, skipped }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[inadimplencia-warning] fatal:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
