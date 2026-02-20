import * as React from "react";
import { cn } from "@/design-system/utils/cn";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tailwind spacing value (e.g. 4, 6, 8) */
  gap?: 2 | 3 | 4 | 6 | 8;
}

const gapMap: Record<number, string> = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap = 4, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col", gapMap[gap], className)} {...props} />
  )
);
Stack.displayName = "Stack";

export { Stack };
