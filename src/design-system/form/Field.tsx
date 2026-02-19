import * as React from "react";
import { cn } from "@/design-system/utils/cn";

export type FieldProps = React.HTMLAttributes<HTMLDivElement>;

const Field = React.forwardRef<HTMLDivElement, FieldProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
));
Field.displayName = "Field";

export { Field };
