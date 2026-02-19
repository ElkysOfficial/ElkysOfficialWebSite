/**
 * @fileoverview Componente SEO para gerenciamento de meta tags
 * @description Gerencia todas as meta tags de SEO, Open Graph e Twitter Cards
 * usando react-helmet-async para renderização server-side friendly
 */

import { Helmet } from "react-helmet-async";

/**
 * Props do componente SEO
 * @interface SEOProps
 */
interface SEOProps {
  /** Título da página - aparece na aba do navegador e nos resultados de busca */
  title?: string;
  /** Descrição da página para SEO (máx. 160 caracteres recomendado) */
  description?: string;
  /** URL canônica da página */
  canonical?: string;
  /** URL da imagem para Open Graph (1200x630px recomendado) */
  ogImage?: string;
  /** Tipo de conteúdo Open Graph */
  ogType?: string;
  /** Tipo de card do Twitter */
  twitterCard?: "summary" | "summary_large_image";
  /** Dados estruturados JSON-LD para rich snippets */
  jsonLd?: object;
}

/** Constantes de SEO da marca ELKYS */
const SEO_DEFAULTS = {
  siteName: "ELKYS",
  locale: "pt_BR",
  baseUrl: "https://elkys.com.br",
} as const;

/**
 * Componente SEO - Gerencia meta tags para otimização de mecanismos de busca
 *
 * @description
 * Este componente deve ser incluído em todas as páginas para garantir
 * SEO consistente. Ele gerencia:
 * - Meta tags primárias (title, description)
 * - Open Graph para compartilhamento em redes sociais
 * - Twitter Cards
 * - Dados estruturados JSON-LD
 *
 * @example
 * ```tsx
 * <SEO
 *   title="ELKYS | Serviços"
 *   description="Conheça nossos serviços de desenvolvimento"
 *   canonical="https://elkys.com.br/servicos"
 * />
 * ```
 */
export default function SEO({
  title = "ELKYS | Software Sob Medida para Empresas em Crescimento",
  description = "ELKYS - Engenharia de software sob demanda. Desenvolvemos aplicações web, mobile, automações e integrações com processo, qualidade e previsibilidade.",
  canonical = "https://elkys.com.br/",
  ogImage = "https://elkys.com.br/og-image.jpg",
  ogType = "website",
  twitterCard = "summary_large_image",
  jsonLd,
}: SEOProps) {
  return (
    <Helmet>
      {/* ========================================
          PRIMARY META TAGS
          Essenciais para SEO básico
          ======================================== */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* ========================================
          OPEN GRAPH / FACEBOOK
          Para compartilhamento em redes sociais
          ======================================== */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content={SEO_DEFAULTS.locale} />
      <meta property="og:site_name" content={SEO_DEFAULTS.siteName} />

      {/* ========================================
          TWITTER CARDS
          Para compartilhamento no Twitter/X
          ======================================== */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage.replace("og-image.jpg", "twitter-card.jpg")} />
      <meta name="twitter:image:alt" content={title} />

      {/* ========================================
          JSON-LD STRUCTURED DATA
          Para rich snippets nos resultados de busca
          ======================================== */}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
