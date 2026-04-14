import { cn } from "@/design-system";
import { formatPortalDate } from "@/lib/portal";

interface ProposalExpiryCountdownProps {
  validUntil?: string | null;
  /**
   * Status atual da proposta. O countdown so faz sentido visualmente
   * em "enviada" ou "rascunho" — em "aprovada"/"rejeitada"/"expirada"
   * o badge muda de tom ou e omitido pra nao distrair.
   */
  status?: string | null;
  className?: string;
  /**
   * Quando true, renderiza apenas a contagem sem o label completo.
   * Default e false — mostra "vence em X dias" ou equivalente.
   */
  compact?: boolean;
}

type Tone = "destructive" | "warning" | "muted" | "neutral" | "expired";

const TONE_STYLES: Record<Tone, string> = {
  destructive: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-warning/40 bg-warning/10 text-warning",
  muted: "border-border/60 bg-muted/40 text-muted-foreground",
  neutral: "border-border/60 bg-muted/20 text-muted-foreground",
  expired: "border-destructive/40 bg-destructive/15 text-destructive",
};

/**
 * Calcula dias restantes entre hoje e uma data YYYY-MM-DD.
 * Positivo = no futuro; zero = hoje; negativo = ja passou.
 */
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Badge de contagem regressiva para a data de validade de uma proposta.
 * Tom visual reflete a urgencia:
 *
 * - Ja expirou (dias < 0) -> destructive "Expirada"
 * - Expira em 0-3 dias -> destructive, pede acao imediata
 * - Expira em 4-7 dias -> warning, proximo
 * - Expira em > 7 dias -> muted, longe ainda
 * - Proposta aprovada/rejeitada -> neutral (informativo)
 * - Sem valid_until definido -> nao renderiza
 */
export default function ProposalExpiryCountdown({
  validUntil,
  status,
  className,
  compact = false,
}: ProposalExpiryCountdownProps) {
  if (!validUntil) return null;

  const isDecided = status === "aprovada" || status === "rejeitada";
  const days = daysUntil(validUntil);

  let tone: Tone;
  let label: string;

  if (status === "expirada" || (days < 0 && !isDecided)) {
    tone = "expired";
    label = compact
      ? `expirou há ${Math.abs(days)}d`
      : `Expirou há ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}`;
  } else if (isDecided) {
    tone = "neutral";
    label = compact ? formatPortalDate(validUntil) : `Válida até ${formatPortalDate(validUntil)}`;
  } else if (days === 0) {
    tone = "destructive";
    label = compact ? "vence hoje" : "Vence hoje";
  } else if (days <= 3) {
    tone = "destructive";
    label = compact ? `${days}d` : `Vence em ${days} dia${days === 1 ? "" : "s"}`;
  } else if (days <= 7) {
    tone = "warning";
    label = compact ? `${days}d` : `Vence em ${days} dias`;
  } else {
    tone = "muted";
    label = compact ? `${days}d` : `Vence em ${days} dias`;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        TONE_STYLES[tone],
        className
      )}
      title={`Validade: ${formatPortalDate(validUntil)}`}
    >
      {label}
    </span>
  );
}
