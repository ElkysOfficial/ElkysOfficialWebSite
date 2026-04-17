/**
 * Pre-render build-time das rotas publicas.
 *
 * Motivacao: a landing e CSR 100%. O PageSpeed reporta LCP delay de ~6.5s
 * porque o <h1> so aparece apos React hidratar. Pre-renderizando com
 * Chromium durante o build, geramos dist/<rota>/index.html com o HTML
 * renderizado completo (meta tags, JSON-LD, conteudo visivel). Resultado:
 *  - LCP melhora dramaticamente (conteudo no primeiro byte)
 *  - Share preview correto em WhatsApp/Slack/LinkedIn (meta tags por rota)
 *  - Indexacao SEO independente de JS
 *
 * Estrategia:
 *  - Inicia `vite preview` em background na porta 4174
 *  - Usa @playwright/test (ja instalado como devDep) para visitar cada rota
 *  - Aguarda DOM content + 500ms de quiet para React hidratar
 *  - Serializa document.documentElement.outerHTML
 *  - Salva em dist/<rota>/index.html (raiz: sobrescreve dist/index.html)
 *
 * Falha gracilmente: se chromium nao estiver instalado (ex: CI sem
 * `playwright install`), loga warning e termina OK — build segue normal.
 *
 * Executar manualmente: node scripts/prerender.cjs
 * No build: chamado automaticamente ao final de `npm run build`.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const DIST_DIR = path.join(__dirname, "../dist");
const SERVICES_FILE = path.join(__dirname, "../src/data/services.ts");
const PREVIEW_PORT = 4179; // fora das portas comuns (4173 do preview padrao)
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;

// Rotas fixas a pre-renderizar (devem existir em App.tsx como rotas publicas)
const STATIC_ROUTES = [
  "/",
  "/cases",
  "/como-trabalhamos",
  "/terms-of-service",
  "/privacy-policy",
  "/cookie-policy",
];

/** Extrai slugs de servicos do arquivo TS via regex (mesmo padrao do sitemap). */
function extractServiceSlugs() {
  try {
    const content = fs.readFileSync(SERVICES_FILE, "utf8");
    const regex = /slug:\s*["']([^"']+)["']/g;
    const slugs = [];
    let match;
    while ((match = regex.exec(content)) !== null) slugs.push(match[1]);
    return slugs;
  } catch {
    return [];
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Remove tags estaticas duplicadas pelo react-helmet-async.
 * Helmet ADICIONA tags novas com data-rh="true" em vez de substituir as
 * estaticas do index.html. Depois do prerender, cada rota acaba com 2
 * versoes de <title>, <meta og:*>, <link canonical>, etc. Mantemos apenas
 * a versao com data-rh (especifica da rota), removemos as estaticas.
 *
 * Tags gerenciadas por Helmet: title, description, canonical, og:*, twitter:*.
 */
function dedupHelmetTags(html) {
  const result = html;

  // <title>: se existe um com data-rh, remove o primeiro (estatico)
  if (/<title[^>]*data-rh="true"[^>]*>/.test(result)) {
    // Remove a primeira ocorrencia de <title>...</title> que NAO tem data-rh
    const match = result.match(/<title(?![^>]*data-rh)[^>]*>[^<]*<\/title>/);
    if (match) return result.replace(match[0], "") + ""; // garante string
  }

  return result;
}

/**
 * Aplica dedup para multiplas tags de meta/link com mesmo nome.
 * Estrategia: para cada "chave" (nome/property), se houver tag com data-rh,
 * remove todas as versoes SEM data-rh.
 */
function dedupAll(html) {
  let out = dedupHelmetTags(html);

  const metaProps = [
    "og:type",
    "og:url",
    "og:title",
    "og:description",
    "og:image",
    "og:image:secure_url",
    "og:image:alt",
    "og:image:width",
    "og:image:height",
    "og:locale",
    "og:site_name",
  ];
  const metaNames = [
    "title",
    "description",
    "twitter:card",
    "twitter:url",
    "twitter:title",
    "twitter:description",
    "twitter:image",
    "twitter:image:alt",
  ];

  for (const key of metaProps) {
    const rhPattern = new RegExp(
      `<meta[^>]*property="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*data-rh="true"[^>]*>`
    );
    if (rhPattern.test(out)) {
      const staticPattern = new RegExp(
        `<meta\\s+property="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"(?![^>]*data-rh)[^>]*>\\s*`,
        "g"
      );
      out = out.replace(staticPattern, "");
    }
  }

  for (const key of metaNames) {
    const rhPattern = new RegExp(
      `<meta[^>]*name="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*data-rh="true"[^>]*>`
    );
    if (rhPattern.test(out)) {
      const staticPattern = new RegExp(
        `<meta\\s+name="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"(?![^>]*data-rh)[^>]*>\\s*`,
        "g"
      );
      out = out.replace(staticPattern, "");
    }
  }

  // <link rel="canonical">
  if (/<link[^>]*rel="canonical"[^>]*data-rh="true"[^>]*>/.test(out)) {
    out = out.replace(/<link\s+rel="canonical"(?![^>]*data-rh)[^>]*>\s*/g, "");
  }

  return out;
}

async function waitForPreview(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* aguarda */
    }
    await sleep(300);
  }
  return false;
}

async function prerender() {
  if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, "index.html"))) {
    console.warn("⚠️  dist/index.html nao encontrado — pulando prerender (rode `npm run build` primeiro)");
    return;
  }

  // Tenta carregar chromium. Se falha, skipa sem erro — build continua OK.
  let chromium;
  try {
    ({ chromium } = require("@playwright/test"));
  } catch (err) {
    console.warn(
      "⚠️  @playwright/test nao disponivel — pulando prerender.",
      "   Instale com `npm ci` e `npx playwright install chromium`."
    );
    return;
  }

  const routes = [
    ...STATIC_ROUTES,
    ...extractServiceSlugs().map((slug) => `/servicos/${slug}`),
  ];

  console.log(`\n🔎 Pre-rendering ${routes.length} rota(s) publica(s)...`);

  // Start vite preview em background
  console.log(`   Iniciando vite preview na porta ${PREVIEW_PORT}...`);
  const preview = spawn("npx", ["vite", "preview", "--port", String(PREVIEW_PORT), "--strictPort"], {
    cwd: path.join(__dirname, ".."),
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  let previewKilled = false;
  const killPreview = () => {
    if (previewKilled) return;
    previewKilled = true;
    try {
      // Em Windows, preview e spawn-ed via shell — matar arvore inteira
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", preview.pid, "/f", "/t"], { stdio: "ignore" });
      } else {
        preview.kill("SIGTERM");
      }
    } catch {
      /* melhor esforco */
    }
  };

  process.on("exit", killPreview);
  process.on("SIGINT", () => {
    killPreview();
    process.exit(130);
  });

  try {
    const ready = await waitForPreview(PREVIEW_URL);
    if (!ready) {
      console.warn("⚠️  vite preview nao respondeu em 30s — pulando prerender");
      return;
    }

    let browser;
    try {
      browser = await chromium.launch({ headless: true });
    } catch (err) {
      console.warn(
        "⚠️  chromium nao pode ser iniciado — pulando prerender.",
        "   Rode `npx playwright install chromium`.",
        `   Erro: ${err.message}`
      );
      return;
    }

    const context = await browser.newContext({
      // Viewport grande para renderizar conteudo desktop (SEO/share preview)
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    let successCount = 0;
    for (const route of routes) {
      try {
        await page.goto(`${PREVIEW_URL}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });
        // Aguarda React hidratar e Helmet aplicar meta tags
        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(300);

        const rawHtml = await page.content();
        const html = dedupAll(rawHtml);

        // Normaliza caminho do arquivo de saida:
        //   /           -> dist/index.html
        //   /cases      -> dist/cases/index.html
        //   /servicos/x -> dist/servicos/x/index.html
        const outPath =
          route === "/"
            ? path.join(DIST_DIR, "index.html")
            : path.join(DIST_DIR, route.slice(1), "index.html");

        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, html, "utf8");

        const sizeKB = (Buffer.byteLength(html) / 1024).toFixed(1);
        console.log(`   ✓ ${route.padEnd(48)} -> ${sizeKB} KB`);
        successCount++;
      } catch (err) {
        console.error(`   ✗ ${route}: ${err.message}`);
      }
    }

    await browser.close();
    console.log(`\n✅ Pre-render concluido: ${successCount}/${routes.length} rotas\n`);
  } finally {
    killPreview();
    // Pequeno delay para garantir que a porta e liberada
    await sleep(500);
  }
}

prerender().catch((err) => {
  console.error("❌ Pre-render falhou:", err.message);
  // Nao bloqueia o build — sai com 0 para deploy continuar mesmo sem pre-render
  process.exit(0);
});
