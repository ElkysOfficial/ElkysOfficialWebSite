import { cn } from "@/design-system/utils/cn";

export interface HexRatingProps {
  /** Rating value from 0 to 5 (internal, never displayed as number) */
  rating: number;
  /** Maximum rating scale (default: 5) */
  max?: number;
  /** Trust label displayed beside hexagons */
  label?: string;
  /** Size of each hexagon in pixels */
  size?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Hexagon SVG path with rounded corners.
 * Regular hexagon proportions within 24x22 viewbox.
 */
const HEX_PATH =
  "M10.3 1.3a3 3 0 0 1 3.4 0l6.5 3.8a3 3 0 0 1 1.5 2.6v7.6a3 3 0 0 1-1.5 2.6l-6.5 3.8a3 3 0 0 1-3.4 0L3.8 17.9a3 3 0 0 1-1.5-2.6V7.7a3 3 0 0 1 1.5-2.6z";

interface SingleHexProps {
  fill: "full" | "half" | "empty";
  size: number;
}

const SingleHex = ({ fill, size }: SingleHexProps) => {
  const id = `hex-clip-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {fill === "full" && <path d={HEX_PATH} className="fill-accent" />}

      {fill === "half" && (
        <>
          <defs>
            <clipPath id={id}>
              <rect x="0" y="0" width="12" height="22" />
            </clipPath>
          </defs>
          <path d={HEX_PATH} className="fill-accent/20 dark:fill-accent/15" />
          <path d={HEX_PATH} className="fill-accent" clipPath={`url(#${id})`} />
        </>
      )}

      {fill === "empty" && (
        <path
          d={HEX_PATH}
          className="fill-transparent stroke-accent/30 dark:stroke-accent/20"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
};

/**
 * Resolve trust label based on rating value.
 * Maps rating ranges to semantic Portuguese labels.
 */
function getDefaultLabel(rating: number, max: number): string {
  const ratio = rating / max;
  if (ratio >= 1) return "Cliente verificado";
  if (ratio >= 0.8) return "Altamente recomendado";
  if (ratio >= 0.6) return "Cliente satisfeito";
  return "Feedback recebido";
}

/**
 * HexRating — Sistema de avaliação proprietário baseado em hexágonos.
 *
 * Medalhas de qualidade que substituem estrelas, sem exibir números.
 * Hexágonos preenchidos = pontos obtidos. Outline = pontos não obtidos.
 * Selo textual de confiança ao lado reforça a credibilidade.
 *
 * Suporta notas fracionadas com meio-preenchimento.
 */
const HexRating = ({ rating, max = 5, label, size = 16, className }: HexRatingProps) => {
  const clamped = Math.max(0, Math.min(rating, max));
  const fullCount = Math.floor(clamped);
  const hasHalf = clamped - fullCount >= 0.25 && clamped - fullCount < 0.75;
  const adjustedFull = clamped - fullCount >= 0.75 ? fullCount + 1 : fullCount;
  const emptyCount = max - adjustedFull - (hasHalf ? 1 : 0);

  const resolvedLabel = label ?? getDefaultLabel(rating, max);

  // Semantic aria-label (never shows numeric value visually)
  const ariaRatio = rating / max;
  const ariaText =
    ariaRatio >= 1
      ? "Avaliação máxima do cliente"
      : ariaRatio >= 0.8
        ? "Feedback altamente positivo"
        : "Avaliação do cliente";

  return (
    <div className={cn("flex items-center gap-2.5", className)} role="img" aria-label={ariaText}>
      <div className="flex items-center gap-1">
        {Array.from({ length: adjustedFull }).map((_, i) => (
          <SingleHex key={`full-${i}`} fill="full" size={size} />
        ))}
        {hasHalf && <SingleHex key="half" fill="half" size={size} />}
        {Array.from({ length: Math.max(0, emptyCount) }).map((_, i) => (
          <SingleHex key={`empty-${i}`} fill="empty" size={size} />
        ))}
      </div>

      <span className="text-xs text-muted-foreground font-medium">{resolvedLabel}</span>
    </div>
  );
};

export { HexRating };
