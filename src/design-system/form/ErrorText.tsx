import * as React from "react";
import { cn } from "@/design-system/utils/cn";

export type ErrorTextProps = React.HTMLAttributes<HTMLParagraphElement>;

const ErrorText = React.forwardRef<HTMLParagraphElement, ErrorTextProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      role="alert"
      className={cn("text-destructive text-xs mt-1", className)}
      {...props}
    />
  )
);
ErrorText.displayName = "ErrorText";

export { ErrorText };
