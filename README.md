<p align="center">
  <img src="public/imgs/icons/lettering_elkys_purple.webp" alt="Elkys" width="160" />
</p>

<h1 align="center">Elkys — Official Website</h1>

<p align="center">
  Institutional website and digital portfolio for <strong>Elkys Software House</strong>.<br />
  Custom software engineering for businesses that have outgrown off-the-shelf solutions.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React 18.3" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-472680" alt="MIT License" />
</p>

---

## About

This repository contains the source code for the official Elkys website — a high-performance, SEO-optimized, WCAG-accessible institutional site built with a fully authorial design system. No third-party UI kits (shadcn, Radix, MUI, Chakra) are used; every component is hand-crafted.

**Live:** [elkys.com.br](https://elkys.com.br)

---

## Tech Stack

### Core

| Technology           | Version | Purpose                                                                      |
| -------------------- | ------- | ---------------------------------------------------------------------------- |
| **React**            | 18.3.x  | UI framework with component-based architecture                               |
| **TypeScript**       | 5.x     | Static type checking across the entire codebase                              |
| **Vite**             | 7.x     | Build tool with SWC compiler for fast HMR and optimized production builds    |
| **Tailwind CSS**     | 3.4.x   | Utility-first CSS framework with custom design tokens                        |
| **SCSS** (Dart Sass) | —       | Design tokens, mixins, and layered architecture via `@use`/`meta.load-css()` |

### Design System

| Library                    | Purpose                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| `class-variance-authority` | Type-safe component variant definitions (Button, Card, etc.)            |
| `clsx` + `tailwind-merge`  | Conditional class concatenation with Tailwind conflict resolution       |
| `next-themes`              | Dark mode support with `class` strategy and system preference detection |
| `sonner`                   | Lightweight toast notification system                                   |
| `vite-plugin-svgr`         | SVG files imported as React components (tree-shakeable icon system)     |

### Forms & Data

| Library               | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `react-hook-form`     | Performant form state management with uncontrolled components |
| `zod`                 | Schema-based validation with TypeScript type inference        |
| `@hookform/resolvers` | Bridge between react-hook-form and zod schemas                |
| `@emailjs/browser`    | Client-side email delivery (contact form)                     |

### SEO & Routing

| Library              | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `react-router-dom`   | Client-side routing with code splitting                      |
| `react-helmet-async` | Dynamic meta tags, Open Graph, and structured data (JSON-LD) |

### Build & Quality

| Tool                           | Purpose                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| `eslint` + `typescript-eslint` | Static analysis and code quality enforcement                 |
| `prettier`                     | Opinionated code formatting                                  |
| `husky` + `lint-staged`        | Pre-commit hooks for automated linting and formatting        |
| `terser`                       | Advanced JavaScript minification (optional `build:min` mode) |
| `rollup-plugin-visualizer`     | Bundle size analysis and visualization                       |
| `sharp`                        | Image processing and optimization scripts                    |

---

## Architecture

```
src/
├── assets/icons/          # Proprietary SVGR icon system (35 icons)
│   ├── svg/               # Raw SVG source files
│   ├── create-icon.tsx    # Icon HOC with standardized a11y
│   └── index.ts           # Tree-shakeable named exports
├── styles/                # SCSS design tokens & utilities
│   ├── _tokens.scss       # CSS custom properties (:root + .dark)
│   ├── _base.scss         # Typography reset & base styles
│   ├── _mixins.scss       # Reusable SCSS mixins
│   ├── _components.scss   # Semantic CSS classes
│   └── _utilities.scss    # Gradients, shadows, animations
├── design-system/         # Authorial React component library
│   ├── components/        # Button, Card, Input, Textarea, Toast
│   ├── primitives/        # Container, Section, Stack, Grid
│   ├── form/              # Label, Field, ErrorText
│   └── utils/             # cn() — clsx + tailwind-merge
├── components/            # Business components (Hero, Nav, Footer...)
├── pages/                 # Route-level page components
├── config/                # Service configurations (EmailJS)
└── constants/             # Application constants
```

### Key Architectural Decisions

- **Tokens-first approach:** All colors, spacing, shadows, and radii defined as CSS custom properties in HSL format — consumed by Tailwind via `hsl(var(--token))`
- **Zero runtime icon bundle:** Icons are individual SVG files compiled at build time via SVGR, enabling full tree-shaking. Only icons actually imported end up in the bundle
- **SCSS module system:** Uses Dart Sass `@use`/`meta.load-css()` within `@layer` blocks — zero `@import` deprecation warnings
- **CVA pattern:** All component variants defined with `class-variance-authority` for type-safe, composable styling
- **Mobile-first responsive:** Custom breakpoint at `xs: 475px` added to Tailwind defaults for landscape smartphone support

---

## Engineering Practices

### Code Quality

- **TypeScript strict mode** across the entire codebase with path aliases (`@/*`)
- **ESLint** with `typescript-eslint` and React Hooks plugin for static analysis
- **Prettier** for consistent formatting (enforced via pre-commit hooks)
- **Husky + lint-staged** runs linting and formatting on every commit automatically

### Performance

- **Code splitting** via React Router lazy loading — each page is a separate chunk
- **Manual chunk strategy:** `react-vendor` and `form-vendor` extracted for optimal caching
- **Image optimization:** WebP format, responsive `srcSet`, lazy loading below the fold, `fetchpriority="high"` for hero assets
- **Font optimization:** Self-hosted Poppins (woff2, 4 weights) with `font-display: swap`
- **GPU-optimized animations:** `will-change-transform` only on animated elements, reduced durations on mobile, `prefers-reduced-motion` respected
- **Dual build modes:** `build` (esbuild, fast) and `build:min` (Terser 2-pass, console removal, aggressive minification)

### Accessibility (WCAG AA)

- Minimum 44x44px touch targets on all interactive elements
- Color contrast tested and verified for all color pairs
- `focus-visible` ring on all focusable elements
- `prefers-reduced-motion` media query disables all animations
- Semantic HTML (`<nav>`, `<main>`, `<section>`, `<h1-h6>`)
- ARIA attributes on interactive elements (`aria-label`, `aria-expanded`, `aria-current`)
- Icon system: decorative by default (`aria-hidden`), accessible when `title` prop is set

### SEO

- Server-rendered meta tags via `react-helmet-async`
- JSON-LD structured data (Organization, BreadcrumbList, CollectionPage)
- Auto-generated `sitemap.xml` on every build
- Canonical URLs on all pages
- Open Graph and social media meta tags

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.16.1
- **npm** >= 9.5.1

### Installation

```bash
# Clone the repository
git clone https://github.com/elkys/WebSiteOficial.git

# Navigate to the project directory
cd WebSiteOficial

# Install dependencies
npm install

# Start the development server
npm run dev
```

The dev server will be available at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_GA_ID=your_google_analytics_id
```

---

## Scripts

| Command                    | Description                                                         |
| -------------------------- | ------------------------------------------------------------------- |
| `npm run dev`              | Start development server with HMR                                   |
| `npm run build`            | Production build (esbuild) + sitemap + .htaccess                    |
| `npm run build:min`        | Production build with Terser minification (console removal, 2-pass) |
| `npm run build:dev`        | Development mode build for local testing                            |
| `npm run preview`          | Preview production build locally                                    |
| `npm run format`           | Format all source files with Prettier                               |
| `npm run format:check`     | Check formatting without modifying files                            |
| `npm run generate-sitemap` | Generate `sitemap.xml` standalone                                   |

---

## Build Modes

| Mode        | Minifier        | Console Removal | Use Case                |
| ----------- | --------------- | --------------- | ----------------------- |
| `build`     | esbuild         | No              | Fast iteration, staging |
| `build:min` | Terser (2-pass) | Yes             | Production deploy       |
| `build:dev` | None (dev mode) | No              | Debug builds            |

All builds automatically generate `sitemap.xml` and copy `.htaccess` to `dist/`.

---

## Deployment

The project is configured for deployment on **Hostinger** shared hosting via FTP.

```bash
# 1. Build for production
npm run build:min

# 2. Upload the dist/ folder to the server
# The .htaccess file handles React Router client-side routing
```

---

## Pages

| Route               | Page             | Description                                                              |
| ------------------- | ---------------- | ------------------------------------------------------------------------ |
| `/`                 | Homepage         | Hero, About, Services, Clients, Testimonials, Contact Form, Contact Info |
| `/cases`            | Portfolio        | Project showcase with video previews and lazy loading                    |
| `/privacy-policy`   | Privacy Policy   | LGPD-compliant privacy policy                                            |
| `/terms-of-service` | Terms of Service | Terms and conditions                                                     |
| `/cookie-policy`    | Cookie Policy    | Cookie usage policy                                                      |
| `*`                 | 404              | Custom not-found page                                                    |

---

## Documentation

| Document                                 | Description                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| [`docs/elkys_design_system_*.md`](docs/) | Complete design system specification (colors, typography, components, tokens, a11y) |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

The icon SVG files in `src/assets/icons/svg/` are derived from [Lucide](https://lucide.dev) and licensed under the [ISC License](src/assets/icons/LICENSE).

---

<p align="center">
  <strong>Elkys Software House</strong><br />
  Software engineering for businesses that demand reliability.
</p>
