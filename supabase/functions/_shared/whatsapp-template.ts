/**
 * Template de WhatsApp da Elkys.
 *
 * Padroniza a estrutura de TODA mensagem disparada pelas edge functions:
 *
 *   <saudação formal com Sr./Sra. + nome+sobrenome>
 *   <linha em branco>
 *   <corpo da mensagem (1+ paragrafos)>
 *   <linha em branco>
 *   <CTA opcional: descricao + link>
 *   <linha em branco>
 *   <fecho institucional opcional>
 *   <linha em branco>
 *   _Mensagem automatica do sistema. Por favor, nao responda este numero._
 *
 * Por que builder em vez de strings cruas:
 * - Garante que TODA mensagem termina com o disclaimer (requisito do
 *   negocio: "favor nao responder").
 * - Centraliza formatacao (negrito, link, lista) — qualquer mudanca futura
 *   no estilo (ex: trocar disclaimer, adicionar assinatura) e um ponto.
 * - Facilita testar e revisar texto sem ler 17 funcoes distintas.
 *
 * Convencoes do WhatsApp Markdown (renderizadas pelo app no telefone):
 *   *texto*   → negrito
 *   _texto_   → italico
 *   ~texto~   → tachado
 *   ` texto ` → monoespacado (codigo)
 */

/**
 * Rodape obrigatorio em italico. Tom institucional, sem ambiguidade de
 * que e mensagem nao-monitorada.
 */
export const WHATSAPP_DISCLAIMER =
  "_Mensagem automática do sistema. Por favor, não responda este número._";

/**
 * Envolve um trecho em negrito (`*texto*`). Trim defensivo: WhatsApp nao
 * renderiza `* texto *` (com espaco) como negrito.
 */
export function bold(text: string): string {
  return `*${text.trim()}*`;
}

/**
 * Linha destacada para identificar um documento/registro. Padrao:
 *   *Tipo: Referencia*
 *
 * Exemplos:
 *   docHighlight("Nota Fiscal", "NF Marco - Jose Pedro Ferreira")
 *     → "*Nota Fiscal: NF Marco - Jose Pedro Ferreira*"
 *   docHighlight("Cobranca", "Mensalidade Marco/2026 - R$ 1.500,00")
 *     → "*Cobranca: Mensalidade Marco/2026 - R$ 1.500,00*"
 */
export function docHighlight(type: string, reference: string): string {
  return `*${type.trim()}: ${reference.trim()}*`;
}

/**
 * Linha de CTA padronizada: rotulo curto + URL em monoespacado (impede que
 * o app insira o link no meio do texto e quebra menos em telas estreitas).
 *
 * Exemplo:
 *   ctaLink("Abrir financeiro", "https://app.elkys.com.br/portal/cliente/financeiro")
 *     → "Abrir financeiro:\nhttps://app.elkys.com.br/portal/cliente/financeiro"
 */
export function ctaLink(label: string, url: string): string {
  return `${label.trim()}:\n${url.trim()}`;
}

/**
 * Bloco de itens em bullet (•). Cada string vira uma linha; entradas vazias
 * sao ignoradas para evitar "• " sozinho.
 */
export function bulletList(items: ReadonlyArray<string | null | undefined>): string {
  return items
    .filter((i): i is string => typeof i === "string" && i.trim().length > 0)
    .map((i) => `• ${i.trim()}`)
    .join("\n");
}

interface BuildOptions {
  /**
   * Saudacao de abertura (vinda de getWhatsAppGreetingFullName /
   * getWhatsAppTeamGreeting). Obrigatoria.
   */
  greeting: string;
  /**
   * Paragrafos do corpo, em ordem. Cada item vira um paragrafo separado
   * por linha em branco. Itens vazios sao ignorados — permite construcao
   * condicional (ex: `cliente?.tag ? texto : null`).
   */
  paragraphs: ReadonlyArray<string | null | undefined>;
  /**
   * Bloco opcional de CTA renderizado entre o corpo e o fecho. Use
   * `ctaLink(label, url)` para montar.
   */
  cta?: string;
  /**
   * Fecho opcional antes do disclaimer. Padrao: nenhum — o disclaimer
   * institucional ja encerra. Use quando o contexto pedir um "estamos a
   * disposicao" ou assinatura especifica.
   */
  closing?: string;
  /**
   * Para mensagens internas (equipe) — troca o disclaimer pra um texto
   * mais leve, sem o "por favor nao responda" que nao faz sentido para
   * comunicacao interna.
   */
  internal?: boolean;
}

/**
 * Monta a mensagem final pronta pra `sendWhatsApp(phone, text)`.
 *
 * Toda mensagem termina com o WHATSAPP_DISCLAIMER (ou variante interna),
 * sem excecao — esse e o contrato com o negocio.
 */
export function buildWhatsAppMessage(options: BuildOptions): string {
  const blocks: string[] = [];
  blocks.push(options.greeting.trim());

  for (const para of options.paragraphs) {
    if (typeof para === "string" && para.trim().length > 0) {
      blocks.push(para.trim());
    }
  }

  if (options.cta && options.cta.trim().length > 0) {
    blocks.push(options.cta.trim());
  }

  if (options.closing && options.closing.trim().length > 0) {
    blocks.push(options.closing.trim());
  }

  const disclaimer = options.internal
    ? "_Mensagem automática do sistema interno. Para suporte, fale com seu gestor direto._"
    : WHATSAPP_DISCLAIMER;
  blocks.push(disclaimer);

  // Paragrafos separados por linha em branco — padrao de mensageria
  // moderna (WhatsApp/Slack/Telegram). Linha unica entre eles seria
  // visualmente apertado demais.
  return blocks.join("\n\n");
}
