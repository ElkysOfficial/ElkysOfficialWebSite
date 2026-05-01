---
title: Performance — MOC
tags: [performance, moc]
---

# Performance — MOC

## Notas

- [[build-pipeline]] — Vite + SWC + esbuild/Terser + post-build scripts
- [[bundle-strategy]] — manualChunks, entry inlining, modulepreload
- [[css-splitting]] — PurgeCSS landing × portal lazy
- [[prerender-seo]] — prerender.cjs + sitemap + meta
- [[image-optimization]] — sharp + WebP
- [[lazy-loading]] — React.lazy em todas as páginas (exceto Index)
- [[query-cache]] — TanStack staleTime matrix
- [[runtime-bottlenecks]] — over-fetching, refetchOnWindowFocus

## Highlights

| Otimização                                   | Impacto                     |
| -------------------------------------------- | --------------------------- |
| Entry chunk inlined no HTML                  | -1 RTT crítico (~27KB gzip) |
| `recharts-vendor` lazy + excluded da landing | -108KB gzip da landing      |
| PurgeCSS landing                             | ~42KB economizados          |
| Prerender de rotas públicas                  | LCP estável, SEO sólido     |
| Lazy-load de páginas                         | bundle inicial pequeno      |
| Sharp + WebP                                 | imagens 25-35% menores      |
| Index.tsx síncrono (não lazy)                | LCP do hero preservado      |

## Problemas críticos

🔴 **Sem Sentry/PostHog** — performance ruim em produção é invisível para o time.
🟠 **`refetchOnWindowFocus: true` global** — múltiplas tabs do portal recarregam tudo.
🟠 **Recharts ainda 108KB gzip** — usado em poucas páginas; vale auditar uso real.
🟢 **Sem CDN externo** (Hostinger only) — sem cache geográfico.
