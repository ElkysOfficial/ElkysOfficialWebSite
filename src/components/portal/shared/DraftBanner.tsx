import { Card, CardContent } from "@/design-system";

interface DraftBannerProps {
  savedAt: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
  /** Texto do titulo, opcional. Default "Temos um rascunho salvo". */
  title?: string;
}

function formatRelative(date: Date | null): string {
  if (!date) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `${diffMin} min atras`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h atras`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d atras`;
}

/**
 * Banner que oferece restaurar um rascunho salvo em localStorage.
 * Mostra desde quando o rascunho existe e duas acoes: restaurar ou descartar.
 * Funciona com useFormDraftAutoSave em modo autoRestore=false.
 */
export default function DraftBanner({
  savedAt,
  onRestore,
  onDiscard,
  title = "Temos um rascunho salvo",
}: DraftBannerProps) {
  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Salvo automaticamente {formatRelative(savedAt)}. Deseja restaurar ou comecar do zero?
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={onRestore}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Restaurar
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
