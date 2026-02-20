import { cn } from "../utils/cn";
import hexagonalBg from "../../../public/imgs/icons/hexagonal.webp";

export interface HexPatternProps {
  /** Variante semântica do padrão hexagonal decorativo */
  variant?: "banner" | "card" | "subtle" | "inline";
  /** Classes adicionais para override pontual */
  className?: string;
}

const variantStyles = {
  /** CTAs full-width (Services, Cases, ServiceDetail) */
  banner:
    "hex-card-bg -right-10 -bottom-10 w-48 h-48 md:w-60 md:h-60 opacity-[0.25] dark:opacity-[0.10] animate-hex-spin will-change-transform",
  /** Cards menores com gradiente (Contact, ContactForm) */
  card: "hex-card-bg -right-10 -bottom-10 w-44 h-44 md:w-48 md:h-48 opacity-[0.25] dark:opacity-[0.10] animate-hex-spin will-change-transform",
  /** Cards com fundo neutro (benefits, info cards) */
  subtle:
    "hex-card-bg -right-8 -bottom-8 w-32 h-32 md:w-36 md:h-36 opacity-[0.06] dark:opacity-[0.08] animate-hex-spin will-change-transform",
  /** Elementos inline com interação (botão Saiba mais) */
  inline:
    "absolute -right-4 -bottom-4 w-20 h-20 opacity-[0.10] dark:opacity-[0.15] group-hover:opacity-[0.25] animate-hex-spin transition-opacity duration-300 pointer-events-none will-change-transform",
};

/**
 * HexPattern — Padrão hexagonal decorativo da marca Elkys.
 *
 * Imagem hexagonal.webp posicionada como overlay em containers
 * com gradiente primário. Animação de rotação contínua (hex-spin).
 *
 * O container pai deve usar a classe `hex-card-container` (variantes banner/card)
 * ou `position: relative` + `overflow: hidden` (variante inline).
 */
const HexPattern = ({ variant = "banner", className }: HexPatternProps) => (
  <img
    src={hexagonalBg}
    alt=""
    aria-hidden="true"
    className={cn(variantStyles[variant], className)}
  />
);

HexPattern.displayName = "HexPattern";

export { HexPattern };
