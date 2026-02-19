import * as React from "react";
import { cn } from "@/design-system/utils/cn";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Background variant matching the ELKYS section pattern */
  bg?: "background" | "muted" | "gradient-subtle" | "gradient-hero" | "card";
}

const bgMap: Record<string, string> = {
  background: "bg-background",
  muted: "bg-muted",
  "gradient-subtle": "bg-gradient-subtle",
  "gradient-hero": "bg-gradient-hero",
  card: "bg-card",
};

const Section = React.forwardRef<HTMLElement, SectionProps>(({ className, bg, ...props }, ref) => (
  <section
    ref={ref}
    className={cn("py-16 md:py-20 lg:py-24", bg && bgMap[bg], className)}
    {...props}
  />
));
Section.displayName = "Section";

export { Section };
