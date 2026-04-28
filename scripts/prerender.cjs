/**
 * Pre-render estatico por rota.
 *
 * Motivacao: como SPA pura (CSR) com canonical hardcoded em index.html
 * apontando para `/`, o Googlebot via o mesmo canonical para todas as
 * rotas antes do React hidratar — Search Console reportava "Pagina
 * alternativa com tag canonica adequada" e "Rastreada, mas nao indexada".
 *
 * Solucao: pra cada rota publica, gera dist/<rota>/index.html com
 * canonical/title/description/OG baked-in. Apache DirectoryIndex serve
 * esse arquivo quando o usuario acessa /rota diretamente. O React assume
 * apos hidratacao normalmente (mesmo bundle).
 *
 * Tambem gera dist/404.html pra servir 404 real em URLs desconhecidas
 * (via ErrorDocument no .htaccess), eliminando soft 404.
 */
const fs = require("fs");
const path = require("path");
const {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_IMAGE,
  getRoutes,
} = require("./routes-seo.cjs");

const DIST_DIR = path.join(__dirname, "../dist");
const INDEX_PATH = path.join(DIST_DIR, "index.html");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Substitui (ou injeta) uma tag <meta>/<title>/<link> por atributo-chave.
 * Atua somente na primeira ocorrencia (head tags sao unicas por definicao SEO).
 */
function upsertTag(html, regex, replacement) {
  if (regex.test(html)) {
    return html.replace(regex, replacement);
  }
  // Injeta antes do </head>
  return html.replace(/<\/head>/, `  ${replacement}\n  </head>`);
}

function renderRoute(baseHtml, route, { noindex = false } = {}) {
  const canonical = `${SITE_URL}${route.path === "/" ? "/" : route.path}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const robots = noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  let html = baseHtml;

  html = upsertTag(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = upsertTag(
    html,
    /<meta\s+name="title"[^>]*>/,
    `<meta name="title" content="${title}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${description}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="robots"[^>]*>/,
    `<meta name="robots" content="${robots}" />`
  );
  html = upsertTag(
    html,
    /<link\s+rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${canonical}" />`
  );

  // Open Graph
  html = upsertTag(
    html,
    /<meta\s+property="og:url"[^>]*>/,
    `<meta property="og:url" content="${canonical}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${title}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+property="og:description"[^>]*>/,
    `<meta property="og:description" content="${description}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+property="og:image"[^>]*(?<!secure_url"[^>]*)>/,
    `<meta property="og:image" content="${DEFAULT_OG_IMAGE}" />`
  );

  // Twitter
  html = upsertTag(
    html,
    /<meta\s+name="twitter:url"[^>]*>/,
    `<meta name="twitter:url" content="${canonical}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${title}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${description}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="twitter:image"[^>]*(?<!alt"[^>]*)>/,
    `<meta name="twitter:image" content="${DEFAULT_TWITTER_IMAGE}" />`
  );

  return html;
}

function writeRouteHtml(route, html) {
  if (route.path === "/") {
    fs.writeFileSync(INDEX_PATH, html, "utf8");
    return INDEX_PATH;
  }
  const dir = path.join(DIST_DIR, route.path);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "index.html");
  fs.writeFileSync(file, html, "utf8");
  return file;
}

function main() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error("❌ dist/index.html nao encontrado. Rode vite build primeiro.");
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(INDEX_PATH, "utf8");
  const routes = getRoutes();

  for (const route of routes) {
    const html = renderRoute(baseHtml, route);
    const out = writeRouteHtml(route, html);
    console.log(`✅ Pre-render: ${route.path} → ${path.relative(DIST_DIR, out)}`);
  }

  // 404 com noindex (servido via ErrorDocument no .htaccess)
  const notFoundHtml = renderRoute(baseHtml, {
    path: "/404",
    title: "Página não encontrada | Elkys",
    description: "A página que você procura não existe ou foi movida.",
  }, { noindex: true });
  fs.writeFileSync(path.join(DIST_DIR, "404.html"), notFoundHtml, "utf8");
  console.log("✅ 404.html gerado");

  console.log("🎉 Pre-render concluido!");
}

try {
  main();
} catch (err) {
  console.error("❌ Erro no pre-render:", err);
  process.exit(1);
}
