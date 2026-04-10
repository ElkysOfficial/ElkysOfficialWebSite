# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

There is no test runner configured. Linting runs automatically via lint-staged + husky on pre-commit.

## Architecture

### Three-zone routing (`src/App.tsx`)

All page components use `React.lazy()` + `Suspense`. Routes are guarded by a chain:
`ProtectedRoute` → `MustChangePasswordGuard` → `PortalRoleGuard` → Layout

- **Public site** (`/`, `/cases`, `/servicos/:slug`, `/como-trabalhamos`, legal pages)
- **Admin portal** (`/portal/admin/*`) — roles: `admin_super`, `admin`, `marketing`, `developer`, `support`
- **Client portal** (`/portal/cliente/*`) — role: `cliente`

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
- `Database.md` — schema documentation
- `EDGE-Functions.md` — edge function specs
- `Permissions.md` — RBAC role matrix
