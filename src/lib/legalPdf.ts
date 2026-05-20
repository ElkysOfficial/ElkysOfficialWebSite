/**
 * Gerador de PDF dos documentos legais (Termos de Uso, Politica de
 * Privacidade, Politica de Cookies).
 *
 * Estilo seguindo o padrao dos contratos modelo em docs/contratos modelos/
 * (Lucas Alves de Freitas, HAPMINAS, etc):
 *   - Preto e branco, sem faixa colorida ou logo grafico
 *   - Titulo principal em CAIXA ALTA centralizado
 *   - Secoes em CAIXA ALTA numeradas (1., 2., 3.)
 *   - Subsecoes "1.1.", "1.2." preservadas do conteudo
 *   - Tipografia serif (Times), texto justificado, margem 25mm
 *   - Rodape discreto: "Elkys · Versao X · Pagina Y de Z"
 *
 * Por que existe (versus window.print()):
 *   PDFs incompletos no Chrome/Firefox por overflow do container scrolled,
 *   position:fixed pai, race condition na classe printing. Aceite legal
 *   precisa de evidencia integra do documento — caminho programatico
 *   garante isso.
 *
 * Conteudo: mesma fonte das paginas publicas /terms-of-service,
 * /privacy-policy e /cookie-policy (componentes TermsBody/PrivacyBody/
 * CookieBody).
 */

import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactElement } from "react";

import TermsBody from "@/components/legal/TermsBody";
import PrivacyBody from "@/components/legal/PrivacyBody";
import CookieBody from "@/components/legal/CookieBody";

let _jsPDFModule: typeof import("jspdf") | null = null;
async function loadJsPDF() {
  if (!_jsPDFModule) _jsPDFModule = await import("jspdf");
  return _jsPDFModule.default;
}

/* ------------------------------------------------------------------ */
/*  Constantes de estilo (padrao juridico, preto/branco)                */
/* ------------------------------------------------------------------ */

const BLACK: [number, number, number] = [0, 0, 0];
const GRAY_DARK: [number, number, number] = [40, 40, 40];
const GRAY_MID: [number, number, number] = [110, 110, 110];

const PAGE_MARGIN_X = 25;
const PAGE_MARGIN_TOP = 22;
const PAGE_MARGIN_BOTTOM = 22;

const FONT_FAMILY = "times";

const FONT_SIZE_COVER_TITLE = 16; // titulo na capa
const FONT_SIZE_PART_TITLE = 13; // "PARTE I — TERMOS DE USO"
const FONT_SIZE_SECTION = 11; // "1. DISPOSICOES PRELIMINARES"
const FONT_SIZE_BODY = 10.5;
const FONT_SIZE_FOOTER = 8.5;

const LINE_HEIGHT_BODY = 5.4;
const LINE_HEIGHT_SECTION = 6.8;
const PARAGRAPH_GAP = 3;
const SECTION_GAP = 5;

/* ------------------------------------------------------------------ */
/*  Tokens                                                              */
/* ------------------------------------------------------------------ */

type Token =
  | { type: "partTitle"; text: string; subtitle?: string }
  | { type: "sectionTitle"; text: string }
  | { type: "paragraph"; runs: TextRun[] }
  | { type: "separator" };

type TextRun = { text: string; bold?: boolean; italic?: boolean };

/* ------------------------------------------------------------------ */
/*  Parser HTML estatico → tokens                                       */
/* ------------------------------------------------------------------ */

function htmlToTokens(html: string): Token[] {
  const container = document.createElement("template");
  container.innerHTML = html;
  const root = container.content;
  const tokens: Token[] = [];

  const walk = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "h2") {
      tokens.push({ type: "sectionTitle", text: collapseWs(el.textContent ?? "") });
      return;
    }
    if (tag === "p") {
      const runs = collectRuns(el);
      if (runs.some((r) => r.text.trim().length > 0)) {
        tokens.push({ type: "paragraph", runs });
      }
      return;
    }
    if (tag === "hr") {
      tokens.push({ type: "separator" });
      return;
    }
    el.childNodes.forEach(walk);
  };

  root.childNodes.forEach(walk);
  return tokens;
}

function collectRuns(el: HTMLElement, bold = false, italic = false): TextRun[] {
  const runs: TextRun[] = [];
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length > 0) runs.push({ text, bold, italic });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const child = node as HTMLElement;
    const tag = child.tagName.toLowerCase();
    const childBold = bold || tag === "strong" || tag === "b";
    const childItalic = italic || tag === "em" || tag === "i";
    runs.push(...collectRuns(child, childBold, childItalic));
  });
  return runs;
}

function collapseWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------------------------ */
/*  Renderer                                                            */
/* ------------------------------------------------------------------ */

type PdfDoc = InstanceType<Awaited<ReturnType<typeof loadJsPDF>>>;

interface RenderContext {
  doc: PdfDoc;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  y: number;
  version: string;
  dateLabel: string;
}

function setFont(
  ctx: RenderContext,
  style: "normal" | "bold" | "italic" | "bolditalic",
  size: number
) {
  ctx.doc.setFont(FONT_FAMILY, style);
  ctx.doc.setFontSize(size);
}

function ensureSpace(ctx: RenderContext, needed: number) {
  if (ctx.y + needed > ctx.pageHeight - PAGE_MARGIN_BOTTOM) {
    ctx.doc.addPage();
    ctx.y = PAGE_MARGIN_TOP + 4;
  }
}

function renderPartTitle(ctx: RenderContext, token: { text: string; subtitle?: string }) {
  ensureSpace(ctx, 18);
  setFont(ctx, "bold", FONT_SIZE_PART_TITLE);
  ctx.doc.setTextColor(...BLACK);
  // Caixa alta + centralizado, padrao do contrato modelo.
  ctx.doc.text(token.text.toUpperCase(), ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 7;
  if (token.subtitle) {
    setFont(ctx, "italic", FONT_SIZE_FOOTER);
    ctx.doc.setTextColor(...GRAY_MID);
    ctx.doc.text(token.subtitle, ctx.pageWidth / 2, ctx.y, { align: "center" });
    ctx.y += 4;
  }
  // Linha horizontal sutil sob o titulo.
  ctx.doc.setDrawColor(...GRAY_MID);
  ctx.doc.setLineWidth(0.3);
  ctx.doc.line(ctx.pageWidth / 2 - 25, ctx.y + 1, ctx.pageWidth / 2 + 25, ctx.y + 1);
  ctx.y += 10;
}

function renderSectionTitle(ctx: RenderContext, text: string) {
  ensureSpace(ctx, LINE_HEIGHT_SECTION + 4);
  ctx.y += SECTION_GAP - 1;
  setFont(ctx, "bold", FONT_SIZE_SECTION);
  ctx.doc.setTextColor(...BLACK);
  // Caixa alta — alinhamento com o padrao "1. OBJETO" do contrato modelo.
  const upper = text.toUpperCase();
  const lines = ctx.doc.splitTextToSize(upper, ctx.contentWidth);
  for (const line of lines) {
    ctx.doc.text(line, PAGE_MARGIN_X, ctx.y);
    ctx.y += LINE_HEIGHT_SECTION;
  }
  ctx.y += 1;
}

function renderParagraph(ctx: RenderContext, runs: TextRun[]) {
  if (runs.length === 0) return;
  setFont(ctx, "normal", FONT_SIZE_BODY);
  ctx.doc.setTextColor(...GRAY_DARK);

  // Decomposicao em atoms (palavras + whitespace) com largura pre-medida.
  type Atom = { text: string; bold: boolean; italic: boolean; width: number };
  const atoms: Atom[] = [];
  for (const run of runs) {
    const parts = run.text.split(/(\s+)/);
    for (const part of parts) {
      if (part.length === 0) continue;
      const style: "normal" | "bold" | "italic" | "bolditalic" =
        run.bold && run.italic
          ? "bolditalic"
          : run.bold
            ? "bold"
            : run.italic
              ? "italic"
              : "normal";
      ctx.doc.setFont(FONT_FAMILY, style);
      const width = ctx.doc.getTextWidth(part);
      atoms.push({ text: part, bold: !!run.bold, italic: !!run.italic, width });
    }
  }

  // Empacota em linhas respeitando contentWidth.
  type Line = { atoms: Atom[]; widthNoTrailingWs: number };
  const lines: Line[] = [];
  let current: Atom[] = [];
  let currentWidth = 0;
  for (const atom of atoms) {
    if (currentWidth + atom.width <= ctx.contentWidth || current.length === 0) {
      current.push(atom);
      currentWidth += atom.width;
    } else {
      const trimmed = trimTrailingWs(current);
      lines.push({ atoms: trimmed.atoms, widthNoTrailingWs: trimmed.width });
      current = [];
      currentWidth = 0;
      if (atom.text.trim().length > 0) {
        current.push(atom);
        currentWidth = atom.width;
      }
    }
  }
  if (current.length > 0) {
    const trimmed = trimTrailingWs(current);
    lines.push({ atoms: trimmed.atoms, widthNoTrailingWs: trimmed.width });
  }

  for (let i = 0; i < lines.length; i++) {
    ensureSpace(ctx, LINE_HEIGHT_BODY);
    const line = lines[i];
    const isLastLine = i === lines.length - 1;
    renderLine(ctx, line.atoms, line.widthNoTrailingWs, isLastLine);
    ctx.y += LINE_HEIGHT_BODY;
  }
  ctx.y += PARAGRAPH_GAP;
}

function trimTrailingWs(
  atoms: Array<{ text: string; bold: boolean; italic: boolean; width: number }>
) {
  const out = [...atoms];
  let widthDelta = 0;
  while (out.length > 0 && /^\s+$/.test(out[out.length - 1].text)) {
    widthDelta += out[out.length - 1].width;
    out.pop();
  }
  const totalWidth = atoms.reduce((acc, a) => acc + a.width, 0) - widthDelta;
  return { atoms: out, width: totalWidth };
}

function renderLine(
  ctx: RenderContext,
  atoms: Array<{ text: string; bold: boolean; italic: boolean; width: number }>,
  widthNoTrailingWs: number,
  isLastLine: boolean
) {
  // Justificado: distribui o residual de espaco igualmente entre os ws
  // interiores. Ultima linha do paragrafo alinha apenas a esquerda.
  const whitespaceAtoms = atoms.filter((a) => /^\s+$/.test(a.text));
  const extraSpacePerWs =
    !isLastLine && whitespaceAtoms.length > 0
      ? Math.max(0, (ctx.contentWidth - widthNoTrailingWs) / whitespaceAtoms.length)
      : 0;

  let x = PAGE_MARGIN_X;
  for (const atom of atoms) {
    const style: "normal" | "bold" | "italic" | "bolditalic" =
      atom.bold && atom.italic
        ? "bolditalic"
        : atom.bold
          ? "bold"
          : atom.italic
            ? "italic"
            : "normal";
    ctx.doc.setFont(FONT_FAMILY, style);
    ctx.doc.text(atom.text, x, ctx.y);
    x += atom.width + (/^\s+$/.test(atom.text) ? extraSpacePerWs : 0);
  }
}

function renderSeparator(ctx: RenderContext) {
  ensureSpace(ctx, 10);
  ctx.y += 3;
  ctx.doc.setDrawColor(...GRAY_MID);
  ctx.doc.setLineWidth(0.2);
  ctx.doc.line(PAGE_MARGIN_X + 40, ctx.y, ctx.pageWidth - PAGE_MARGIN_X - 40, ctx.y);
  ctx.y += 8;
}

function drawFooter(ctx: RenderContext, pageNumber: number, totalPages: number) {
  const { doc, pageWidth, pageHeight } = ctx;
  const footerY = pageHeight - 12;
  setFont(ctx, "normal", FONT_SIZE_FOOTER);
  doc.setTextColor(...GRAY_MID);

  // Esquerda: identificacao discreta
  doc.text(`Elkys · Versão ${ctx.version} · ${ctx.dateLabel}`, PAGE_MARGIN_X, footerY);
  // Direita: paginacao
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - PAGE_MARGIN_X, footerY, {
    align: "right",
  });
}

function drawCover(ctx: RenderContext) {
  const { doc, pageWidth, pageHeight } = ctx;
  // Sem faixa colorida. Centralizado verticalmente.
  const midY = pageHeight / 2 - 30;

  setFont(ctx, "bold", FONT_SIZE_COVER_TITLE);
  doc.setTextColor(...BLACK);
  doc.text("TERMOS DE USO,", pageWidth / 2, midY, { align: "center" });
  doc.text("POLÍTICA DE PRIVACIDADE E", pageWidth / 2, midY + 8, { align: "center" });
  doc.text("POLÍTICA DE COOKIES", pageWidth / 2, midY + 16, { align: "center" });

  setFont(ctx, "italic", 11);
  doc.setTextColor(...GRAY_MID);
  doc.text("Elkys Software House", pageWidth / 2, midY + 30, { align: "center" });

  setFont(ctx, "normal", 10);
  doc.setTextColor(...GRAY_DARK);
  doc.text(`Versão ${ctx.version} · Gerado em ${ctx.dateLabel}`, pageWidth / 2, midY + 38, {
    align: "center",
  });

  // Bloco intro centrado.
  setFont(ctx, "normal", 10);
  doc.setTextColor(...GRAY_DARK);
  const intro =
    "Este documento consolida os instrumentos legais que regem a relação entre a Elkys e seus clientes, parceiros e usuários. A leitura completa é parte do aceite registrado eletronicamente no portal do cliente.";
  const introLines = doc.splitTextToSize(intro, ctx.contentWidth - 20);
  let introY = midY + 56;
  for (const line of introLines) {
    doc.text(line, pageWidth / 2, introY, { align: "center" });
    introY += 5.5;
  }

  // Linha divisoria sob o intro.
  doc.setDrawColor(...GRAY_MID);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - 30, introY + 6, pageWidth / 2 + 30, introY + 6);
}

/* ------------------------------------------------------------------ */
/*  API publica                                                         */
/* ------------------------------------------------------------------ */

interface GenerateOptions {
  /** Versao mostrada na capa e no rodape. */
  version: string;
  /** Nome do arquivo final (sem extensao). */
  filename?: string;
}

export async function exportLegalPDF(options: GenerateOptions): Promise<void> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN_X * 2;
  const dateLabel = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const ctx: RenderContext = {
    doc,
    pageWidth,
    pageHeight,
    contentWidth,
    y: PAGE_MARGIN_TOP + 4,
    version: options.version,
    dateLabel,
  };

  // Capa.
  drawCover(ctx);

  // Partes: cada uma comeca em pagina propria.
  const parts: Array<{ title: string; subtitle: string; el: ReactElement }> = [
    {
      title: "Parte I — Termos de Uso",
      subtitle: `Versão ${options.version} · Vigência atual`,
      el: createElement(TermsBody),
    },
    {
      title: "Parte II — Política de Privacidade",
      subtitle: "Em conformidade com a LGPD (Lei nº 13.709/2018)",
      el: createElement(PrivacyBody),
    },
    {
      title: "Parte III — Política de Cookies",
      subtitle: "Tecnologias de armazenamento utilizadas pela aplicação",
      el: createElement(CookieBody),
    },
  ];

  for (const part of parts) {
    doc.addPage();
    ctx.y = PAGE_MARGIN_TOP + 4;
    renderPartTitle(ctx, { text: part.title, subtitle: part.subtitle });

    const html = renderToStaticMarkup(part.el);
    const tokens = htmlToTokens(html);
    for (const token of tokens) {
      switch (token.type) {
        case "sectionTitle":
          renderSectionTitle(ctx, token.text);
          break;
        case "paragraph":
          renderParagraph(ctx, token.runs);
          break;
        case "separator":
          renderSeparator(ctx);
          break;
        case "partTitle":
          // partTitle e injetado manualmente entre as Partes.
          break;
      }
    }
  }

  // Rodape em todas as paginas, agora que o total e conhecido.
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(ctx, p, totalPages);
  }

  const filename = options.filename ?? `elkys-termos-privacidade-cookies-v${options.version}.pdf`;
  doc.save(filename);
}
