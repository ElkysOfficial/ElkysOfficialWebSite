/**
 * Manifesto central de rotas publicas + metadados SEO.
 *
 * Consumido por:
 *  - generate-sitemap.cjs (gera sitemap.xml)
 *  - prerender.cjs (injeta canonical/title/description em dist/<rota>/index.html)
 *
 * Mantem os dois scripts em sincronia: uma unica fonte da verdade pra
 * canonical, o que elimina a classe de bug "canonical estatico apontando
 * pra home em todas as rotas" (causa direta de "Pagina alternativa com tag
 * canonica adequada" no Search Console).
 */
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://elkys.com.br";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_TWITTER_IMAGE = `${SITE_URL}/twitter-card.jpg`;

const SERVICES_FILE = path.join(__dirname, "../src/data/services.ts");

/**
 * Extrai slugs + titles + descriptions dos servicos de nivel raiz em services.ts.
 * Pega so os campos "description" imediatamente apos o "title" no nivel do objeto
 * Service (ignora nested ServiceBenefit.description que aparece em detail.benefits).
 */
function extractServices() {
  const content = fs.readFileSync(SERVICES_FILE, "utf8");
  const blockRegex =
    /slug:\s*["']([^"']+)["'],\s*title:\s*["']([^"']+)["'],\s*description:\s*\n?\s*["']([^"']+)["']/g;
  const out = [];
  let m;
  while ((m = blockRegex.exec(content)) !== null) {
    out.push({ slug: m[1], title: m[2], description: m[3] });
  }
  return out;
}

const staticRoutes = [
  {
    path: "/",
    title: "Elkys | Soluções Inteligentes em Software & Automação B2B",
    description:
      "Especialistas em desenvolvimento de software sob demanda. Engenharia de dados e automação B2B de alta performance. Aplicações web, mobile, RPA e integrações empresariais em Belo Horizonte.",
    changefreq: "weekly",
    priority: 1.0,
  },
  {
    path: "/cases",
    title: "Portfólio - Elkys | Projetos e Produtos em Produção",
    description:
      "Conheça os projetos e produtos desenvolvidos pela Elkys: sistemas SaaS próprios, sites institucionais, landing pages e automações. Entregas reais em operação.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/como-trabalhamos",
    title: "Hexa Design System (HDS) | Elkys",
    description:
      "O HDS é o framework de entrega da Elkys: 6 etapas, escopo fechado, validação a cada ciclo e rastreabilidade de ponta a ponta.",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/terms-of-service",
    title: "Termos de Uso | Elkys - Condições de Serviço",
    description:
      "Termos de Uso do website Elkys. Conheça as condições de uso, direitos, obrigações e políticas aplicáveis aos nossos serviços de desenvolvimento de software.",
    changefreq: "yearly",
    priority: 0.3,
  },
  {
    path: "/privacy-policy",
    title: "Política de Privacidade | Elkys - Proteção de Dados LGPD",
    description:
      "Política de Privacidade da Elkys em conformidade com a LGPD. Saiba como coletamos, usamos e protegemos seus dados pessoais.",
    changefreq: "yearly",
    priority: 0.3,
  },
  {
    path: "/cookie-policy",
    title: "Política de Cookies | Elkys",
    description:
      "Política de Cookies da Elkys. Saiba quais cookies utilizamos, suas finalidades e como gerenciá-los em seu navegador.",
    changefreq: "yearly",
    priority: 0.3,
  },
];

function buildServiceRoutes() {
  return extractServices().map((s) => ({
    path: `/servicos/${s.slug}`,
    title: `${s.title} | Elkys`,
    description: s.description,
    changefreq: "monthly",
    priority: 0.7,
  }));
}

function getRoutes() {
  return [...staticRoutes, ...buildServiceRoutes()];
}

module.exports = {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_IMAGE,
  getRoutes,
};
