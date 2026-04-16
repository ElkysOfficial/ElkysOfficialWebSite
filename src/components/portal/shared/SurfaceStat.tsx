import { cn } from "@/design-system";

type Tone = "brand" | "success" | "warning" | "destructive" | "neutral";

const TONE_TEXT: Record<Tone, string> = {
  brand: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  neutral: "text-foreground",
};

const TONE_BAR: Record<Tone, string> = {
  brand: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  neutral: "bg-border",
};

export default function SurfaceStat({
  label,
  value,
  subInfo,
  tone = "neutral",
}: {
  label: string;
  value: string;
  subInfo?: string;
  tone?: Tone;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3 pl-4 sm:p-4 sm:pl-5">
      <span className={cn("absolute inset-y-0 left-0 w-[3px] rounded-l-xl", TONE_BAR[tone])} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[11px]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 whitespace-nowrap text-base font-semibold tracking-tight sm:mt-1 sm:text-lg",
          TONE_TEXT[tone]
        )}
      >
        {value}
      </p>
      {subInfo ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">{subInfo}</p>
      ) : null}
    </div>
  );
}
