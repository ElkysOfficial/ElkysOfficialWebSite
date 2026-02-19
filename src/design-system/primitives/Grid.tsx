import * as React from "react";
import { cn } from "@/design-system/utils/cn";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns at md breakpoint */
  cols?: 2 | 3 | 4;
  /** Gap size */
  gap?: 4 | 6 | 8;
}

const colsMap: Record<number, string> = {
  2: "grid md:grid-cols-2",
  3: "grid md:grid-cols-2 lg:grid-cols-3",
  4: "grid md:grid-cols-2 lg:grid-cols-4",
};

const gapMap: Record<number, string> = {
  4: "gap-4",
  6: "gap-6",
  8: "gap-6 md:gap-8",
};

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 2, gap = 8, ...props }, ref) => (
    <div ref={ref} className={cn(colsMap[cols], gapMap[gap], className)} {...props} />
  )
);
Grid.displayName = "Grid";

export { Grid };
