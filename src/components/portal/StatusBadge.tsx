import { cn } from "@/design-system";

type Tone = "accent" | "success" | "warning" | "destructive" | "secondary" | "primary";

const toneClassName: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  secondary: "bg-secondary text-muted-foreground",
};

export default function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[28px] items-center rounded-full px-3 text-xs font-semibold tracking-wide",
        toneClassName[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
