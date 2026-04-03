import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";
import { createHtmlPlugin } from "vite-plugin-html";
import { visualizer } from "rollup-plugin-visualizer";

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
    ].filter(Boolean),
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: false,
      minify: isMinified ? "terser" : "esbuild",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
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
