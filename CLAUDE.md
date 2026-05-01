# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🧠 Brain (Obsidian Vault) — leia ANTES de outras fontes

Há um **second brain** estruturado em `obsidian/` que é a fonte canônica de:

- diagnóstico técnico (HIGH/MEDIUM/LOW issues)
- ADRs (decisões arquiteturais e por quê)
- mapeamento domínio↔código com `arquivo:linha`
- roadmap (ondas 1/2/3) com link para os issues
- glossário de termos do produto

### Regras de leitura (economia de tokens)

NÃO leia o vault inteiro. Use estas portas de entrada conforme o tópico:

| Tarefa do usuário                               | Leia primeiro                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| Pergunta genérica sobre o projeto               | `obsidian/00-index/brain.md`                                               |
| Bug, débito técnico, "o que tem de errado em X" | `obsidian/13-issues/index.md`                                              |
| Roadmap, "o que falta", priorização             | `obsidian/14-roadmap/index.md`                                             |
| Mexer em auth/permissões                        | `obsidian/04-flows/auth-flow.md` + `obsidian/10-security/rls-model.md`     |
| Mexer em cobrança/financeiro                    | `obsidian/02-domains/charges.md` + `obsidian/03-features/billing-rules.md` |
| Decisão arquitetural ("por que assim?")         | `obsidian/12-decisions/index.md`                                           |
| Termo do domínio que não conhece                | `obsidian/15-glossary/index.md`                                            |
| Dúvida sobre rota/página                        | `obsidian/07-frontend/routing.md`                                          |
| Schema/tabela                                   | `obsidian/05-database/erd.md` ou `docs/DATABASE.md`                        |

Cada nota linka para outras via `[[wikilinks]]` — siga só o que for relevante.

### Regras de atualização (manter vivo)

Após mudanças significativas no código, **proponha** (não execute silenciosamente) atualizações em:

- **Issue resolvido** → mover nota de `obsidian/13-issues/<file>.md` para `obsidian/13-issues/_resolved/` e atualizar `index.md`.
- **Decisão arquitetural nova** → criar `obsidian/12-decisions/ADR-<NN>-<slug>.md` e linkar em `12-decisions/index.md`.
- **Novo domínio/tabela/fluxo/feature** → criar nota correspondente e linkar nos MOCs.
- **Mudança de rota, schema ou edge function** → atualizar nota afetada (procure por wikilinks que apontam pra ela).
- **Hipótese marcada `⚠️ Assumido`** que você confirmou no código → remover o marcador e atualizar.

Sempre cite `arquivo:linha` ao referenciar código. Sempre que possível, use `[[wikilinks]]` em vez de citar caminho cru.

Para sincronização ampla pós-sprint, use a skill `/update-brain` (ver `.claude/skills/update-brain/`).

### Quando NÃO usar o brain

- Para descobrir "onde está X no código" (use Grep/Glob — mais rápido e atual).
- Para `git log` / `git blame` (use git diretamente).
- Para detalhe de schema atual (use `supabase/migrations/` ou `src/integrations/supabase/types.ts` — fonte da verdade).

O brain é **interpretação e diagnóstico**, não cópia da fonte.

---

## Project Overview

Elkys Software House platform — a React SPA with a public marketing site and two authenticated portals (Admin and Client). Static bundle deployed to Hostinger via FTP; backend is Supabase Cloud (Postgres + Auth + Edge Functions + Storage).

Production: https://elkys.com.br

## Commands

```bash
npm run dev          # Dev server on localhost:8080
npm run build        # Production build (esbuild) + sitemap + .htaccess
npm run build:min    # Production build with Terser (strips console.*)
npm run preview      # Preview production build locally
npm run format       # Prettier format src files
npm run format:check # Check formatting without writing
```

Linting runs automatically via lint-staged + husky on pre-commit.

### E2E tests (Playwright)

```bash
node e2e/setup-accounts.mjs   # Create test accounts (once)
npm run test:e2e               # Headless
npm run test:e2e:headed        # With browser
```

21 tests covering the full Lead→Expansion flow with 10 personas. See `e2e/README.md` and `docs/TESTING.md`.

## Architecture

### Three-zone routing (`src/App.tsx`)

All page components use `React.lazy()` + `Suspense`. Routes are guarded by a chain:
`ProtectedRoute` → `MustChangePasswordGuard` → `PortalRoleGuard` → Layout

- **Public site** (`/`, `/cases`, `/servicos/:slug`, `/como-trabalhamos`, legal pages)
- **Admin portal** (`/portal/admin/*`) — roles: `admin_super`, `admin`, `comercial`, `juridico`, `financeiro`, `po`, `developer`, `designer`, `marketing`, `support`
- **Client portal** (`/portal/cliente/*`) — role: `cliente`

### Portal components (`src/components/portal/`)

Organized by domain:

```
portal/admin/        — AdminLayout, AdminEmptyState, AdminMetricCard, etc.
portal/client/       — ClientLayout, ClientRowIndicators
portal/auth/         — ProtectedRoute, PortalRoleGuard, MustChangePassword*
portal/project/      — AcceptanceCard, OnboardingChecklist, ValidationRounds, etc.
portal/contract/     — ActionsButtons, VersionHistory, AcceptanceStatusCard
portal/proposal/     — ExpiryCountdown, RejectModal
portal/notification/ — NotificationBell
portal/shared/       — StatusBadge, Pagination, PortalLoading, ExportMenu, etc.
```

### Auth (`src/contexts/AuthContext.tsx`)

Supabase email/password auth. Roles live in the `user_roles` DB table (not JWT claims). Session has a 30-min inactivity timeout with a 2-min warning. First-access users are forced to change password before entering the portal.

### Data layer

- **Supabase client**: `src/integrations/supabase/client.ts` (auto-generated types in `types.ts`)
- **Data helpers**: `src/lib/portal-data.ts` — async functions (`loadProjectsForClient`, `loadChargesForClient`, etc.) returning `{ data, error }`
- **Server state**: TanStack React Query v5 — used for all portal data fetching/caching
- **No client state library** — only React Context (AuthContext) for session

### Design system (`src/design-system/`)

100% custom — no shadcn, Radix, MUI, or Chakra. Built with CVA + `cn()` (clsx + tailwind-merge).

- `components/` — Button, Card, Input, Textarea, AlertDialog, HexAvatar
- `primitives/` — Container, Section, Stack, Grid
- `form/` — Label, Field, ErrorText
- `utils/cn.ts` — class merging utility

Colors use CSS custom properties in HSL format (without the `hsl()` wrapper in the variable value). Dark mode via `next-themes` with `class` strategy.

### Edge Functions (`supabase/functions/`)

Deno serverless functions for user management, email notifications, and billing. JWT verification is disabled in config — functions handle auth internally.

### Path alias

`@` maps to `./src` (configured in both vite.config.ts and tsconfig).

## Key Conventions

- **Padronização DS (auditoria 2026-04-22)**: Ver `docs/DESIGN-SYSTEM.md` §14 para regras canônicas de grids, StatusBadge, autosave, botões e sombras. Consultar antes de abrir PR nesses eixos.
- **Backlog de inconsistências e QOL (2026-04-23)**: `docs/AUDIT-2026-04-23.md` lista achados file:linha (portal admin/cliente/marketing/forms) e melhorias de QOL priorizadas em 3 ondas. Usar como fonte de PRs incrementais.
- **Styling**: Tailwind CSS with design-system tokens (CSS variables). Never hardcode slate/gray/blue colors — use DS tokens (`text-foreground`, `bg-muted`, `text-primary`, etc.).
- **Hero dark mode**: Uses Tailwind slate classes (`dark:from-slate-900` etc.) — do NOT change these.
- **Section spacing**: `py-16 md:py-20 lg:py-24` for all page sections.
- **Touch targets**: Minimum 44px height for interactive elements (WCAG).
- **Forms**: react-hook-form + zod for validation.
- **Toasts**: sonner library.
- **SVG icons**: Imported as React components via SVGR plugin (`src/assets/icons/`).
- **Fonts**: Self-hosted Poppins (4 weights). No Google Fonts CDN.
- **Language**: UI text and docs are in Brazilian Portuguese.

## Deployment

- **Production**: Push to `main` triggers GitHub Actions → build → FTP deploy to Hostinger.
- **Development branch**: `develop`
- **Node version**: 20

## Documentation

See `docs/` for detailed specs:

- `ARCHITECTURE.md` — full technical architecture (in Portuguese)
- `DATABASE.md` — schema documentation
- `EDGE-FUNCTIONS.md` — edge function specs
- `PERMISSIONS.md` — RBAC role matrix
- `DESIGN-SYSTEM.md` — design system tokens, components and patterns
- `ROADMAP.md` — admin dashboard roadmap
- `TESTING.md` — E2E testing guide
