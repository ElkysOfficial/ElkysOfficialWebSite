---
title: ADR-009 — PurgeCSS para landing CSS-split
tags: [adr, performance]
status: accepted
---

# ADR-009 — PurgeCSS para landing CSS split + portal lazy

## Contexto

Tailwind 3 + design system gera CSS de ~200KB unminified. Landing pública precisa ser super-leve (LCP); portal pode pagar mais.

## Decisão

`vite.config.ts` usa **PurgeCSS** para isolar:

1. **CSS landing** — apenas classes referenciadas em `Index.tsx`, Hero, About, Services, Testimonials, Footer, Navigation, ContactForm. **Inlined no HTML** (~42KB economizados).
2. **CSS portal** — todo o resto. Lazy-loaded em runtime via `window.__ELKYS_FULL_CSS__` quando rota `/portal/*` é acessada.

## Alternativas

- CSS único, depender só do Tailwind purge — não dá para split em "cold path" depois do build.
- Tailwind v4 com layers — não estável quando decisão foi tomada.
- Style-extractor por componente (CSS-in-JS) — descartado por bundle e SSR-incompat.

## Consequências

### Positivas

- Landing entrega ~120KB total (HTML+CSS+JS) na primeira visita.
- Portal carrega CSS adicional só quando necessário.

### Negativas

- **PurgeCSS pode falsamente remover classes** — usadas por composição dinâmica (`bg-${color}-500`). Mitigado por safelist no config.
- **`window.__ELKYS_FULL_CSS__` é hack** — cleanest seria entry separado por bundle.

## Sinais de revisão

- Landing crescer em complexidade (tabela, filtros) que exija classes do "portal CSS".
- Migração para Tailwind v4 (layers).

## Relações

- [[../11-performance/build-pipeline]]
- [[../11-performance/css-splitting]]

## Referências

- `vite.config.ts` (PurgeCSS config + safelist)
