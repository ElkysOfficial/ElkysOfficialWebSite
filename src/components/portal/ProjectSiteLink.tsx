import { buttonVariants, cn } from "@/design-system";

interface ProjectSiteLinkProps {
  url?: string | null;
  className?: string;
  /**
   * Quando true, renderiza so o icone de external link (compacto).
   * Default e false — mostra icone + host domain (ex: "akproducoes.com.br").
   */
  iconOnly?: boolean;
  /**
   * Texto opcional que substitui o hostname como rotulo do link.
   * Util para reaproveitar o componente fora de "site de produto"
   * (ex: "Ver contrato" na tela juridica).
   */
  label?: string;
}

/**
 * Icone inline de "external link" — caixa com seta indicando que abre
 * em nova aba. Inline SVG para nao depender de biblioteca de icones.
 */
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10 2h4v4" />
      <path d="m14 2-6 6" />
      <path d="M12 9v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

/**
 * Extrai o hostname de uma URL, removendo "www." para ficar mais compacto.
 * Retorna a URL original se o parsing falhar (fallback seguro).
 */
function formatHost(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Renderiza um link clicavel para o produto/site publico de um projeto.
 * Abre em nova aba com rel="noopener noreferrer" para seguranca. Quando
 * a URL e nula ou string vazia, nao renderiza nada — fica invisivel em
 * projetos que nao tem produto publico (branding, consultoria etc).
 *
 * Usado tanto no portal admin quanto no cliente, mantendo consistencia
 * visual: border accent sutil, icone de external link, texto com o
 * hostname (ex: "akproducoes.com.br") ou so o icone no modo compacto.
 */
export default function ProjectSiteLink({
  url,
  className,
  iconOnly = false,
  label,
}: ProjectSiteLinkProps) {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  const href = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  const host = formatHost(trimmed);
  const display = label ?? host;

  // PA12: reaproveita buttonVariants do DS para herdar altura minima,
  // ring de foco, arredondamento, transicoes e tipografia padrao. As
  // cores accent sobrescrevem o outline padrao para manter a identidade
  // visual original do componente.
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-auto min-h-0 gap-1.5 border-accent/40 bg-accent/5 px-2 py-1 text-xs text-accent hover:border-accent hover:bg-accent/10 hover:text-accent",
        className
      )}
      title={label ? `${label} — ${host}` : `Abrir ${host} em nova aba`}
    >
      <ExternalLinkIcon className="h-3.5 w-3.5" />
      {iconOnly ? null : <span className="truncate max-w-[200px]">{display}</span>}
    </a>
  );
}
