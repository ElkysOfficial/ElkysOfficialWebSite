import * as React from "react";
import { cn } from "@/design-system/utils/cn";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Quando true, exibe um asterisco vermelho (text-destructive) ao lado
   * do texto do label sinalizando que o campo associado é obrigatório.
   * O asterisco recebe aria-hidden porque a obrigatoriedade real do
   * campo é comunicada pelo atributo `required` do
   * <input>/<select>/<textarea>, não pelo visual — esse é o padrão WCAG.
   */
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("block text-sm font-medium text-foreground mb-2", className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  )
);
Label.displayName = "Label";

export { Label };
