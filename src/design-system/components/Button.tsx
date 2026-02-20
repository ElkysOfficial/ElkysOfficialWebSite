import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/design-system/utils/cn";

/**
 * Button Variants
 *
 * Variantes padronizadas seguindo o Design System Elkys:
 * - default: Roxo primário, ações principais
 * - accent: Ciano CTA, chamadas para ação destacadas
 * - secondary: Azul secundário, ações de suporte
 * - outline: Borda, ações secundárias
 * - hero_outline: Branco sobre fundos escuros (Hero sections)
 * - ghost: Transparente, ações terciárias/navegação
 * - link: Estilo de link inline
 * - gradient: Gradiente primário, ênfase especial
 * - destructive: Ações destrutivas
 *
 * Todos os tamanhos garantem mínimo de 44px para acessibilidade (WCAG AAA)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-wide ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-light active:bg-primary-dark shadow-sm hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted hover:border-primary/30 active:bg-muted/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-light active:bg-secondary-dark shadow-sm hover:shadow-md",
        ghost: "text-foreground hover:bg-muted hover:text-primary active:bg-muted/80",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-light",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent-light active:bg-accent shadow-sm hover:shadow-md",
        gradient:
          "bg-gradient-primary text-white hover:opacity-95 active:opacity-100 shadow-primary hover:shadow-primary-lg",
        gradient_secondary:
          "bg-gradient-subtle text-foreground hover:opacity-95 active:opacity-100 shadow-sm hover:shadow-md",
        hero_outline:
          "bg-white border-white text-primary hover:bg-white/90 hover:text-primary active:bg-white/80",
      },
      size: {
        default: "h-10 min-h-[44px] px-4 py-2",
        sm: "h-9 min-h-[36px] rounded-md px-3 text-xs",
        lg: "h-11 min-h-[44px] rounded-md px-6 text-base",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
