/**
 * Export utilities — CSV & PDF with Elkys branding.
 *
 * PDF uses jsPDF + jspdf-autotable for professional table rendering
 * with the Elkys visual identity (purple header, structured layout).
 */

// jsPDF + autotable loaded lazily on first export (~200KB saved from initial bundles)
let _jsPDFModule: typeof import("jspdf") | null = null;
let _autoTableModule: typeof import("jspdf-autotable") | null = null;

async function loadPdfDeps() {
  if (!_jsPDFModule || !_autoTableModule) {
    [_jsPDFModule, _autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
  }
  return { jsPDF: _jsPDFModule.default, autoTable: _autoTableModule.default };
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ExportColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

export interface ExportConfig {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
  generatedBy?: string;
}

/* ------------------------------------------------------------------ */
/*  Elkys Brand Constants                                              */
/* ------------------------------------------------------------------ */

const ELKYS_PRIMARY: [number, number, number] = [71, 38, 128]; // #472680
const ELKYS_SECONDARY: [number, number, number] = [36, 49, 100]; // #243164
const ELKYS_ACCENT: [number, number, number] = [0, 194, 203]; // #00C2CB
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_GRAY: [number, number, number] = [248, 248, 250];
const DARK_TEXT: [number, number, number] = [30, 30, 40];
const MUTED_TEXT: [number, number, number] = [120, 120, 135];

/* ------------------------------------------------------------------ */
/*  CSV Export                                                         */
/* ------------------------------------------------------------------ */

export function exportCSV(config: ExportConfig): void {
  const { columns, rows, filename } = config;

  const header = columns.map((col) => `"${col.label}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const val = row[col.key] ?? "";
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");

  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const csv = `${bom}${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  PDF Export with Elkys Branding                                     */
/* ------------------------------------------------------------------ */

export async function exportPDF(config: ExportConfig): Promise<void> {
  const { title, subtitle, columns, rows, filename, generatedBy } = config;
  const { jsPDF, autoTable } = await loadPdfDeps();

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Header band ---
  doc.setFillColor(...ELKYS_PRIMARY);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Accent line under header
  doc.setFillColor(...ELKYS_ACCENT);
  doc.rect(0, 28, pageWidth, 1.5, "F");

  // Title text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text("ELKYS", 12, 12);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 12, 20);

  // Date on the right
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(8);
  doc.text(dateStr, pageWidth - 12, 12, { align: "right" });

  if (subtitle) {
    doc.setFontSize(8);
    doc.text(subtitle, pageWidth - 12, 18, { align: "right" });
  }

  // --- Summary line ---
  const startY = 34;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_TEXT);
  doc.text(`${rows.length} registro(s) exportados`, 12, startY);

  // --- Table ---
  const headLabels = columns.map((col) => col.label);
  const bodyData = rows.map((row) => columns.map((col) => String(row[col.key] ?? "—")));

  const colAligns = columns.map((col) => col.align ?? "left");

  autoTable(doc, {
    startY: startY + 4,
    head: [headLabels],
    body: bodyData,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      textColor: DARK_TEXT,
      lineColor: [220, 220, 228],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: ELKYS_SECONDARY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: LIGHT_GRAY,
    },
    columnStyles: Object.fromEntries(colAligns.map((align, i) => [i, { halign: align }])),
    margin: { left: 12, right: 12 },
    didDrawPage: (data) => {
      // Footer on every page
      const footerY = pageHeight - 8;

      // Footer line
      doc.setDrawColor(...ELKYS_ACCENT);
      doc.setLineWidth(0.5);
      doc.line(12, footerY - 3, pageWidth - 12, footerY - 3);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED_TEXT);

      const pageNum = `Pagina ${(data as { pageNumber?: number }).pageNumber ?? doc.getNumberOfPages()}`;
      doc.text(pageNum, pageWidth - 12, footerY, { align: "right" });

      doc.text(generatedBy ?? "Elkys — Relatorio gerado automaticamente", 12, footerY);
    },
  });

  doc.save(`${filename}.pdf`);
}
