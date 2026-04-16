import { useState } from "react";
import { Button, cn } from "@/design-system";

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  className?: string;
}

export default function ExportMenu({ onExportCSV, onExportPDF, className }: ExportMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="gap-1.5 text-xs"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Exportar
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 flex flex-col gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onExportCSV();
                setOpen(false);
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-success/10 text-[9px] font-bold text-success">
                CSV
              </span>
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => {
                onExportPDF();
                setOpen(false);
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-destructive/10 text-[9px] font-bold text-destructive">
                PDF
              </span>
              Exportar PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
