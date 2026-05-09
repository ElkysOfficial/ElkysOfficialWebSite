---
title: Frontend — MOC
tags: [frontend, moc]
---

# Frontend — MOC

## Notas

- [[routing]] — rotas, guards, lazy loading
- [[design-system]] — Button, Card, primitives, tokens
- [[hooks]] — 15 hooks customizados (useAdminProjects, useUrlState, useFormDraftAutoSave, etc.)
- [[components-tree]] — inventário por domínio
- [[admin-pages]] — 27 páginas admin
- [[client-pages]] — 10 páginas cliente
- [[public-pages]] — landing + legal
- [[auth-guards]] — ProtectedRoute, PortalRoleGuard, etc.
- [[state-strategy]] — Context só para Auth; React Query para tudo
- [[forms]] — react-hook-form + zod + Field/Label/ErrorText
- [[icons]] — SVGR + factory pattern
- [[seo-prerender]] — `SEO.tsx` + script de prerender

## Pilares

1. **React 18 + TypeScript strict** — `tsconfig.json` em modo estrito.
2. **Vite 7 com SWC** — HMR rapidíssimo.
3. **Tailwind 3.4 + tokens HSL** — CSS custom properties, não Tailwind theme.
4. **Lazy load em todas as páginas** (exceto `Index.tsx` para LCP).
5. **Sem bibliotecas UI** — design system 100% próprio (ver [[../12-decisions/ADR-001-no-third-party-ui]]).
6. **TanStack Query** para todo data-fetching.
7. **Sem state library global** — apenas Context para Auth.
