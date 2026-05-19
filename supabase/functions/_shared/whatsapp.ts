/**
 * Helper compartilhado de envio via WhatsApp.
 *
 * Dispara uma mensagem pelo bot de WhatsApp (Sonar Bot) hospedado na VPS,
 * atraves do API Receiver (POST /send). Usado pelas edge functions send-*
 * para espelhar no WhatsApp os e-mails enviados aos clientes.
 *
 * Principio de robustez: NADA aqui pode quebrar o envio do e-mail. Toda
 * falha (sem telefone, sem token, API fora do ar, timeout) e' logada e
 * resulta em `false` -- o fluxo de e-mail segue normalmente.
 *
 * Secrets necessarios (Supabase do portal Elkys):
 *   WHATSAPP_API_URL    -- base do API Receiver (default http://82.25.68.106:3002)
 *   WHATSAPP_API_TOKEN  -- token Bearer do API Receiver
 */

const WHATSAPP_API_URL = (Deno.env.get("WHATSAPP_API_URL") ?? "http://82.25.68.106:3002").replace(
  /\/+$/,
  ""
);
const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN") ?? "";
const TIMEOUT_MS = 8000;

/**
 * Normaliza um telefone brasileiro para o JID do WhatsApp.
 * Aceita formatos variados (com +, espacos, parenteses, hifens).
 * Retorna null se o numero nao tiver digitos suficientes.
 *
 * @param phone telefone em qualquer formato
 * @returns JID `<digitos>@s.whatsapp.net` ou null
 */
export function toWhatsAppJid(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").toString().replace(/\D/g, "");
  // Numero local minimo: DDD (2) + numero (8) = 10 digitos.
  if (digits.length < 10) return null;
  // Numeros locais (10-11 digitos) recebem o DDI do Brasil (55).
  // Numeros com 12+ digitos assume-se que ja vem com DDI.
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `${full}@s.whatsapp.net`;
}

/**
 * Envia uma mensagem de texto pelo WhatsApp. Nunca lanca excecao.
 *
 * @param phone telefone do destinatario (qualquer formato)
 * @param text  conteudo da mensagem
 * @returns true se a API confirmou o envio; false em qualquer falha
 */
export async function sendWhatsApp(
  phone: string | null | undefined,
  text: string
): Promise<boolean> {
  const jid = toWhatsAppJid(phone);
  if (!jid) {
    console.warn("[whatsapp] telefone ausente ou invalido -- envio pulado");
    return false;
  }
  if (!WHATSAPP_API_TOKEN) {
    console.error("[whatsapp] WHATSAPP_API_TOKEN nao configurado -- envio pulado");
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${WHATSAPP_API_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
      },
      body: JSON.stringify({ to: jid, text }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[whatsapp] /send respondeu ${res.status} ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[whatsapp] falha ao enviar: ${(err as Error).message}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
