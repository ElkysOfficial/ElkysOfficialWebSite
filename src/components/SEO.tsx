/**
 * @fileoverview Componente SEO imperativo (sem react-helmet-async).
 *
 * Substituiu a versao baseada em <Helmet> — Helmet roda um virtual DOM
 * paralelo pra reconciliar <head>, custando ~5-15ms de TBT em cada mount
 * e levando ~15KB gzip no bundle inicial. Essa versao faz write direto
 * via document.querySelector/setAttribute dentro de useEffect: sem VDOM,
 * sem provider, sem dependencia externa.
 *
 * Funcionamento:
 * - Meta tags existentes no HTML estatico (index.html) sao ATUALIZADAS
 *   in-place (via selector). Se nao existirem, sao criadas.
 * - JSON-LD dinamico: cada <script data-elk-seo="true"> injetado por um
 *   SEO e removido antes do proximo ser inserido (navegacao entre rotas).
 *   O JSON-LD estatico do index.html (@graph) nao e tocado — roda sempre.
 * - Cleanup: nao reverte nada. A proxima rota monta seu SEO e sobrescreve.
 *   Em SPA isso e suficiente porque cada rota sempre monta seu SEO.
 */
import { useEffect } from "react";

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
  /** robots meta (default: "index, follow") */
  robots?: string;
}

const DEFAULTS = {
  title: "Elkys | Soluções Inteligentes em Software & Automação B2B",
  description:
    "Especialistas em desenvolvimento de software sob demanda. Engenharia de dados e automação B2B de alta performance. Aplicações web, mobile, RPA e integrações empresariais em Belo Horizonte.",
  canonical: "https://elkys.com.br/",
  ogImage: "https://elkys.com.br/og-image.jpg",
  ogType: "website",
  twitterCard: "summary_large_image" as const,
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
};

function upsertMeta(selector: string, attrName: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function SEO({
  title = DEFAULTS.title,
  description = DEFAULTS.description,
  canonical = DEFAULTS.canonical,
  ogImage = DEFAULTS.ogImage,
  ogType = DEFAULTS.ogType,
  twitterCard = DEFAULTS.twitterCard,
  jsonLd,
  robots = DEFAULTS.robots,
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    // Primary
    upsertMeta('meta[name="title"]', "name", "title", title);
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[name="robots"]', "name", "robots", robots);
    upsertLink("canonical", canonical);

    // Open Graph
    upsertMeta('meta[property="og:type"]', "property", "og:type", ogType);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonical);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:image"]', "property", "og:image", ogImage);
    upsertMeta('meta[property="og:image:alt"]', "property", "og:image:alt", title);

    // Twitter
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", twitterCard);
    upsertMeta('meta[name="twitter:url"]', "name", "twitter:url", canonical);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    upsertMeta(
      'meta[name="twitter:image"]',
      "name",
      "twitter:image",
      ogImage.replace("og-image.jpg", "twitter-card.jpg")
    );
    upsertMeta('meta[name="twitter:image:alt"]', "name", "twitter:image:alt", title);

    // JSON-LD: remove os dinamicos anteriores e insere o novo. O JSON-LD
    // estatico do @graph (index.html) NAO tem o data-elk-seo, preservado.
    document.head
      .querySelectorAll('script[type="application/ld+json"][data-elk-seo="true"]')
      .forEach((s) => s.remove());

    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.elkSeo = "true";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, ogImage, ogType, twitterCard, robots, jsonLd]);

  return null;
}
