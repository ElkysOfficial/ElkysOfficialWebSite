import { formatPortalDateTime, formatRelativePortal } from "@/lib/portal";
import { cn } from "@/design-system";

interface RelativeDateProps {
  date?: string | null;
  className?: string;
  /**
   * Quando verdadeiro, usa a data absoluta como texto e o relativo como tooltip.
   * Default é o oposto: relativo como texto, absoluto como tooltip.
   */
  absoluteFirst?: boolean;
  as?: "span" | "time";
}

/**
 * Exibe uma data em formato relativo ("há 3 dias") com o valor absoluto
 * acessível via tooltip nativo. Ideal para listagens, feeds, logs.
 */
export default function RelativeDate({
  date,
  className,
  absoluteFirst = false,
  as: Tag = "span",
}: RelativeDateProps) {
  if (!date) return <span className={cn("text-muted-foreground", className)}>-</span>;
  const relative = formatRelativePortal(date);
  const absolute = formatPortalDateTime(date);
  const text = absoluteFirst ? absolute : relative;
  const tooltip = absoluteFirst ? relative : absolute;
  const dateTimeAttr = date.includes("T") ? date : `${date}T00:00:00`;

  return (
    <Tag className={cn(className)} title={tooltip} {...(Tag === "time" ? { dateTime: dateTimeAttr } : {})}>
      {text}
    </Tag>
  );
}
