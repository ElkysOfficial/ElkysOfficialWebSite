/**
 * Edge Function: send-client-action-required
 * Notifica o cliente quando o admin solicita uma acao/dados vinculada ao projeto.
 * O email é customizado de acordo com o action_type da pendência.
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
import { escapeHtml } from "../_shared/validation.ts";

type ActionType =
  | "geral"
  | "reuniao"
  | "documento"
  | "aprovacao"
  | "informacao"
  | "feedback"
  | "acesso"
  | "conteudo";

interface Payload {
  client_id: string;
  project_id: string;
  project_name: string;
  step_title: string;
  step_description?: string;
  due_date?: string;
  action_type?: ActionType;
  meeting_link?: string;
}

function formatDate(date?: string | null): string | null {
  if (!date) return null;
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ── Email content per action_type ────────────────────────────────── */

interface ActionTemplate {
  emoji: string;
  title: string;
  subjectPrefix: string;
  intro: (projectName: string) => string;
  detail: string;
  buttonLabel: string;
  note: string;
}

const ACTION_TEMPLATES: Record<ActionType, ActionTemplate> = {
  geral: {
    emoji: "📋",
    title: "Ação necessária",
    subjectPrefix: "Ação necessária",
    intro: (p) =>
      `Precisamos da sua colaboração para dar continuidade ao projeto <strong>${escapeHtml(p)}</strong>.`,
    detail: "Acesse o portal para visualizar os detalhes da solicitação e enviar sua resposta.",
    buttonLabel: "Responder no portal →",
    note: "Sua resposta é importante para o andamento do projeto. Em caso de dúvidas, abra um ticket pelo suporte do portal.",
  },
  reuniao: {
    emoji: "📅",
    title: "Reunião pendente",
    subjectPrefix: "Reunião",
    intro: (p) =>
      `Gostaríamos de agendar uma <strong>reunião</strong> com você para alinhar os próximos passos do projeto <strong>${escapeHtml(p)}</strong>.`,
    detail:
      "Escolha o melhor horário na sua agenda e confirme pelo botão abaixo. Caso nenhum dos horários funcione, entre em contato pelo portal.",
    buttonLabel: "Agendar reunião →",
    note: "A reunião é importante para garantir que o projeto avance conforme o planejado.",
  },
  documento: {
    emoji: "📄",
    title: "Documento pendente",
    subjectPrefix: "Documento necessário",
    intro: (p) =>
      `Precisamos que você nos envie um <strong>documento</strong> para dar continuidade ao projeto <strong>${escapeHtml(p)}</strong>.`,
    detail: "Acesse o portal para verificar o documento solicitado e faça o envio de forma segura.",
    buttonLabel: "Enviar documento →",
    note: "Caso tenha dúvidas sobre o formato ou conteúdo do documento, entre em contato pelo suporte do portal.",
  },
  aprovacao: {
    emoji: "✅",
    title: "Aprovação necessária",
    subjectPrefix: "Aprovação pendente",
    intro: (p) =>
      `Uma entrega do projeto <strong>${escapeHtml(p)}</strong> está aguardando a sua <strong>aprovação</strong>.`,
    detail:
      "Acesse o portal para revisar os detalhes e confirmar sua aprovação. Caso precise de ajustes, você pode solicitar diretamente pelo portal.",
    buttonLabel: "Revisar e aprovar →",
    note: "Sua aprovação é necessária para avançarmos para a próxima etapa do projeto.",
  },
  informacao: {
    emoji: "💬",
    title: "Informação necessária",
    subjectPrefix: "Informação pendente",
    intro: (p) =>
      `Precisamos de algumas <strong>informações</strong> suas para avançar no projeto <strong>${escapeHtml(p)}</strong>.`,
    detail: "Acesse o portal para ver os detalhes da solicitação e enviar sua resposta.",
    buttonLabel: "Responder no portal →",
    note: "Quanto antes recebermos as informações, mais rápido conseguimos avançar no projeto.",
  },
  feedback: {
    emoji: "🔍",
    title: "Feedback solicitado",
    subjectPrefix: "Feedback pendente",
    intro: (p) =>
      `Uma entrega do projeto <strong>${escapeHtml(p)}</strong> está pronta para a sua <strong>avaliação</strong>.`,
    detail:
      "Acesse o portal para testar, revisar e nos enviar seu retorno. Seu feedback é essencial para garantir que tudo esteja conforme o esperado.",
    buttonLabel: "Avaliar entrega →",
    note: "Teste com calma e nos envie seu retorno detalhado. Ajustes serão realizados com base na sua avaliação.",
  },
  acesso: {
    emoji: "🔑",
    title: "Acesso necessário",
    subjectPrefix: "Acesso pendente",
    intro: (p) =>
      `Precisamos de <strong>credenciais ou acessos</strong> do seu lado para dar continuidade ao projeto <strong>${escapeHtml(p)}</strong>.`,
    detail:
      "Acesse o portal para ver os detalhes sobre o acesso necessário e envie as informações de forma segura.",
    buttonLabel: "Enviar credenciais →",
    note: "Por segurança, recomendamos enviar credenciais diretamente pelo portal. Nunca compartilhe senhas por e-mail.",
  },
  conteudo: {
    emoji: "🎨",
    title: "Conteúdo necessário",
    subjectPrefix: "Conteúdo pendente",
    intro: (p) =>
      `Precisamos que você nos envie <strong>materiais ou conteúdo</strong> para avançar no projeto <strong>${escapeHtml(p)}</strong>.`,
    detail:
      "Acesse o portal para ver os detalhes sobre o material solicitado (textos, imagens, logos, vídeos, etc.).",
    buttonLabel: "Enviar conteúdo →",
    note: "Para melhor qualidade, envie imagens em alta resolução e textos revisados. Caso tenha dúvidas sobre o formato, estamos à disposição.",
  },
};

/* ── Document-style visual block for 'documento' type ─────────────── */

function buildDocumentBlock(title: string, description?: string): string {
  return `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
      style="margin:0 0 22px 0;border:1px solid #e5e7eb;border-left:3px solid #472680;">
      <tr>
        <td style="padding:14px 16px;">
          <table role="presentation" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td valign="top" style="padding-right:12px;">
                <span style="font-size:24px;line-height:1;">📄</span>
              </td>
              <td valign="top">
                <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#111111;">${escapeHtml(title)}</p>
                ${description ? `<p style="margin:0;font-size:13px;color:#666666;line-height:20px;">${escapeHtml(description)}</p>` : `<p style="margin:0;font-size:12px;color:#999999;">Acesse o portal para mais detalhes</p>`}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

/* ── Meeting block with calendar button ───────────────────────────── */

function buildMeetingBlock(meetingLink: string): string {
  return `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
      style="margin:0 0 22px 0;border:1px solid #e5e7eb;border-left:3px solid #148f8f;">
      <tr>
        <td style="padding:14px 16px;">
          <table role="presentation" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td valign="top" style="padding-right:12px;">
                <span style="font-size:24px;line-height:1;">📅</span>
              </td>
              <td valign="top">
                <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#111111;">Agende o melhor horário</p>
                <a href="${meetingLink}" target="_blank" style="display:inline-block;background-color:#148f8f;color:#ffffff;font-size:13px;font-weight:700;padding:10px 20px;text-decoration:none;">
                  Escolher horário →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
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
      step_title,
      step_description,
      due_date,
      action_type = "geral",
      meeting_link,
    } = (await req.json()) as Payload;

    if (!client_id || !project_name || !step_title) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PORTAL_URL = Deno.env.get("PORTAL_URL") ?? "https://elkys.com.br/portal/cliente";
    const CALENDAR_LINK =
      Deno.env.get("CALENDAR_LINK") ?? "https://calendar.app.google/PBxfwurV31hdDfiK7";

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
    const tpl = ACTION_TEMPLATES[action_type] ?? ACTION_TEMPLATES.geral;

    // Build highlight rows
    const highlightRows = [
      { label: "Projeto", value: project_name },
      { label: "Solicitação", value: step_title },
      ...(step_description ? [{ label: "Detalhes", value: step_description }] : []),
      ...(formattedDueDate ? [{ label: "Prazo", value: formattedDueDate }] : []),
    ];

    // Build extra blocks based on action_type
    let extraBlock = "";
    if (action_type === "documento") {
      extraBlock = buildDocumentBlock(step_title, step_description);
    } else if (action_type === "reuniao") {
      const link = meeting_link || CALENDAR_LINK;
      extraBlock = buildMeetingBlock(link);
    }

    // Button destination: meeting link for reuniao, otherwise portal
    const buttonHref =
      action_type === "reuniao" && meeting_link
        ? meeting_link
        : `${PORTAL_URL}/projetos/${project_id}`;

    const html = buildEmail({
      preheader: `${tpl.subjectPrefix}: ${step_title} — projeto ${project_name}`,
      title: tpl.title,
      greeting: `Olá, ${firstName}!`,
      body: `
        <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;">${tpl.intro(project_name)}</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#333333;">${tpl.detail}</p>
        ${extraBlock}
        ${formattedDueDate ? `<p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#333333;"><strong>Prazo sugerido:</strong> ${formattedDueDate}</p>` : ""}
      `,
      highlight: { title: "Detalhes da solicitação", rows: highlightRows },
      button: { label: tpl.buttonLabel, href: buttonHref },
      note: tpl.note,
    });

    const result = await sendEmail({
      to: client.email,
      subject: `${tpl.subjectPrefix}: ${step_title} — ${project_name}`,
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
