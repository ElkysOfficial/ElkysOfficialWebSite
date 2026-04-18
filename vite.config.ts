import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";
import fs from "fs";
import { createHtmlPlugin } from "vite-plugin-html";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * Extracts critical CSS (custom properties, @font-face, base resets, keyframes)
 * and inlines it in the HTML. Converts the <link> to async preload so it no
 * longer blocks rendering (~360 ms saving).
 */
function criticalCss(): Plugin {
  return {
    name: "vite-plugin-critical-css",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      const distPath = path.resolve(__dirname, "dist");
      const htmlPath = path.join(distPath, "index.html");
      if (!fs.existsSync(htmlPath)) return;

      const html = fs.readFileSync(htmlPath, "utf-8");

      // Find the CSS link tag and its href
      const linkMatch = html.match(
        /<link\s+[^>]*href="(\/assets\/[^"]+\.css)"[^>]*rel="stylesheet"[^>]*>/
      );
      if (!linkMatch) {
        // Try alternate attribute order
        const altMatch = html.match(
          /<link\s+[^>]*rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/
        );
        if (!altMatch) {
          console.log("⚠️  No CSS link found — skipping critical CSS extraction");
          return;
        }
        return processLink(distPath, htmlPath, html, altMatch[0], altMatch[1]);
      }
      return processLink(distPath, htmlPath, html, linkMatch[0], linkMatch[1]);
    },
  };
}

function processLink(
  distPath: string,
  htmlPath: string,
  html: string,
  linkTag: string,
  cssHref: string
) {
  const cssPath = path.join(distPath, cssHref);
  if (!fs.existsSync(cssPath)) return;

  const css = fs.readFileSync(cssPath, "utf-8");

  // Extract critical blocks: :root / .dark vars, @font-face, @keyframes,
  // *, html, body, #root selectors, and @layer base blocks
  const criticalPatterns = [
    // :root and .dark custom property blocks
    /(?::root|\.dark)\s*\{[^}]*\}/g,
    // @font-face declarations
    /@font-face\s*\{[^}]*\}/g,
    // @keyframes blocks
    /@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g,
    // Universal, html, body, #root base selectors (single-level only)
    /(?:^|[,}])\s*(?:\*|html|body|#root)(?:\s*,\s*(?:\*|html|body|#root))*\s*\{[^}]*\}/g,
  ];

  const criticalRules: string[] = [];
  for (const pattern of criticalPatterns) {
    const matches = css.matchAll(pattern);
    for (const m of matches) {
      criticalRules.push(m[0].trim());
    }
  }

  if (criticalRules.length === 0) {
    console.log("⚠️  No critical CSS rules found — skipping");
    return;
  }

  const inlineStyle = `<style>${criticalRules.join("")}</style>`;

  // Convert blocking <link rel="stylesheet"> to async preload with swap fallback
  const asyncLink =
    `<link rel="preload" href="${cssHref}" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
    `<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`;

  let result = html.replace(linkTag, inlineStyle + asyncLink);

  // Add modulepreload for the entry-point JS to start downloading in parallel
  // com o parsing do HTML, quebrando a cadeia critica de requests. fetchpriority=high
  // promove o script acima das imagens decorativas e Google Analytics no
  // agendamento de rede do browser, reduzindo o render delay do LCP.
  const entryMatch = result.match(
    /<script\s+type="module"\s+crossorigin\s+src="(\/assets\/[^"]+\.js)">/
  );
  if (entryMatch) {
    const preloadTag = `<link rel="modulepreload" crossorigin fetchpriority="high" href="${entryMatch[1]}">`;
    // Insert before the script tag itself
    result = result.replace(entryMatch[0], preloadTag + entryMatch[0]);
  }

  // Preload do primeiro chunk lazy da landing (Index-*.js). Sem isso, ele so
  // comeca a baixar apos o entry parsear e executar import() — adicionando
  // uma round-trip inteira entre o parse do JS principal e o render do Hero.
  const assetsDir = path.join(distPath, "assets");
  if (fs.existsSync(assetsDir)) {
    const indexChunk = fs.readdirSync(assetsDir).find((f) => /^Index-[A-Za-z0-9_-]+\.js$/.test(f));
    if (indexChunk) {
      const indexPreload = `<link rel="modulepreload" crossorigin fetchpriority="high" href="/assets/${indexChunk}">`;
      result = result.replace(entryMatch![0], indexPreload + entryMatch![0]);
    }
  }

  fs.writeFileSync(htmlPath, result);

  const inlineKB = (Buffer.byteLength(inlineStyle) / 1024).toFixed(1);
  console.log(`✅ Critical CSS inlined (${inlineKB} KB) — full stylesheet deferred`);
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
      criticalCss(),
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
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
            "supabase-vendor": ["@supabase/supabase-js"],
            "query-vendor": ["@tanstack/react-query"],
            // recharts e usado em Overview e Finance do admin. Isolar em chunk
            // separado garante cache compartilhado entre as rotas admin e evita
            // duplicacao silenciosa no bundle conforme o tree-shaking do Rollup.
            "recharts-vendor": ["recharts"],
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
