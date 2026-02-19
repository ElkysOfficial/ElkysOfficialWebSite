# Elkys Design System v3.2

> **Elkys Software House** | Internal Design System Specification
> Authorial system — zero third-party UI kits
> Stack: Tailwind CSS + SCSS Tokens + React Components + SVGR Icons

**Last updated:** 19/02/2026 14:32
**Maintainer:** Elkys Engineering Team
**Status:** Production

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Architecture](#2-architecture)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Border Radius](#6-border-radius)
7. [Elevation & Shadows](#7-elevation--shadows)
8. [Gradients](#8-gradients)
9. [Animations & Motion](#9-animations--motion)
10. [Icon System](#10-icon-system)
11. [Components](#11-components)
12. [Primitives](#12-primitives)
13. [Form Components](#13-form-components)
14. [Dark Mode](#14-dark-mode)
15. [Responsive Design](#15-responsive-design)
16. [Accessibility](#16-accessibility)
17. [Hexagonal Identity System](#17-hexagonal-identity-system)
18. [Technical Stack](#18-technical-stack)
19. [Contribution Guidelines](#19-contribution-guidelines)
20. [Changelog](#20-changelog)

---

## 1. Design Principles

| Principle                | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| **Immutable visual**     | Any visual change requires a dedicated PR with manual validation                 |
| **Authorial DS**         | Zero third-party UI kits — internal components built with Tailwind + SCSS        |
| **Minimal dependencies** | Only CVA, clsx, tailwind-merge, sonner (toast)                                   |
| **Consistency**          | Same typography, spacing, radii, and patterns across all pages                   |
| **Accessibility-first**  | WCAG AA/AAA, minimum 44px touch targets, focus-visible, reduced-motion           |
| **Performance**          | GPU-optimized animations, mobile-tuned durations, `will-change` only when needed |
| **Tokens-first**         | No raw HEX/RGB in components — all values via CSS custom properties              |
| **Zero runtime icons**   | Proprietary SVGR icon system — no lucide-react, no icon font bundles             |

---

## 2. Architecture

### Directory Structure

```
src/
├── assets/
│   └── icons/                 # Proprietary SVGR icon system
│       ├── svg/               # Raw SVG files (35 icons)
│       ├── create-icon.tsx    # Icon wrapper with a11y defaults
│       ├── index.ts           # Tree-shakeable barrel exports
│       └── LICENSE            # Lucide ISC attribution
├── styles/                    # SCSS Design Tokens + Utilities
│   ├── index.scss             # Entry point (sass:meta + Tailwind directives)
│   ├── _tokens.scss           # CSS custom properties (:root + .dark)
│   ├── _base.scss             # Reset + base typography (body, *)
│   ├── _mixins.scss           # Reusable SCSS mixins
│   ├── _components.scss       # Semantic classes (.elkys-section, .elkys-label)
│   └── _utilities.scss        # Gradients, shadows, animations, carousel, a11y
├── design-system/             # Internal React components
│   ├── index.ts               # Barrel exports
│   ├── components/
│   │   ├── Button.tsx         # CVA variants (10 variants, 4 sizes)
│   │   ├── Card.tsx           # Card + subcomponents (Header, Title, Content, Footer)
│   │   ├── Input.tsx          # Input field (44px min-height)
│   │   ├── Textarea.tsx       # Textarea field (120px min-height)
│   │   └── Toast.tsx          # Wrapper over Sonner (theme-aware)
│   ├── primitives/
│   │   ├── Container.tsx      # container mx-auto px-4
│   │   ├── Section.tsx        # py-16 md:py-20 lg:py-24 + bg variants
│   │   ├── Stack.tsx          # space-y-{n}
│   │   └── Grid.tsx           # grid md:grid-cols-{n} gap-{n}
│   ├── form/
│   │   ├── Label.tsx          # Semantic label
│   │   ├── Field.tsx          # Field wrapper
│   │   └── ErrorText.tsx      # Validation error text
│   └── utils/
│       └── cn.ts              # clsx + tailwind-merge
├── Fonts.css                  # @font-face Poppins (4 weights, woff2)
├── components/                # Business components (Hero, Nav, Footer...)
└── pages/                     # Application pages
```

### SCSS Module System

The entry point `index.scss` uses the **Dart Sass module system** (`@use 'sass:meta'` + `meta.load-css()`) to load partials within `@layer` blocks, eliminating `@import` deprecation warnings:

```scss
@use "sass:meta";
@import "../Fonts.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  @include meta.load-css("tokens");
}
@layer base {
  @include meta.load-css("base");
}
@layer components {
  @include meta.load-css("components");
}
@layer utilities {
  @include meta.load-css("utilities");
}
```

> **Rule:** Never use `@import` for SCSS partials. Use `meta.load-css()` for CSS within `@layer`, or `@use`/`@forward` for Sass modules.

### Token Format

CSS custom properties in HSL **without the `hsl()` wrapper**. The `hsl()` is applied in `tailwind.config.ts`:

```css
/* _tokens.scss */
--primary: 261 54% 33%;

/* tailwind.config.ts */
primary: { DEFAULT: "hsl(var(--primary))" }

/* JSX */
<div className="bg-primary text-primary-foreground" />
```

### Utility Function

```typescript
// src/design-system/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Component Pattern (CVA)

```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/design-system/utils/cn";

const variants = cva("base-classes", {
  variants: {
    variant: { default: "...", secondary: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

### Import Convention

```typescript
// All components via barrel export:
import { Button, Card, CardContent, Input, Toaster } from "@/design-system";

// All icons via barrel export:
import { ArrowRight, Phone, Mail } from "@/assets/icons";

// Direct imports (alternative):
import { Button } from "@/design-system/components/Button";
import { cn } from "@/design-system/utils/cn";
```

---

## 3. Color System

### 3.1 Brand Palette (Light Mode)

| Token               | HSL           | HEX       | Usage                                        |
| ------------------- | ------------- | --------- | -------------------------------------------- |
| `--primary`         | `261 54% 33%` | `#472680` | Purple — buttons, links, highlights          |
| `--primary-light`   | `261 58% 45%` | —         | Hover state                                  |
| `--primary-dark`    | `261 60% 25%` | —         | Active state                                 |
| `--primary-soft`    | `261 40% 95%` | —         | Subtle backgrounds                           |
| `--secondary`       | `223 48% 27%` | `#243164` | Blue — headers, hero, strong text            |
| `--secondary-light` | `223 52% 38%` | —         | Hover state                                  |
| `--secondary-dark`  | `223 55% 20%` | —         | Active state                                 |
| `--accent`          | `180 75% 32%` | —         | Cyan — CTAs, badges, service icons (WCAG AA) |
| `--accent-light`    | `180 70% 42%` | —         | Hover state                                  |
| `--accent-soft`     | `180 50% 95%` | —         | Soft background                              |

### 3.2 Dark Mode Adjustments

| Token         | Light         | Dark          | Rule                            |
| ------------- | ------------- | ------------- | ------------------------------- |
| `--primary`   | `261 54% 33%` | `261 65% 55%` | +22% lightness, +11% saturation |
| `--secondary` | `223 48% 27%` | `223 55% 42%` | +15% lightness                  |
| `--accent`    | `180 75% 32%` | `180 70% 45%` | +13% lightness                  |

### 3.3 Semantic Colors

| Token           | Light         | Dark          | Usage             |
| --------------- | ------------- | ------------- | ----------------- |
| `--destructive` | `0 72% 51%`   | `0 72% 55%`   | Errors, deletions |
| `--success`     | `142 71% 35%` | `142 65% 42%` | Confirmations     |
| `--warning`     | `38 92% 50%`  | `38 88% 55%`  | Warnings          |

### 3.4 Surface Colors

| Token          | Light         | Dark          | Usage                  |
| -------------- | ------------- | ------------- | ---------------------- |
| `--background` | `0 0% 100%`   | `224 47% 9%`  | Page background        |
| `--foreground` | `224 47% 11%` | `220 14% 96%` | Primary text           |
| `--card`       | `0 0% 100%`   | `224 42% 12%` | Cards, containers      |
| `--muted`      | `220 14% 96%` | `224 30% 18%` | Subtle backgrounds     |
| `--border`     | `220 13% 91%` | `224 25% 20%` | Borders                |
| `--input`      | `220 13% 91%` | `224 25% 20%` | Inputs                 |
| `--ring`       | `261 54% 33%` | `261 65% 55%` | Focus ring (= primary) |

### 3.5 Neutral Scale

| Token           | Light         | Dark          |
| --------------- | ------------- | ------------- |
| `--neutral-50`  | `220 14% 98%` | `224 30% 18%` |
| `--neutral-100` | `220 14% 96%` | `224 28% 16%` |
| `--neutral-200` | `220 13% 91%` | `224 25% 20%` |
| `--neutral-300` | `220 11% 84%` | `224 22% 25%` |
| `--neutral-400` | `220 9% 64%`  | `220 15% 40%` |
| `--neutral-500` | `220 8% 46%`  | `220 12% 50%` |
| `--neutral-600` | `220 13% 35%` | `220 10% 60%` |
| `--neutral-700` | `220 17% 25%` | `220 10% 72%` |
| `--neutral-800` | `220 24% 17%` | `220 12% 84%` |
| `--neutral-900` | `224 47% 11%` | `220 14% 96%` |

---

## 4. Typography

**Font:** Poppins (self-hosted, woff2, `font-display: swap`)

| Weight | Name     | Usage               |
| ------ | -------- | ------------------- |
| 400    | Regular  | Body text           |
| 500    | Medium   | Emphasis, labels    |
| 600    | SemiBold | Headings, buttons   |
| 700    | Bold     | Strong titles, hero |

### Type Scale

| Token              | Value           | Usage                |
| ------------------ | --------------- | -------------------- |
| `--font-size-xs`   | 0.75rem (12px)  | Captions, labels     |
| `--font-size-sm`   | 0.875rem (14px) | Small text           |
| `--font-size-base` | 1rem (16px)     | Default body         |
| `--font-size-lg`   | 1.125rem (18px) | Highlight paragraphs |
| `--font-size-xl`   | 1.25rem (20px)  | H4, card titles      |
| `--font-size-2xl`  | 1.5rem (24px)   | H3                   |
| `--font-size-3xl`  | 2rem (32px)     | H2                   |
| `--font-size-4xl`  | 2.5rem (40px)   | H1 mobile            |
| `--font-size-5xl`  | 3rem (48px)     | H1 desktop           |

### Line Height & Letter Spacing

| Token                     | Value   | Usage             |
| ------------------------- | ------- | ----------------- |
| `--line-height-tight`     | 1.2     | Headings          |
| `--line-height-snug`      | 1.4     | Subheadings       |
| `--line-height-normal`    | 1.6     | Body text         |
| `--line-height-relaxed`   | 1.75    | Long-form content |
| `--letter-spacing-tight`  | -0.02em | Large headings    |
| `--letter-spacing-normal` | 0       | Body              |
| `--letter-spacing-wide`   | 0.02em  | Buttons, labels   |

---

## 5. Spacing & Layout

Multiples of 4px. Sections use `py-16 md:py-20 lg:py-24` (64/80/96px).

Container: max 1400px (`2xl` breakpoint), centered, responsive padding (16px mobile to 48px desktop).

---

## 6. Border Radius

| Token           | Value  | Usage                         |
| --------------- | ------ | ----------------------------- |
| `--radius-xs`   | 2px    | Subtle rounding               |
| `--radius-sm`   | 6px    | Badges, tags                  |
| `--radius-md`   | 8px    | Buttons, inputs **(default)** |
| `--radius-lg`   | 12px   | Cards                         |
| `--radius-xl`   | 16px   | Sections, large cards         |
| `--radius-2xl`  | 20px   | Hero elements                 |
| `--radius-3xl`  | 24px   | Large hero elements           |
| `--radius-full` | 9999px | Pills, avatars                |

---

## 7. Elevation & Shadows

### Four Levels

| Level | Token         | Usage             |
| ----- | ------------- | ----------------- |
| 1     | `--shadow-sm` | Cards at rest     |
| 2     | `--shadow-md` | Hover states      |
| 3     | `--shadow-lg` | Modals, dropdowns |
| 4     | `--shadow-xl` | Maximum elevation |

### Brand Shadows

| Token                 | Description              |
| --------------------- | ------------------------ |
| `--shadow-primary`    | Purple-tinted shadow     |
| `--shadow-primary-lg` | Large purple shadow      |
| `--shadow-glow`       | Purple glow effect       |
| `--shadow-elegant`    | Alias for shadow-primary |
| `--shadow-card`       | Alias for shadow-sm      |
| `--shadow-card-hover` | Alias for shadow-md      |

> Dark mode: shadows 2-4x more pronounced.

---

## 8. Gradients

| Class                 | Angle  | Colors                    | Usage                   |
| --------------------- | ------ | ------------------------- | ----------------------- |
| `bg-gradient-primary` | 135deg | primary -> primary-light  | Buttons, badges         |
| `bg-gradient-hero`    | 135deg | secondary -> primary      | Hero sections           |
| `bg-gradient-subtle`  | 180deg | background -> neutral-100 | Alternating backgrounds |
| `bg-gradient-accent`  | 135deg | accent -> accent-light    | Highlight CTAs          |

### Service & Contact Icons

All service icons (Services.tsx) and contact icons (Contact.tsx) use the accent gradient:

```
bg-gradient-to-r from-accent to-accent-light
```

### Section Background Alternation (Homepage)

```
Hero:            bg-gradient-hero
About:           bg-gradient-subtle
Services:        bg-background
ClientsCarousel: bg-muted
Testimonials:    bg-gradient-subtle
ContactForm:     bg-background
Contact:         bg-gradient-subtle
Footer:          bg-card
```

---

## 9. Animations & Motion

### Keyframes (defined in `tailwind.config.ts`)

| Animation        | Duration                 | Type        |
| ---------------- | ------------------------ | ----------- |
| `fade-in`        | 0.6s ease-out            | Entry       |
| `slide-up`       | 0.8s ease-out            | Entry       |
| `float`          | 3s ease-in-out infinite  | Decorative  |
| `diamond-rotate` | 5s ease-in-out infinite  | Decorative  |
| `hex-spin`       | 20s ease-in-out infinite | Decorative  |
| `card-pulse`     | 3s cubic-bezier infinite | Interaction |
| `clients-scroll` | 60s linear infinite      | Carousel    |

### Hover Effects (CSS in `_utilities.scss`)

| Class                    | Effect                                 |
| ------------------------ | -------------------------------------- |
| `.hover-lift`            | translateY(-2px) on hover              |
| `.btn-primary-animate`   | Shine + elevation + accent shadow      |
| `.btn-secondary-animate` | Shine + elevation                      |
| `.btn-arrow-animate`     | translateX(4px) on parent hover        |
| `.hex-card-container`    | Rotating hexagonal bg, pauses on hover |

### Mobile Performance (< 768px)

- float: 6s (slower = less CPU)
- diamond-rotate: 4s
- card-pulse: disabled
- clients-scroll: 40s

### Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Icon System

### Overview

Proprietary SVGR-based icon system replacing `lucide-react`. Icons are raw SVG files imported as React components via `vite-plugin-svgr`, wrapped with a standardized `createIcon` HOC.

**Location:** `src/assets/icons/`

### Architecture

```
src/assets/icons/
├── svg/               # 35 raw SVG files (kebab-case)
├── create-icon.tsx    # Wrapper HOC (size, strokeWidth, a11y)
├── index.ts           # Named exports (tree-shakeable)
└── LICENSE            # Lucide ISC attribution
```

### `createIcon` API

```typescript
interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string; // Default: 24
  strokeWidth?: number | string; // Default: 2
  title?: string; // When set: role="img", aria-label
  className?: string;
}
```

**A11y defaults:**

- Decorative (default): `aria-hidden="true"`, `focusable="false"`
- Accessible (when `title` or `aria-label` provided): `role="img"`, `aria-label`

### Usage

```typescript
import { ArrowRight, Phone, Star } from "@/assets/icons";

// Decorative (default)
<ArrowRight className="h-5 w-5" />

// Custom size
<Phone size={20} />

// Accessible
<Star title="Rating star" className="fill-accent text-accent" />
```

### SVGR Configuration (vite.config.ts)

```typescript
svgr({
  svgrOptions: {
    plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
    svgoConfig: {
      plugins: [
        { name: "removeViewBox", active: false },
        { name: "removeDimensions", active: true },
        { name: "prefixIds", params: { prefixClassNames: false } },
      ],
    },
    replaceAttrValues: { "#000": "currentColor", "#000000": "currentColor" },
  },
});
```

### Available Icons (35)

`ArrowLeft` `ArrowRight` `ArrowUp` `Building2` `CheckCircle` `ChevronRight` `Clock` `Code` `Code2` `Cog` `Cookie` `ExternalLink` `Eye` `FileText` `Github` `Globe` `Heart` `Home` `Instagram` `Linkedin` `Mail` `Menu` `Network` `Phone` `Play` `Quote` `Search` `Send` `Shield` `Star` `Target` `TrendingUp` `Wrench` `X` `Zap`

---

## 11. Components

### 11.1 Button

**File:** `src/design-system/components/Button.tsx`

| Variant              | Description                                    |
| -------------------- | ---------------------------------------------- |
| `default`            | Primary bg + white text — primary actions      |
| `secondary`          | Secondary bg + white text — supporting actions |
| `accent`             | Accent bg + white text — highlight CTAs        |
| `gradient`           | Primary gradient — maximum emphasis            |
| `gradient_secondary` | Subtle gradient — secondary emphasis           |
| `outline`            | Border + background — secondary actions        |
| `hero_outline`       | White bg + primary text — on dark backgrounds  |
| `ghost`              | Transparent — tertiary actions                 |
| `link`               | Text with underline — inline links             |
| `destructive`        | Red bg — destructive actions                   |

**Sizes:**

| Size      | Height    | Min-H   | Padding   |
| --------- | --------- | ------- | --------- |
| `sm`      | h-9       | 36px    | px-3      |
| `default` | h-10      | 44px    | px-4 py-2 |
| `lg`      | h-11      | 44px    | px-6      |
| `icon`    | h-10 w-10 | 44x44px | —         |

**Rules:** Min 44px (WCAG AAA), `tracking-wide`, focus ring 2px, transition 150ms.

### 11.2 Card

**File:** `src/design-system/components/Card.tsx`

Subcomponents: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

```
Base:        border border-border bg-card rounded-lg shadow-card
Hover:       shadow-card-hover (200ms transition)
Header:      flex flex-col space-y-1.5 p-6
Content:     p-6 pt-0
Footer:      flex items-center p-6 pt-0
Title:       text-xl font-semibold leading-tight tracking-tight
Description: text-sm text-muted-foreground
```

### 11.3 Input

**File:** `src/design-system/components/Input.tsx`

```
Height:      h-10 min-h-[44px]
Border:      border border-input rounded-md
Background:  bg-background
Focus:       ring-2 ring-ring ring-offset-2
Placeholder: text-muted-foreground
Font:        text-base (mobile), text-sm (md+)
```

### 11.4 Textarea

**File:** `src/design-system/components/Textarea.tsx`

```
Min Height:  min-h-[120px]
Styles:      Same as Input
```

### 11.5 Toast (Sonner)

**File:** `src/design-system/components/Toast.tsx`

Wrapper over the `sonner` library with next-themes support:

```typescript
import { toast } from "sonner";

toast.success("Message sent!");
toast.error("Error sending", { description: "Please try again." });
```

The `<Toaster />` component must be mounted once in `App.tsx`.

---

## 12. Primitives

### Container

```typescript
import { Container } from "@/design-system";
<Container>...</Container>
// Renders: <div className="container mx-auto px-4">
```

### Section

```typescript
import { Section } from "@/design-system";
<Section bg="background">...</Section>
// bg: "background" | "muted" | "gradient-subtle" | "gradient-hero" | "card"
// Base: py-16 md:py-20 lg:py-24
```

### Stack

```typescript
import { Stack } from "@/design-system";
<Stack gap={6}>...</Stack>
// gap: 2 | 3 | 4 | 6 | 8 -> space-y-{n}
```

### Grid

```typescript
import { Grid } from "@/design-system";
<Grid cols={3} gap={8}>...</Grid>
// cols: 2 | 3 | 4 -> grid md:grid-cols-{n}
// gap: 4 | 6 | 8
```

---

## 13. Form Components

### Label

```typescript
import { Label } from "@/design-system";
<Label htmlFor="email">E-mail *</Label>
// Renders: block text-sm font-medium text-foreground mb-2
```

### ErrorText

```typescript
import { ErrorText } from "@/design-system";
<ErrorText>{errors.email?.message}</ErrorText>
// Renders: text-destructive text-xs mt-1
```

### Field

```typescript
import { Field } from "@/design-system";
<Field>
  <Label htmlFor="email">E-mail</Label>
  <Input id="email" />
  {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
</Field>
```

---

## 14. Dark Mode

**Implementation:** `next-themes` with `class` strategy, default `system`.

```typescript
// main.tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

### FOUC Prevention

The `index.html` includes an inline script that applies the theme before React mounts, synchronized with `next-themes` logic:

1. Check `localStorage` ("theme" key)
2. If "dark" -> apply dark
3. If "light" -> apply light
4. If "system" or absent -> detect via `matchMedia`

> **Rule:** The inline script in `index.html` MUST follow the exact same logic as `next-themes`. Never change one without the other.

### Dark Mode Color Rules

- Brand colors: more vibrant (+lightness, +saturation)
- Background: dark blue tone (not pure black)
- Cards: slightly lighter than background
- Shadows: 2-4x more pronounced
- Text: off-white (not pure white)

### Hero Dark Mode

The Hero uses Tailwind slate for dark mode:

```
dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
```

> **DO NOT change** Hero dark colors — they are intentional and differ from the rest of the site.

---

## 15. Responsive Design

### Breakpoints (Mobile-First)

| Prefix | Min-Width | Devices               |
| ------ | --------- | --------------------- |
| (base) | 0px       | Smartphones portrait  |
| `xs`   | 475px     | Smartphones landscape |
| `sm`   | 640px     | Small tablets         |
| `md`   | 768px     | Tablets portrait      |
| `lg`   | 1024px    | Laptops               |
| `xl`   | 1280px    | Desktops              |
| `2xl`  | 1536px    | Large monitors        |

---

## 16. Accessibility

| Requirement      | Rule                 | Implementation                                 |
| ---------------- | -------------------- | ---------------------------------------------- |
| Touch Target     | Min 44x44px          | `min-h-[44px] min-w-[44px]`                    |
| Color Contrast   | WCAG AA (4.5:1)      | All colors tested                              |
| Focus Visible    | 2px ring             | `focus-visible:ring-2 focus-visible:ring-ring` |
| Reduced Motion   | Respect preference   | `@media (prefers-reduced-motion)`              |
| Semantic HTML    | Correct tags         | `<nav>`, `<main>`, `<section>`, `<h1-h6>`      |
| ARIA Labels      | Interactive elements | `aria-label`, `aria-expanded`, `aria-current`  |
| Form Labels      | All inputs           | `<label htmlFor>`                              |
| Alt Text         | All images           | Descriptive `alt`                              |
| Keyboard Nav     | Logical tab order    | `tabindex` when needed                         |
| Icons (default)  | Decorative           | `aria-hidden="true"`, `focusable="false"`      |
| Icons (semantic) | Accessible           | `role="img"`, `aria-label` via `title` prop    |

---

## 17. Hexagonal Identity System

Brand shape: rounded hexagon (`hexagonal.webp`). Used as **micro-accents only**, never dominant.

### CSS Tokens

```css
--hex-clip: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
--hex-accent-size: 8px;
--hex-bullet-size: 5px;
--hex-divider-size: 10px;
```

### Placement Rules

| Element               | Usage                  | Size                  |
| --------------------- | ---------------------- | --------------------- |
| Section titles        | Ornament above         | 8px                   |
| Feature lists         | Bullet marker          | 5px                   |
| Section dividers      | Centered on line       | 10px                  |
| Cards with `accent`   | Corner micro seal      | 6px                   |
| Footer headings       | Inline next to text    | 8px                   |
| Active nav link       | Indicator below        | 4px                   |
| Purple gradient boxes | Rotating bg decoration | 28-48px, opacity 0.08 |

### Where hexagon does NOT appear

- Icon containers (keep `rounded-full` / `rounded-lg`)
- Heavy background patterns
- Tilted layouts
- Type badges
- Full card borders

### Rotating Hexagonal Decoration

Purple gradient boxes (`bg-gradient-primary`) feature a subtle rotating hexagonal background:

```tsx
<div className="bg-gradient-primary hex-card-container">
  <img
    src={hexagonalBg}
    alt=""
    aria-hidden="true"
    className="hex-card-bg opacity-[0.08] animate-hex-spin will-change-transform"
  />
  <div className="relative z-10">...</div>
</div>
```

- Animation: `hex-spin` — 20s ease-in-out infinite
- Pauses on hover via CSS `animation-play-state: paused`
- Respects `prefers-reduced-motion`

---

## 18. Technical Stack

### Core Dependencies

| Dependency                 | Version   | Purpose                                |
| -------------------------- | --------- | -------------------------------------- |
| React                      | 18.3.x    | UI Framework                           |
| TypeScript                 | 5.x       | Type safety                            |
| Vite                       | 7.x (SWC) | Build tool                             |
| Tailwind CSS               | 3.4.x     | Utility CSS                            |
| SCSS (sass)                | devDep    | Tokens, mixins, layers (module system) |
| `class-variance-authority` | 0.7.x     | Component variants                     |
| `clsx`                     | 2.1.x     | Class concatenation                    |
| `tailwind-merge`           | 2.5.x     | Conflict resolution                    |
| `next-themes`              | 0.3.x     | Dark mode                              |
| `sonner`                   | 1.5.x     | Toast notifications                    |
| `vite-plugin-svgr`         | 4.5.x     | SVG -> React components                |
| `@svgr/plugin-svgo`        | 8.1.x     | SVG optimization                       |
| `react-hook-form` + `zod`  | 7.x / 3.x | Form management + validation           |
| `@emailjs/browser`         | 4.x       | Email sending                          |
| `react-helmet-async`       | 2.x       | SEO meta tags                          |

### Removed

| Package                    | Version Removed | Reason                                   |
| -------------------------- | --------------- | ---------------------------------------- |
| `lucide-react`             | v3.2            | Replaced by proprietary SVGR icon system |
| `@radix-ui/react-slot`     | v3.0            | Replaced by direct `<button>`            |
| `@radix-ui/react-toast`    | v3.0            | Replaced by Sonner                       |
| `@radix-ui/react-label`    | v3.0            | Not used                                 |
| `@radix-ui/react-tooltip`  | v3.0            | Not used                                 |
| `components.json` (shadcn) | v3.0            | Authorial DS                             |

### Known Workarounds

| Issue                                             | Workaround                                                             | Reference                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `fetchPriority` warning in `<img>` (React 18.3.1) | Use `{...{ fetchpriority: "high" }}` instead of `fetchPriority="high"` | [React #28948](https://github.com/facebook/react/issues/28948) — fixed in React 19 |

---

## 19. Contribution Guidelines

### Prohibited

- Raw HEX/RGB in components — use tokens
- Creating components outside `src/design-system/`
- Adding third-party UI kits (MUI, Ant, Chakra, shadcn, Radix)
- Changing spacing, typography, colors, shadows, borders, radii without a dedicated PR
- Importing from `@/components/ui/` (legacy path, removed)
- Using `@import` in SCSS — use `@use`/`meta.load-css()`
- Using camelCase `fetchPriority` in JSX (use spread workaround)
- Adding new icon libraries — add SVG files to `src/assets/icons/svg/`

### Required

- Import components from `@/design-system`
- Import icons from `@/assets/icons`
- Use `cn()` for class merging
- Min 44px on all touch targets
- `aria-label` on icon-only buttons/links
- Test light + dark mode
- Test mobile + desktop

### PR Checklist

- [ ] Visual identical to baseline (manual diff light + dark)
- [ ] `npm run build` passes without errors
- [ ] No raw HEX/RGB in components
- [ ] New components are in `src/design-system/`
- [ ] New icons are SVG files in `src/assets/icons/svg/` with `createIcon` wrapper
- [ ] Touch targets >= 44px
- [ ] Dark mode tested
- [ ] Mobile tested

---

## 20. Changelog

### v3.2 (19/02/2026)

- **Icon system migration:** Removed `lucide-react` dependency, replaced with proprietary SVGR icon system (`src/assets/icons/`)
- 35 SVG icons extracted, wrapped with `createIcon` HOC (size, strokeWidth, a11y defaults)
- Tree-shakeable barrel exports via `@/assets/icons`
- `vite-plugin-svgr` + `@svgr/plugin-svgo` + `@svgr/plugin-jsx` configured in `vite.config.ts`
- Lucide ISC LICENSE attribution maintained
- Added rotating hexagonal decoration to all `bg-gradient-primary` boxes
- Added `hex-spin` animation (20s ease-in-out infinite, pauses on hover)
- "Falar com Suporte" button updated to `accent` variant
- Design system documentation consolidated into single file

### v3.1 (February 2026)

- SCSS migrated from `@import` to `@use 'sass:meta'` + `meta.load-css()` (zero deprecation warnings)
- Fix `fetchPriority` React 18.3.1 warning in Hero.tsx and Cases.tsx (spread workaround)
- Fix theme detection: inline script in `index.html` synchronized with `next-themes` logic
- Service and contact icons standardized with accent gradient
- Obsolete `docs/design-system.md` documentation removed

### v3.0 (February 2026)

- Complete migration from shadcn/UI + Radix to authorial DS
- Created `src/design-system/` with components, primitives, form, utils
- Created `src/styles/` with structured SCSS (tokens, base, mixins, components, utilities)
- Toast consolidation: Radix toast removed, Sonner as sole provider
- Removed 4 `@radix-ui` packages, `components.json`, `src/components/ui/`, `src/lib/`, `src/hooks/`
- CSS reduced from 50.70KB to 44.94KB; `ui-vendor` chunk eliminated

---

> **Elkys Design System v3.2** — Authorial DS, zero third-party UI kits
> Last updated: 19/02/2026 14:32
