import { Link } from "react-router-dom";
import { cn } from "@/design-system";

export interface BreadcrumbTrailItem {
  label: string;
  href?: string;
}

interface PortalBreadcrumbsProps {
  trail: BreadcrumbTrailItem[];
  className?: string;
}

/**
 * Renderiza uma trilha de navegação consistente no topo do conteúdo.
 * - O último item nunca é clicável (representa a página atual).
 * - Itens anteriores são links.
 * - Separador hexagonal sutil para reforçar a identidade visual.
 * - Oculta-se automaticamente se a trilha tiver 1 item ou menos.
 */
export default function PortalBreadcrumbs({ trail, className }: PortalBreadcrumbsProps) {
  if (trail.length <= 1) return null;

  return (
    <nav
      aria-label="Navegação estrutural"
      className={cn("mb-4 flex flex-wrap items-center gap-1.5 text-xs", className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {isLast || !item.href ? (
                <span
                  className={cn(
                    "font-medium",
                    isLast ? "text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              )}
              {!isLast ? (
                <span className="text-muted-foreground/50" aria-hidden="true">
                  ›
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
