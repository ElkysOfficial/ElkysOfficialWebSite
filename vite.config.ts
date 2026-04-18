import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";
import fs from "fs";
import { createHtmlPlugin } from "vite-plugin-html";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * Plugin pos-build minimo: SO injeta modulepreload com fetchpriority=high
 * pro entry chunk e pro Index-*.js (lazy chunk da landing). Quebra a cadeia
 * critica de requests sem mexer no <link rel="stylesheet"> — CSS continua
 * blocking (necessario pra LCP estilizado no primeiro paint; tentativa
 * anterior de extrair "critical CSS" e tornar o restante async causava
 * render delay de ~2s no LCP porque utilities Tailwind nao entravam no
 * inline e o H1 do Hero so recebia estilo final quando o stylesheet
 * async chegava).
 */
function modulePreloadHints(): Plugin {
  return {
    name: "vite-plugin-modulepreload-hints",
    apply: "build",
    enforce: "post",
    closeBundle() {
      const distPath = path.resolve(__dirname, "dist");
      const htmlPath = path.join(distPath, "index.html");
      if (!fs.existsSync(htmlPath)) return;

      let html = fs.readFileSync(htmlPath, "utf-8");
      const entryMatch = html.match(
        /<script\s+type="module"\s+crossorigin\s+src="(\/assets\/[^"]+\.js)">/
      );
      if (!entryMatch) return;

      const hints: string[] = [
        `<link rel="modulepreload" crossorigin fetchpriority="high" href="${entryMatch[1]}">`,
      ];

      const assetsDir = path.join(distPath, "assets");
      if (fs.existsSync(assetsDir)) {
        const indexChunk = fs
          .readdirSync(assetsDir)
          .find((f) => /^Index-[A-Za-z0-9_-]+\.js$/.test(f));
        if (indexChunk) {
          hints.push(
            `<link rel="modulepreload" crossorigin fetchpriority="high" href="/assets/${indexChunk}">`
          );
        }
      }

      html = html.replace(entryMatch[0], hints.join("") + entryMatch[0]);
      fs.writeFileSync(htmlPath, html);
    },
  };
}

/**
 * CSS split entre landing (inline no HTML) e portal (lazy via PortalShell).
 *
 * Problema anterior: inlinar o CSS completo (~90 KB raw) no HTML resolvia
 * o bloqueio de renderizacao mas deixava ~11 KB de utilities Tailwind
 * usadas SO pelo portal (Admin/Cliente/Login) inline na landing — PSI
 * reportava "Reduza CSS nao usado 11 KiB".
 *
 * Estrategia atual:
 * 1. Identifica chunks JS que rodam na landing (positive list por nome).
 * 2. Roda PurgeCSS programatico contra esses chunks pra extrair somente
 *    as regras CSS efetivamente referenciadas → landing.css subset.
 * 3. Inlina o subset no <style> do HTML.
 * 4. Mantem o CSS completo em /assets/index-*.css como arquivo fisico.
 * 5. Injeta um <script>window.__ELKYS_FULL_CSS__</script> com o path
 *    do CSS completo. PortalShell.tsx, ao montar, cria <link rel="stylesheet">
 *    apontando pra esse path — assim portal carrega o restante do CSS so
 *    quando o usuario entra em /login ou /portal/*.
 *
 * Safelist generoso pra cobrir classes geradas dinamicamente via cn()/cva()
 * que PurgeCSS pode nao detectar no JS minificado.
 */
function landingCssSplit(): Plugin {
  return {
    name: "vite-plugin-landing-css-split",
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

      // Injeta script com path do CSS completo pra PortalShell consumir
      const cssPathScript = `<script>window.__ELKYS_FULL_CSS__=${JSON.stringify(cssRelPath)}</script>`;
      html = html.replace(linkMatch[0], `<style>${purgedCss}</style>${cssPathScript}`);
      fs.writeFileSync(htmlPath, html);

      const fullKb = (Buffer.byteLength(fullCss) / 1024).toFixed(1);
      const purgedKb = (Buffer.byteLength(purgedCss) / 1024).toFixed(1);
      console.log(
        `✅ CSS split: landing inline ${purgedKb}KB (era ${fullKb}KB full). Portal CSS continua em ${cssFileName} (lazy via PortalShell).`
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
      modulePreloadHints(),
      landingCssSplit(),
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
