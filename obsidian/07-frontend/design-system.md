---
title: Design System
tags: [frontend, design-system, ui]
---

# Design System

## Contexto

Decisão fundadora: **sem libs UI de terceiros** (ver [[../12-decisions/ADR-001-no-third-party-ui]]). Tudo vive em `src/design-system/`. Tokens em CSS custom properties (HSL sem wrapper). Componentes via CVA + `cn()`.

## Inventário

### Componentes (6)

| Componente                                             | Variantes (CVA)                                                                                                   | Notas                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `Button`                                               | `default, accent, secondary, outline, ghost, link, gradient, hero_outline, destructive` × `sm, default, lg, icon` | min-h 44px (WCAG); estados `loading`, `success` |
| `Card` (+ Header, Footer, Title, Description, Content) | flat                                                                                                              | wrapper de border-radius + shadow               |
| `Input`, `Textarea`                                    | flat                                                                                                              | unified styling com erro                        |
| `AlertDialog`                                          | `default, destructive`                                                                                            | confirmação modal                               |
| `HexAvatar`                                            | size mapping (xs..xl)                                                                                             | hex clip + initials fallback                    |
| `HexPattern`                                           | —                                                                                                                 | decorativo SVG                                  |

### Primitives (4)

`Container`, `Section`, `Stack`, `Grid` em `src/design-system/primitives/`. Padronizam max-width, gap, py responsivo.

### Form (3)

`Field`, `Label`, `ErrorText` — semantic helpers em `src/design-system/form/`.

### Util

`cn()` — `clsx + tailwind-merge`.

## Tokens

`src/styles/_tokens.scss` — CSS custom props prefixadas `--elk-`. Light/dark via `.dark` class.

| Categoria  | Exemplos                                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cores      | `--elk-primary` (261° 54% 33%), `--elk-secondary` (223° 48%), `--elk-accent` (180° 75%), `--elk-destructive`, `--elk-success`, `--elk-warning`, `--elk-muted`, `--elk-card`, `--elk-popover` |
| Tipografia | 9 sizes (xs..5xl), 4 line-heights, letter-spacing                                                                                                                                            |
| Radius     | xs..3xl + full                                                                                                                                                                               |
| Shadow     | sm/md/lg/xl + primary/elegant/glow/card-hover                                                                                                                                                |
| Animação   | fade-in, slide-up, float, diamond-rotate, hex-spin, card-pulse                                                                                                                               |

`tailwind.config.ts` consome via `hsl(var(--elk-...))`.

## Convenções (DESIGN-SYSTEM.md §14, audit 2026-04-22)

- **KPI grids**: `gap-3 sm:gap-4 xl:grid-cols-3`.
- **StatusBadge**: usar `<StatusBadge>` (importa metas centrais, ex: `TICKET_STATUS_META`); proibido criar mapping ad-hoc.
- **Botões**: `<Button>` sempre; nunca `<button>` com classes do Tailwind cru.
- **Inputs**: `<Input>` + `<Field>` + `<ErrorText>`; nunca `<input>`.
- **Sombras**: tokens, não classes Tailwind cruas (`shadow-md` desencorajado).
- **Bordas**: `border-border/70` padrão; `/40, /60, /80` apenas para hierarquia explícita.

## Problemas Identificados (auditoria 2026-04-23)

🔴 **`Tasks.tsx`** — 8+ cores Tailwind cruas hardcoded (`bg-blue-500`, `bg-emerald-500`, etc.) em CATEGORIES/PRIORITIES. Ver [[../13-issues/colors-hardcoded-tasks]].

🟠 **10 arquivos admin com `<input>`/`<button>` HTML cru** — ChangePassword, Tasks, ProposalDetail, ProjectCreate, Leads, ClientCreate, ProjectDetail, LeadDetail, ClientDetail, BillingAutomation. Ver [[../13-issues/inputs-html-crus-admin]].

🟠 **`BillingAutomation.tsx:346,501`** — `border-primary/30` viola DS (bordas não devem usar `border-primary`). Corrigir para `border-border/70`.

🟠 **Padding de Card inconsistente** (p-3 vs p-4 vs p-5) — consolidar em `p-4 sm:p-5 lg:p-6`.

🟠 **`bg-card/92` vs `bg-card/95` vs `bg-card`** — variações sem critério.

🟢 **Hero stats com `text-[hsl(180,75%,60%)]` cru** — usar `text-accent`. Ver [[../13-issues/hero-cores-hardcoded]].

🟢 **Eyebrow `text-[10px]` em ProposalView** — padrão é `text-[11px]`. Quebra ritmo.

## Recomendações

1. **Lint customizado**: regra ESLint que proíbe `text-blue-`, `bg-emerald-`, etc. fora de `_tokens.scss` — auto-aplicada em `lint-staged`.
2. **Codemod** para migrar `<button>` cru → `<Button>` em admin (10 arquivos).
3. Tokens novos: `--elk-task-category-*` para CATEGORIES de Tasks.tsx.
4. **CVA-ify StatusBadge** — variante por `tone` (primary, success, warning, destructive).
5. Padronizar a regra de `p-` em `<Card>` no próprio componente (default class).

## Relações

- [[../12-decisions/ADR-001-no-third-party-ui]]
- [[components-tree]]
- [[../13-issues/colors-hardcoded-tasks]]
- [[../13-issues/inputs-html-crus-admin]]
- [[../13-issues/dark-mode-contrast]]

## Referências

- `src/design-system/`
- `src/styles/_tokens.scss`
- `tailwind.config.ts`
- `docs/DESIGN-SYSTEM.md` §14
- `docs/AUDIT-2026-04-23.md` §1
