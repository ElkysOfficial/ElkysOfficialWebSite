import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";
import fs from "fs";
import { createHtmlPlugin } from "vite-plugin-html";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * Plugin unificado pos-build: CSS-split (landing vs portal) + modulepreload
 * hints criticos antes do <style> inline.
 *
 * Combinado num unico closeBundle para garantir execucao sequencial: antes
 * eram 2 plugins com enforce:"post" — Rollup roda closeBundle em paralelo
 * entre plugins por padrao, entao o modulePreloadHints as vezes executava
 * ANTES do landingCssSplit injetar o <style>, e os hints acabavam posicionados
 * em fallback (antes do <script entry>) em vez de antes do <style>.
 *
 * O que este plugin faz, em ordem:
 * 1. PURGECSS — roda contra os chunks JS que carregam na landing,
 *    gera um subset da folha de estilo completa. O portal carrega o CSS
 *    completo sob demanda via PortalShell (window.__ELKYS_FULL_CSS__).
 * 2. SUBSTITUI <link rel=stylesheet> por <style>CSS purgado</style> + script
 *    injetado com o path do CSS completo.
 * 3a. INJETA <link rel=modulepreload fetchpriority=high> pros chunks
 *     auxiliares (react-vendor, query-vendor) ANTES do <style> inline.
 *     Browser descobre esses imports enquanto ainda tokeniza o CSS.
 * 3b. INLINE do entry JS no proprio HTML. Elimina o round-trip
 *     "HTML -> entry.js" reportado pelo PSI como "Evite encadear
 *     solicitacoes criticas". Com o entry ja no HTML, o browser comeca
 *     a executar o bootstrap do React assim que termina de parsear o
 *     <script type=module>. Imports do entry (react-vendor, etc) sao
 *     carregados via os modulepreload hints de 3a.
 *
 * Porque CSS continua blocking: tentativa anterior de extrair "critical CSS"
 * e tornar o restante async causou render delay de ~2s no LCP — utilities
 * Tailwind nao entravam no inline e o H1 do Hero so recebia estilo final
 * quando o stylesheet async chegava. Manter o CSS inline + hints antes dele
 * da o melhor custo/beneficio observado.
 */
function landingCssAndPreloads(): Plugin {
  return {
    name: "vite-plugin-landing-css-and-preloads",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      const distPath = path.resolve(__dirname, "dist");
      const htmlPath = path.join(distPath, "index.html");
      const assetsDir = path.join(distPath, "assets");
      if (!fs.existsSync(htmlPath) || !fs.existsSync(assetsDir)) return;

      let html = fs.readFileSync(htmlPath, "utf-8");
      const linkMatch = html.match(
        /<link[^>]+rel="stylesheet"[^>]+href="(\/assets\/([^"]+\.css))"[^>]*>/
      );
      if (!linkMatch) return;

      const cssRelPath = linkMatch[1];
      const cssFileName = linkMatch[2];
      const cssAbsPath = path.join(distPath, cssRelPath);
      if (!fs.existsSync(cssAbsPath)) return;

      const fullCss = fs.readFileSync(cssAbsPath, "utf-8");

      // Positive list de chunks que carregam na landing path. Tudo que nao
      // bate aqui e considerado portal — nao entra na escaneada do PurgeCSS.
      const landingChunkPatterns: RegExp[] = [
        /^index-/, // entry chunk
        /^Index-/, // landing page (pages/Index.tsx)
        /^Cases-/,
        /^ServiceDetail-/,
        /^ComoTrabalhamos-/,
        /^TermsOfService-/,
        /^PrivacyPolicy-/,
        /^CookiePolicy-/,
        /^NotFound-/,
        /^Footer-/,
        /^ClientsCarousel-/,
        /^ContactForm-/,
        /^Contact-/,
        /^ContactLinks-/,
        /^Hero-/,
        /^Navigation-/,
        /^About-/,
        /^Services-/,
        /^Testimonials-/,
        /^SEO-/,
        /^RootErrorBoundary-/,
        /^ScrollToTop-/,
        /^CookieConsent-/,
        /^react-vendor-/,
        /^query-vendor-/,
        /^form-vendor-/,
      ];

      const landingChunks = fs
        .readdirSync(assetsDir)
        .filter((f) => f.endsWith(".js") && landingChunkPatterns.some((p) => p.test(f)))
        .map((f) => path.join(assetsDir, f));

      if (landingChunks.length === 0) {
        console.log("⚠️  No landing chunks found — falling back to full CSS inline");
        return;
      }

      // PurgeCSS programatico
      const { PurgeCSS } = await import("purgecss");
      const result = await new PurgeCSS().purge({
        content: landingChunks.map((f) => ({ raw: fs.readFileSync(f, "utf-8"), extension: "js" })),
        css: [{ raw: fullCss }],
        // Safelist pra classes que podem ser geradas dinamicamente (cn()/cva())
        // ou estados Tailwind que PurgeCSS as vezes nao extrai bem do JS minificado
        safelist: {
          standard: ["dark", "light", /^elk-/, /^gradient-/],
          deep: [
            /^animate-/,
            /^hover:/,
            /^focus:/,
            /^focus-visible:/,
            /^active:/,
            /^disabled:/,
            /^group-hover:/,
            /^group-focus:/,
            /^peer-/,
            /^dark:/,
            /^motion-safe:/,
            /^motion-reduce:/,
            /^data-\[/,
            /^aria-\[/,
          ],
          greedy: [/^sm:/, /^md:/, /^lg:/, /^xl:/, /^2xl:/, /^xs:/],
        },
        defaultExtractor: (content) => content.match(/[\w\-:/[\]().%]+/g) || [],
      });

      const purgedCss = result[0]?.css || fullCss;

      // Passo 2: substitui <link rel=stylesheet> por <style> inline +
      // script com path do CSS completo pra PortalShell consumir.
      const cssPathScript = `<script>window.__ELKYS_FULL_CSS__=${JSON.stringify(cssRelPath)}</script>`;
      html = html.replace(linkMatch[0], `<style>${purgedCss}</style>${cssPathScript}`);

      // Passo 3a: encontra o <script type=module> do entry pra usar tanto
      // no inline (passo 3c) como no modulepreload hint (passo 3b) dos
      // vendors auxiliares.
      const entryTagMatch = html.match(
        /<script\s+type="module"\s+crossorigin\s+src="(\/assets\/[^"]+\.js)"><\/script>/
      );

      if (entryTagMatch) {
        // Passo 3b: modulepreload hints ANTES do <style> inline pros chunks
        // auxiliares (react-vendor, query-vendor). O entry em si NAO precisa
        // de hint porque sera inlinado no passo 3c. Browser encontra o JS
        // dos vendors enquanto ainda parseia o <style>.
        const files = fs.readdirSync(assetsDir);
        const hints: string[] = [];
        const auxPatterns: RegExp[] = [
          /^react-vendor-[A-Za-z0-9_-]+\.js$/,
          /^query-vendor-[A-Za-z0-9_-]+\.js$/,
        ];
        for (const pattern of auxPatterns) {
          const chunk = files.find((f) => f.endsWith(".js") && pattern.test(f));
          if (chunk) {
            hints.push(
              `<link rel="modulepreload" crossorigin fetchpriority="high" href="/assets/${chunk}">`
            );
          }
        }
        const styleIdx = html.indexOf("<style>");
        if (styleIdx !== -1 && hints.length > 0) {
          html = html.slice(0, styleIdx) + hints.join("") + html.slice(styleIdx);
        }

        // Passo 3c: inline o entry.js no HTML pra eliminar o round-trip
        // HTML -> entry.js que o PSI reportava como "Evite encadear
        // solicitacoes criticas" (cadeia 798ms + 655ms do entry). Entry
        // tem ~27KB gzip — absorvido no HTML, fica ~42KB gzip mas baixa
        // tudo num unico request. Imports do entry (react-vendor etc)
        // continuam como chunks separados cacheaveis, apontados pelos
        // modulepreload hints acima. Apos inline, o arquivo original
        // vira orfao (nada aponta pra ele) — apago do dist pra nao
        // confundir deploy/auditoria de assets.
        const entryRelPath = entryTagMatch[1];
        const entryAbsPath = path.join(distPath, entryRelPath);
        if (fs.existsSync(entryAbsPath)) {
          const entryJs = fs.readFileSync(entryAbsPath, "utf-8");
          const inlineTag = `<script type="module" crossorigin>${entryJs}</script>`;
          html = html.replace(entryTagMatch[0], inlineTag);
          fs.unlinkSync(entryAbsPath);
        }
      }

      fs.writeFileSync(htmlPath, html);

      const fullKb = (Buffer.byteLength(fullCss) / 1024).toFixed(1);
      const purgedKb = (Buffer.byteLength(purgedCss) / 1024).toFixed(1);
      console.log(
        `✅ CSS split: landing inline ${purgedKb}KB (era ${fullKb}KB full). Portal CSS continua em ${cssFileName} (lazy via PortalShell).`
      );
      console.log(
        `✅ Entry JS inlinado no HTML + modulepreload hints pros vendors (react-vendor, query-vendor) ANTES do <style> inline.`
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isMinified = process.env.MINIFY === "true";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
          svgoConfig: {
            plugins: [
              { name: "removeViewBox" } as { name: string },
              { name: "removeDimensions" } as { name: string },
              {
                name: "prefixIds",
                params: { prefixClassNames: false },
              },
            ],
          },
          replaceAttrValues: {
            "#000": "currentColor",
            "#000000": "currentColor",
          },
        },
      }),
      isMinified &&
        createHtmlPlugin({
          minify: {
            collapseWhitespace: true,
            keepClosingSlash: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
          },
        }),
      visualizer({
        filename: "./dist/stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
      // Plugin unificado: PurgeCSS + inline <style> + modulepreload hints
      // ANTES do <style>. Tudo num unico closeBundle pra garantir ordem
      // (Rollup nao garante sequencia entre plugins "post" distintos).
      landingCssAndPreloads(),
    ].filter(Boolean),
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // sourcemap em producao fica off para nao expor codigo; pode ser ligado
      // ad-hoc com VITE_SOURCEMAP=true para debugar stack trace de erro real
      // (ex: investigar bugs vindos de libs minificadas como recharts).
      sourcemap: process.env.VITE_SOURCEMAP === "true",
      minify: isMinified ? "terser" : "esbuild",
      cssMinify: true,
      // Com manualChunks definido, Vite por padrao gera <link modulepreload>
      // para TODOS os vendor chunks no entry HTML. Isso forca a landing a
      // baixar recharts-vendor (362 KB / 108 KB gzip) mesmo nunca usando
      // charts. Filtrar manualmente o que nao e necessario no first paint
      // da landing: recharts e supabase-vendor so aparecem em rotas
      // autenticadas (React.lazy cuida do carregamento on-demand).
      modulePreload: {
        resolveDependencies: (_filename, deps) => {
          return deps.filter(
            (dep) => !dep.includes("recharts-vendor") && !dep.includes("supabase-vendor")
          );
        },
      },
      rollupOptions: {
        output: {
          // Funcao (em vez de objeto) pra isolar SOMENTE o pacote principal em
          // cada chunk. O formato objeto causava leak de deps compartilhadas:
          // "recharts-vendor":["recharts"] fazia o Rollup puxar tb "clsx"
          // (dep transitiva do recharts + usado pelo nosso cn()) pra dentro
          // do recharts-vendor. Como o main bundle importa clsx via cn(),
          // ele acabava fazendo `import from "./recharts-vendor-*.js"` em
          // TODA carga da landing, baixando 98 KB de biblioteca de graficos
          // sem nunca renderizar um grafico. Filtrando por path do node_modules
          // cada vendor chunk contem SO o pacote target; deps transitivas ficam
          // com quem as usa (ou num chunk comum gerado automaticamente).
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("/node_modules/recharts/")) return "recharts-vendor";
            if (id.includes("/node_modules/@supabase/supabase-js/")) return "supabase-vendor";
            if (id.includes("/node_modules/@tanstack/react-query/")) return "query-vendor";
            if (
              id.includes("/node_modules/react-hook-form/") ||
              id.includes("/node_modules/@hookform/") ||
              id.includes("/node_modules/zod/")
            )
              return "form-vendor";
            // clsx + tailwind-merge sao usados por recharts E pelo nosso cn().
            // Se deixar o Rollup decidir, ele posiciona esses 2 deps dentro
            // do recharts-vendor; ai o main bundle faz `import from "./recharts-vendor-*"`
            // so pra pegar o clsx, e a landing baixa 100 KB de libs de grafico
            // sem usar nenhum grafico. Fixando em react-vendor (sempre carregado)
            // o recharts-vendor nao precisa ser referenciado fora das rotas admin.
            if (id.includes("/node_modules/clsx/") || id.includes("/node_modules/tailwind-merge/"))
              return "react-vendor";
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/react-router-dom/") ||
              id.includes("/node_modules/react-router/") ||
              id.includes("/node_modules/scheduler/")
            )
              return "react-vendor";
          },
        },
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      terserOptions: isMinified
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ["console.log", "console.info", "console.debug", "console.trace"],
              passes: 2,
              arrows: true,
              dead_code: true,
              unused: true,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          }
        : undefined,
    },
  };
});
