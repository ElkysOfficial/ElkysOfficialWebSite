import * as React from "react";
import { cn } from "@/design-system/utils/cn";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tailwind spacing value (e.g. 4, 6, 8) */
  gap?: 2 | 3 | 4 | 6 | 8;
}

const gapMap: Record<number, string> = {
  2: "space-y-2",
  3: "space-y-3",
  4: "space-y-4",
  6: "space-y-6",
  8: "space-y-8",
};

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap = 4, ...props }, ref) => (
    <div ref={ref} className={cn(gapMap[gap], className)} {...props} />
  )
);
Stack.displayName = "Stack";

export { Stack };
