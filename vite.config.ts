import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
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
          manualChunks: (id) => {
            // Vendor chunks - separate large libraries for better caching
            if (id.includes("node_modules")) {
              // React core - most critical, loaded first
              if (id.includes("react") || id.includes("react-dom")) {
                return "react-core";
              }
              // React Router - needed for navigation
              if (id.includes("react-router")) {
                return "react-router";
              }
              // Form libraries - only loaded when form components are used
              if (
                id.includes("react-hook-form") ||
                id.includes("zod") ||
                id.includes("@hookform")
              ) {
                return "form-vendor";
              }
              // Radix UI components - loaded lazily
              if (id.includes("@radix-ui")) {
                return "ui-vendor";
              }
              // Lucide icons - separate chunk for icons
              if (id.includes("lucide-react")) {
                return "icons";
              }
              // Other node_modules go into vendor chunk
              return "vendor";
            }
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
