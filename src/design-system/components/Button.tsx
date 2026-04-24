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
        sm: "h-9 min-h-[44px] rounded-md px-3 text-xs",
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
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /**
   * Quando true, desabilita o botão, substitui os filhos por um spinner
   * acessível e opcionalmente troca o texto. Preserva o layout original
   * evitando "saltos" ao entrar em estado de loading.
   */
  loading?: boolean;
  /**
   * Texto opcional exibido ao lado do spinner enquanto loading=true.
   * Se o texto terminar em "...", os pontos sao animados em cascata.
   * Se omitido, o conteúdo original do botão é escondido visualmente
   * mas mantido no DOM para preservar largura.
   */
  loadingText?: string;
  /**
   * Quando true, exibe um check verde (com animacao de entrada) em lugar
   * do conteudo normal. Usado para feedback pos-acao bem-sucedida. O
   * parent controla o timing (tipicamente setTimeout ~1.5s); o hook
   * useAsyncButton (src/hooks/useAsyncButton.ts) faz esse ciclo auto.
   */
  success?: boolean;
  /**
   * Texto opcional ao lado do check de sucesso. Ex: "Salvo!", "Enviado!".
   * Se omitido, aparece so o icone (largura preservada como em loading).
   */
  successLabel?: string;
}

const ButtonSpinner = () => (
  <span
    aria-hidden="true"
    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
  />
);

/**
 * Renderiza o texto separando o sufixo "..." (animado) do resto (estatico).
 * Se o texto nao termina em "...", renderiza inteiro sem animacao — assim
 * loadingText="Aguarde" continua funcionando sem dots.
 */
const LoadingLabel = ({ text }: { text: string }) => {
  if (!text.endsWith("...")) {
    return <span>{text}</span>;
  }
  const prefix = text.slice(0, -3);
  return (
    <span>
      {prefix}
      <span aria-hidden="true" className="inline-flex">
        <span className="animate-dot-pulse" style={{ animationDelay: "0ms" }}>
          .
        </span>
        <span className="animate-dot-pulse" style={{ animationDelay: "200ms" }}>
          .
        </span>
        <span className="animate-dot-pulse" style={{ animationDelay: "400ms" }}>
          .
        </span>
      </span>
      {/* texto acessivel sem animacao: screen readers leem "Salvando..." de uma vez */}
      <span className="sr-only">...</span>
    </span>
  );
};

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="none"
    className="h-4 w-4 animate-check-in"
  >
    <path
      d="M4 10.5l4 4 8-9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      loadingText,
      success = false,
      successLabel,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // success tem prioridade visual sobre loading (cobre o caso raro de
    // flip simultaneo quando a promise resolve rapido). Nao desabilita —
    // alguns fluxos permitem re-submit imediato apos success.
    const showSuccess = success && !loading;
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-live={loading || showSuccess ? "polite" : undefined}
        {...props}
      >
        {loading ? (
          <>
            <ButtonSpinner />
            {loadingText ? (
              <LoadingLabel text={loadingText} />
            ) : (
              <span className="invisible">{children}</span>
            )}
          </>
        ) : showSuccess ? (
          <>
            <CheckIcon />
            {successLabel ? (
              <span>{successLabel}</span>
            ) : (
              <span className="invisible">{children}</span>
            )}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
