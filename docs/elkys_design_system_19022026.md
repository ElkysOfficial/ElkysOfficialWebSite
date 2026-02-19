# Elkys Design System v3.1

> **Sistema de Design autoral da Elkys Software House**
> Design system interno.
> Tailwind CSS puro + SCSS estruturado + componentes React internos.

---

## Sumario

1. [Principios](#1-principios)
2. [Arquitetura](#2-arquitetura)
3. [Cores](#3-cores)
4. [Tipografia](#4-tipografia)
5. [Espacamento e Layout](#5-espacamento-e-layout)
6. [Border Radius](#6-border-radius)
7. [Sombras e Elevacao](#7-sombras-e-elevacao)
8. [Gradientes](#8-gradientes)
9. [Animacoes e Motion](#9-animacoes-e-motion)
10. [Componentes](#10-componentes)
11. [Primitives](#11-primitives)
12. [Form](#12-form)
13. [Dark Mode](#13-dark-mode)
14. [Responsividade](#14-responsividade)
15. [Acessibilidade](#15-acessibilidade)
16. [Stack Tecnica](#16-stack-tecnica)
17. [Regras de Contribuicao](#17-regras-de-contribuicao)

---

## 1. Principios

| Principio                | Descricao                                                                |
| ------------------------ | ------------------------------------------------------------------------ |
| **Visual imutavel**      | Qualquer mudanca visual exige PR separado + validacao manual             |
| **DS autoral**           | Zero UI kits prontos — componentes internos com Tailwind + SCSS          |
| **Dependencias minimas** | Apenas CVA, clsx, tailwind-merge, sonner (toast)                         |
| **Consistencia**         | Mesma tipografia, espacamento, raios e padroes em todo o site            |
| **Acessibilidade**       | WCAG AA/AAA, min 44px touch targets, focus-visible, reduced-motion       |
| **Performance**          | Animacoes otimizadas para mobile, `will-change` apenas quando necessario |
| **Tokens first**         | Nenhum HEX/RGB solto em componentes — tudo via CSS variables             |

---

## 2. Arquitetura

### Estrutura de Diretorios

```
src/
├── styles/                    <- SCSS Design Tokens + Utilities
│   ├── index.scss             <- Entry point (sass:meta + Tailwind directives)
│   ├── _tokens.scss           <- CSS custom properties (:root + .dark)
│   ├── _base.scss             <- Reset + tipografia base (body, *)
│   ├── _mixins.scss           <- Mixins SCSS reutilizaveis
│   ├── _components.scss       <- Classes semanticas (.elkys-section, .elkys-label)
│   └── _utilities.scss        <- Gradients, shadows, animations, carousel, a11y
├── design-system/             <- Componentes React internos
│   ├── index.ts               <- Barrel exports
│   ├── components/
│   │   ├── Button.tsx         <- CVA variants, sem Radix
│   │   ├── Card.tsx           <- Card + subcomponents
│   │   ├── Input.tsx          <- Input field
│   │   ├── Textarea.tsx       <- Textarea field
│   │   └── Toast.tsx          <- Wrapper sobre Sonner (theme-aware)
│   ├── primitives/
│   │   ├── Container.tsx      <- container mx-auto px-4
│   │   ├── Section.tsx        <- py-16 md:py-20 lg:py-24 + bg variants
│   │   ├── Stack.tsx          <- space-y-{n}
│   │   └── Grid.tsx           <- grid md:grid-cols-{n} gap-{n}
│   ├── form/
│   │   ├── Label.tsx          <- Semantic label
│   │   ├── Field.tsx          <- Field wrapper
│   │   └── ErrorText.tsx      <- Validation error text
│   └── utils/
│       └── cn.ts              <- clsx + tailwind-merge
├── Fonts.css                  <- @font-face Poppins (4 pesos, woff2)
├── components/                <- Componentes de negocio (Hero, Nav, Footer...)
└── pages/                     <- Paginas da aplicacao
```

### SCSS Module System (v3.1)

O entry point `index.scss` usa o **Dart Sass module system** (`@use 'sass:meta'` + `meta.load-css()`) para carregar partials dentro de `@layer` blocks. Isso elimina os deprecation warnings do `@import`:

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

> **Regra:** Nunca usar `@import` para SCSS partials. Usar `meta.load-css()` para carregar CSS dentro de `@layer`, ou `@use`/`@forward` para modulos Sass.

### Formato dos Tokens

CSS custom properties em HSL **sem wrapper `hsl()`** nos valores. O `hsl()` e aplicado no Tailwind config:

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

### Padrao de Componentes (CVA)

```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/design-system/utils/cn";

const variants = cva("classes-base", {
  variants: {
    variant: { default: "...", secondary: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

### Como importar

```typescript
// Todos os componentes via barrel export:
import { Button, Card, CardContent, Input, Toaster } from "@/design-system";

// Ou imports diretos:
import { Button } from "@/design-system/components/Button";
import { cn } from "@/design-system/utils/cn";
```

---

## 3. Cores

### 3.1 Paleta Light Mode

| Token               | HSL           | HEX       | Uso                                                           |
| ------------------- | ------------- | --------- | ------------------------------------------------------------- |
| `--primary`         | `261 54% 33%` | `#472680` | Roxo principal — botoes, links, destaques                     |
| `--primary-light`   | `261 58% 45%` | —         | Hover state                                                   |
| `--primary-dark`    | `261 60% 25%` | —         | Active state                                                  |
| `--primary-soft`    | `261 40% 95%` | —         | Backgrounds sutis                                             |
| `--secondary`       | `223 48% 27%` | `#243164` | Azul — headers, hero, textos fortes                           |
| `--secondary-light` | `223 52% 38%` | —         | Hover state                                                   |
| `--secondary-dark`  | `223 55% 20%` | —         | Active state                                                  |
| `--accent`          | `180 75% 32%` | —         | Ciano — CTAs de destaque, badges, icones de servico (WCAG AA) |
| `--accent-light`    | `180 70% 42%` | —         | Hover state                                                   |
| `--accent-soft`     | `180 50% 95%` | —         | Background soft                                               |

### 3.2 Dark Mode (ajustes)

| Token         | Light         | Dark          | Regra                             |
| ------------- | ------------- | ------------- | --------------------------------- |
| `--primary`   | `261 54% 33%` | `261 65% 55%` | +22% luminosidade, +11% saturacao |
| `--secondary` | `223 48% 27%` | `223 55% 42%` | +15% luminosidade                 |
| `--accent`    | `180 75% 32%` | `180 70% 45%` | +13% luminosidade                 |

### 3.3 Semanticas

| Token           | Light         | Dark          | Uso              |
| --------------- | ------------- | ------------- | ---------------- |
| `--destructive` | `0 72% 51%`   | `0 72% 55%`   | Erros, exclusoes |
| `--success`     | `142 71% 35%` | `142 65% 42%` | Confirmacoes     |
| `--warning`     | `38 92% 50%`  | `38 88% 55%`  | Avisos           |

### 3.4 Superficies

| Token          | Light         | Dark          | Uso                    |
| -------------- | ------------- | ------------- | ---------------------- |
| `--background` | `0 0% 100%`   | `224 47% 9%`  | Fundo da pagina        |
| `--foreground` | `224 47% 11%` | `220 14% 96%` | Texto principal        |
| `--card`       | `0 0% 100%`   | `224 42% 12%` | Cards, containers      |
| `--muted`      | `220 14% 96%` | `224 30% 18%` | Backgrounds sutis      |
| `--border`     | `220 13% 91%` | `224 25% 20%` | Bordas                 |
| `--input`      | `220 13% 91%` | `224 25% 20%` | Inputs                 |
| `--ring`       | `261 54% 33%` | `261 65% 55%` | Focus ring (= primary) |

### 3.5 Escala Neutra

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

## 4. Tipografia

**Font:** Poppins (self-hosted, woff2, `font-display: swap`)

| Peso | Nome     | Uso                  |
| ---- | -------- | -------------------- |
| 400  | Regular  | Corpo de texto       |
| 500  | Medium   | Enfase, labels       |
| 600  | SemiBold | Headings, botoes     |
| 700  | Bold     | Titulos fortes, hero |

### Escala

| Token              | Valor           | Uso                 |
| ------------------ | --------------- | ------------------- |
| `--font-size-xs`   | 0.75rem (12px)  | Captions, labels    |
| `--font-size-sm`   | 0.875rem (14px) | Texto pequeno       |
| `--font-size-base` | 1rem (16px)     | Corpo padrao        |
| `--font-size-lg`   | 1.125rem (18px) | Paragrafos destaque |
| `--font-size-xl`   | 1.25rem (20px)  | H4, card titles     |
| `--font-size-2xl`  | 1.5rem (24px)   | H3                  |
| `--font-size-3xl`  | 2rem (32px)     | H2                  |
| `--font-size-4xl`  | 2.5rem (40px)   | H1 mobile           |
| `--font-size-5xl`  | 3rem (48px)     | H1 desktop          |

### Line Height / Letter Spacing

| Token                     | Valor   | Uso              |
| ------------------------- | ------- | ---------------- |
| `--line-height-tight`     | 1.2     | Headings         |
| `--line-height-snug`      | 1.4     | Subheadings      |
| `--line-height-normal`    | 1.6     | Body text        |
| `--line-height-relaxed`   | 1.75    | Conteudo longo   |
| `--letter-spacing-tight`  | -0.02em | Headings grandes |
| `--letter-spacing-normal` | 0       | Corpo            |
| `--letter-spacing-wide`   | 0.02em  | Botoes, labels   |

---

## 5. Espacamento e Layout

Multiplos de 4px. Secoes usam `py-16 md:py-20 lg:py-24` (64/80/96px).

Container: max 1400px (`2xl` breakpoint), centrado, padding responsivo (16px mobile -> 48px desktop).

---

## 6. Border Radius

| Token           | Valor  | Uso                          |
| --------------- | ------ | ---------------------------- |
| `--radius-xs`   | 2px    | Sutil                        |
| `--radius-sm`   | 6px    | Badges, tags                 |
| `--radius-md`   | 8px    | Botoes, inputs **(default)** |
| `--radius-lg`   | 12px   | Cards                        |
| `--radius-xl`   | 16px   | Secoes, cards grandes        |
| `--radius-2xl`  | 20px   | Hero elements                |
| `--radius-3xl`  | 24px   | Hero elements grandes        |
| `--radius-full` | 9999px | Pills, avatars               |

---

## 7. Sombras e Elevacao

### 4 Niveis

| Nivel | Token         | Uso               |
| ----- | ------------- | ----------------- |
| 1     | `--shadow-sm` | Cards em repouso  |
| 2     | `--shadow-md` | Hover states      |
| 3     | `--shadow-lg` | Modais, dropdowns |
| 4     | `--shadow-xl` | Elevacao maxima   |

### Sombras de Marca

| Token                 | Descricao                 |
| --------------------- | ------------------------- |
| `--shadow-primary`    | Sombra com tom roxo       |
| `--shadow-primary-lg` | Sombra roxo grande        |
| `--shadow-glow`       | Efeito glow roxo          |
| `--shadow-elegant`    | Alias para shadow-primary |
| `--shadow-card`       | Alias para shadow-sm      |
| `--shadow-card-hover` | Alias para shadow-md      |

> Dark mode: sombras 2-4x mais pronunciadas.

---

## 8. Gradientes

| Classe                | Angulo | Cores                     | Uso                    |
| --------------------- | ------ | ------------------------- | ---------------------- |
| `bg-gradient-primary` | 135deg | primary -> primary-light  | Botoes, badges         |
| `bg-gradient-hero`    | 135deg | secondary -> primary      | Hero sections          |
| `bg-gradient-subtle`  | 180deg | background -> neutral-100 | Backgrounds alternados |
| `bg-gradient-accent`  | 135deg | accent -> accent-light    | CTAs de destaque       |

### Icones de Servicos e Contato

Todos os icones de servico (Services.tsx) e contato (Contact.tsx) usam o gradiente accent:

```
bg-gradient-to-r from-accent to-accent-light
```

Isso garante consistencia visual entre todos os icones: Desenvolvimento Sob Demanda, Automacao e RPA, Integracoes de Sistemas, Consultoria e CI/CD, Telefone, E-mail, Horario de Atendimento.

### Padrao de Alternancia de Secoes (Homepage)

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

## 9. Animacoes e Motion

### Keyframes (definidos em tailwind.config.ts)

| Animacao         | Duracao                  | Tipo       |
| ---------------- | ------------------------ | ---------- |
| `fade-in`        | 0.6s ease-out            | Entrada    |
| `slide-up`       | 0.8s ease-out            | Entrada    |
| `float`          | 3s ease-in-out infinite  | Decorativa |
| `diamond-rotate` | 5s ease-in-out infinite  | Decorativa |
| `card-pulse`     | 3s cubic-bezier infinite | Interacao  |
| `clients-scroll` | 60s linear infinite      | Carrossel  |

### Efeitos de Hover (CSS em \_utilities.scss)

| Classe                   | Efeito                           |
| ------------------------ | -------------------------------- |
| `.hover-lift`            | translateY(-2px) no hover        |
| `.btn-primary-animate`   | Shine + elevacao + shadow accent |
| `.btn-secondary-animate` | Shine + elevacao                 |
| `.btn-arrow-animate`     | translateX(4px) no hover do pai  |

### Performance Mobile (< 768px)

- float: 6s (mais lento = menos CPU)
- diamond-rotate: 4s
- card-pulse: desabilitado
- clients-scroll: 40s

### Acessibilidade

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Componentes

### 10.1 Button

**Arquivo:** `src/design-system/components/Button.tsx`

**Props:**

```typescript
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
```

**Variantes:**

| Variante             | Descricao                                      |
| -------------------- | ---------------------------------------------- |
| `default`            | Primary bg + white text — acoes principais     |
| `secondary`          | Secondary bg + white text — acoes de suporte   |
| `accent`             | Accent bg + white text — CTAs de destaque      |
| `gradient`           | Primary gradient — enfase maxima               |
| `gradient_secondary` | Subtle gradient — enfase secundaria            |
| `outline`            | Border + background — acoes secundarias        |
| `hero_outline`       | White bg + primary text — sobre fundos escuros |
| `ghost`              | Transparent — acoes terciarias                 |
| `link`               | Texto com underline — links inline             |
| `destructive`        | Red bg — acoes destrutivas                     |

**Tamanhos:**

| Size      | Height    | Min-H   | Padding   |
| --------- | --------- | ------- | --------- |
| `sm`      | h-9       | 36px    | px-3      |
| `default` | h-10      | 44px    | px-4 py-2 |
| `lg`      | h-11      | 44px    | px-6      |
| `icon`    | h-10 w-10 | 44x44px | —         |

**Regras:** Min 44px (WCAG AAA), `tracking-wide`, focus ring 2px, transition 150ms.

### 10.2 Card

**Arquivo:** `src/design-system/components/Card.tsx`

Subcomponentes: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

```
Base:        border border-border bg-card rounded-lg shadow-card
Hover:       shadow-card-hover (transicao 200ms)
Header:      flex flex-col space-y-1.5 p-6
Content:     p-6 pt-0
Footer:      flex items-center p-6 pt-0
Title:       text-xl font-semibold leading-tight tracking-tight
Description: text-sm text-muted-foreground
```

### 10.3 Input

**Arquivo:** `src/design-system/components/Input.tsx`

```
Height:      h-10 min-h-[44px]
Border:      border border-input rounded-md
Background:  bg-background
Focus:       ring-2 ring-ring ring-offset-2
Placeholder: text-muted-foreground
Font:        text-base (mobile), text-sm (md+)
```

### 10.4 Textarea

**Arquivo:** `src/design-system/components/Textarea.tsx`

```
Min Height:  min-h-[120px]
Estilos:     Mesmos do Input
```

### 10.5 Toast (Sonner)

**Arquivo:** `src/design-system/components/Toast.tsx`

Wrapper sobre a lib `sonner` com tema next-themes. Uso:

```typescript
import { toast } from "sonner";

toast.success("Mensagem enviada!");
toast.error("Erro ao enviar", { description: "Tente novamente." });
```

O componente `<Toaster />` do DS deve ser montado uma vez no `App.tsx`.

---

## 11. Primitives

### Container

```typescript
import { Container } from "@/design-system";
<Container>...</Container>
// Renderiza: <div className="container mx-auto px-4">
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

## 12. Form

### Label

```typescript
import { Label } from "@/design-system";
<Label htmlFor="email">E-mail *</Label>
// Renderiza: block text-sm font-medium text-foreground mb-2
```

### ErrorText

```typescript
import { ErrorText } from "@/design-system";
<ErrorText>{errors.email?.message}</ErrorText>
// Renderiza: text-destructive text-xs mt-1
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

## 13. Dark Mode

**Implementacao:** `next-themes` com strategy `class`, default `system`.

```typescript
// main.tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

### Prevencao de FOUC

O `index.html` inclui um script inline que aplica o tema antes do React montar, sincronizado com a logica do `next-themes`:

```javascript
// 1. Verifica localStorage ("theme" key)
// 2. Se "dark" -> aplica dark
// 3. Se "light" -> aplica light
// 4. Se "system" ou ausente -> detecta via matchMedia
```

> **Regra:** O script inline no `index.html` DEVE seguir exatamente a mesma logica do `next-themes` (localStorage primeiro, depois OS). Nunca alterar um sem o outro.

### Regras de Cores

- Cores de marca mais vibrantes (+luminosidade, +saturacao)
- Background usa tom azulado escuro (nao preto puro)
- Cards levemente mais claros que background
- Sombras 2-4x mais pronunciadas
- Texto usa off-white (nao branco puro)

### Hero Dark Mode

O Hero usa Tailwind slate para dark mode:

```
dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
```

> **NAO alterar** as cores dark do Hero — sao intencionais e diferentes do restante do site.

---

## 14. Responsividade

### Breakpoints (Mobile-First)

| Prefixo | Min-Width | Dispositivos          |
| ------- | --------- | --------------------- |
| (base)  | 0px       | Smartphones portrait  |
| `xs`    | 475px     | Smartphones landscape |
| `sm`    | 640px     | Tablets pequenos      |
| `md`    | 768px     | Tablets portrait      |
| `lg`    | 1024px    | Laptops               |
| `xl`    | 1280px    | Desktops              |
| `2xl`   | 1536px    | Monitores grandes     |

---

## 15. Acessibilidade

| Requisito      | Regra            | Implementacao                                  |
| -------------- | ---------------- | ---------------------------------------------- |
| Touch Target   | Min 44x44px      | `min-h-[44px] min-w-[44px]`                    |
| Color Contrast | WCAG AA (4.5:1)  | Todas as cores testadas                        |
| Focus Visible  | Ring de 2px      | `focus-visible:ring-2 focus-visible:ring-ring` |
| Reduced Motion | Respeitar pref.  | `@media (prefers-reduced-motion)`              |
| Semantic HTML  | Tags corretas    | `<nav>`, `<main>`, `<section>`, `<h1-h6>`      |
| ARIA Labels    | Interativos      | `aria-label`, `aria-expanded`, `aria-current`  |
| Form Labels    | Todos inputs     | `<label htmlFor>`                              |
| Alt Text       | Todas imagens    | `alt` descritivo                               |
| Keyboard Nav   | Tab order logico | `tabindex` quando necessario                   |

---

## 16. Stack Tecnica

### Core

| Dependencia                | Versao    | Funcao                                                         |
| -------------------------- | --------- | -------------------------------------------------------------- |
| React                      | 18.3.x    | UI Framework                                                   |
| TypeScript                 | 5.x       | Type safety                                                    |
| Vite                       | 7.x (SWC) | Build tool                                                     |
| Tailwind CSS               | 3.4.x     | Utility CSS                                                    |
| SCSS (sass)                | devDep    | Tokens, mixins, layers (module system: `@use`/`meta.load-css`) |
| `class-variance-authority` | 0.7.x     | Variantes de componentes                                       |
| `clsx`                     | 2.1.x     | Class concatenation                                            |
| `tailwind-merge`           | 2.5.x     | Conflict resolution                                            |
| `next-themes`              | 0.3.x     | Dark mode                                                      |
| `lucide-react`             | 0.46x+    | Icones                                                         |
| `sonner`                   | 1.5.x     | Toast notifications                                            |

### Removido (v3.0)

| Pacote                     | Motivo                            |
| -------------------------- | --------------------------------- |
| `@radix-ui/react-slot`     | Substituido por `<button>` direto |
| `@radix-ui/react-toast`    | Substituido por Sonner            |
| `@radix-ui/react-label`    | Nao usado                         |
| `@radix-ui/react-tooltip`  | Nao usado                         |
| `components.json` (shadcn) | Removido — DS autoral             |

### Workarounds Conhecidos

| Issue                                             | Workaround                                                               | Referencia                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `fetchPriority` warning em `<img>` (React 18.3.1) | Usar `{...{ fetchpriority: "high" }}` ao inves de `fetchPriority="high"` | [React #28948](https://github.com/facebook/react/issues/28948) — corrigido no React 19 |

---

## 17. Regras de Contribuicao

### Proibido

- Adicionar HEX/RGB solto em componentes — usar tokens
- Criar componentes fora do design system (`src/design-system/`)
- Adicionar UI kits prontos (MUI, Ant, Chakra, shadcn, Radix)
- Mudar spacing, tipografia, cores, sombras, bordas, radii sem PR dedicado
- Importar de `@/components/ui/` (path antigo, removido)
- Usar `@import` em SCSS — usar `@use`/`meta.load-css()`
- Usar `fetchPriority` camelCase em JSX (usar spread workaround)

### Obrigatorio

- Importar componentes de `@/design-system`
- Usar `cn()` para merge de classes
- Min 44px em todos os touch targets
- `aria-label` em botoes/links com apenas icone
- Testar light + dark mode
- Testar mobile + desktop

### Checklist de PR

- [ ] Visual identico ao baseline (diff manual light + dark)
- [ ] `npm run build` passa sem erros ou warnings
- [ ] Nenhum HEX/RGB solto em componentes
- [ ] Componentes novos estao em `src/design-system/`
- [ ] Touch targets >= 44px
- [ ] Dark mode testado
- [ ] Mobile testado

---

## Changelog

### v3.1 (Fevereiro 2026)

- SCSS migrado de `@import` para `@use 'sass:meta'` + `meta.load-css()` (zero deprecation warnings)
- Fix `fetchPriority` React 18.3.1 warning em Hero.tsx e Cases.tsx (spread workaround)
- Fix deteccao de tema: script inline do `index.html` sincronizado com logica do `next-themes` (localStorage -> OS preference)
- Icones de servico e contato padronizados com gradiente accent (`from-accent to-accent-light`)
- Documentacao `docs/design-system.md` obsoleta (referencias a shadcn/Radix)

### v3.0 (Fevereiro 2026)

- Migracao completa de shadcn/UI + Radix para DS autoral
- Criacao de `src/design-system/` com componentes, primitives, form, utils
- Criacao de `src/styles/` com SCSS estruturado (tokens, base, mixins, components, utilities)
- Consolidacao de toast: Radix toast removido, Sonner unico
- Remocao de 4 pacotes @radix-ui, `components.json`, `src/components/ui/`, `src/lib/`, `src/hooks/`
- CSS reduzido de 50.70KB para 44.94KB; chunk `ui-vendor` eliminado

---

> **Elkys Design System v3.1** — DS autoral, zero UI kits
> Ultima atualizacao: Fevereiro 2026
