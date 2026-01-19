# Sistema de Design elkys

Este documento define o sistema de design consistente para o site da elkys, garantindo uniformidade visual e melhor manutenibilidade.

## Princípios Fundamentais

1. **Espaçamento Múltiplo de 4**: Todos os espaçamentos devem ser múltiplos de 4px (1 unit Tailwind = 4px)
2. **Responsividade Mobile-First**: Design adaptável começando pelo mobile
3. **Consistência de Breakpoints**: Usar breakpoints padronizados
4. **Acessibilidade**: Mínimo 44x44px para elementos tocáveis (AAA compliance)

## Sistema de Espaçamento

### Escala de Espaçamento (Múltiplos de 4px)

```
1  = 4px    space-1, p-1, m-1, gap-1
2  = 8px    space-2, p-2, m-2, gap-2
3  = 12px   space-3, p-3, m-3, gap-3
4  = 16px   space-4, p-4, m-4, gap-4
6  = 24px   space-6, p-6, m-6, gap-6
8  = 32px   space-8, p-8, m-8, gap-8
12 = 48px   space-12, p-12, m-12, gap-12
16 = 64px   space-16, p-16, m-16, gap-16
18 = 72px   space-18, p-18, m-18, gap-18 (custom)
20 = 80px   ❌ EVITAR - usar 16 (64px) ou 24 (96px)
22 = 88px   space-22, p-22, m-22, gap-22 (custom)
24 = 96px   space-24, p-24, m-24, gap-24
28 = 112px  space-28, p-28, m-28, gap-28 (custom)
32 = 128px  space-32, p-32, m-32, gap-32
```

### Uso Recomendado

**Padding de Seções:**

- Mobile: `py-12` (48px)
- Desktop: `md:py-16` (64px) ou `md:py-24` (96px)
- **Evitar:** `py-20` (80px) - usar `py-16` ou `py-24`

**Espaçamento Entre Elementos:**

- Pequeno: `space-y-2` (8px) ou `space-y-3` (12px)
- Médio: `space-y-4` (16px) ou `space-y-6` (24px)
- Grande: `space-y-8` (32px) ou `space-y-12` (48px)

**Gaps em Grid/Flex:**

- Mobile: `gap-4` (16px) ou `gap-6` (24px)
- Desktop: `md:gap-8` (32px) ou `md:gap-12` (48px)

## Breakpoints Responsivos

```
sm:   640px   - Telefones grandes / tablets pequenos
md:   768px   - Tablets
lg:   1024px  - Laptops / Desktops pequenos
xl:   1280px  - Desktops
2xl:  1536px  - Telas grandes
```

### Padrão de Uso

**Layout de Grid:**

```tsx
// 1 coluna mobile → 2 colunas tablet → 3 ou 4 colunas desktop
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

**Espaçamento Progressivo:**

```tsx
// Aumenta gradualmente com o tamanho da tela
gap-4 md:gap-6 lg:gap-8
py-12 md:py-16 lg:py-24
space-y-4 md:space-y-6 lg:space-y-8
```

**Tipografia:**

```tsx
// Escala de tamanho de texto
text-sm sm:text-base md:text-lg        // Parágrafo
text-2xl sm:text-3xl md:text-4xl       // Heading 2
text-3xl sm:text-4xl md:text-5xl       // Heading 1
```

## Componentes Base

### Button

**Tamanhos:**

- `size="sm"`: h-9 (36px) px-3 (12px)
- `size="default"`: h-10 (40px) px-4 (16px)
- `size="lg"`: h-11 (44px) px-8 (32px) - Acessibilidade AAA
- `size="icon"`: h-10 w-10 (40x40px)

**Variantes:**

- `default`: Primary color
- `gradient`: Gradient background
- `animated`: Com animações de hover
- `ghost`: Transparente com hover
- `outline`: Com borda

### Card

**Padding Padrão:**

- Mobile: `p-4` (16px) ou `p-6` (24px)
- Desktop: `md:p-6` (24px) ou `md:p-8` (32px)

**Espaçamento Interno:**

```tsx
<CardHeader className="pb-4 md:pb-6">
<CardContent className="space-y-4 md:space-y-6">
```

### Container

**Padding Lateral:**

- Mobile: `px-4` (16px)
- Configurado automaticamente no tailwind.config.ts

## Cores

### Brand Colors

```
Primary: Purple (#7C3AED - hsl(261 75% 45%))
Primary Light: #9F7AEA (hsl(261 70% 60%))
Primary Dark: #6D28D9 (hsl(261 90% 35%))

Accent: Orange (#D97706 - hsl(25 100% 42%))
Secondary: Blue (#3E5BA9 - hsl(227 53% 39%))
```

### Gradientes

```css
bg-gradient-primary  - Purple gradient (primary → primary-light)
bg-gradient-hero     - Hero gradient (secondary → primary)
bg-gradient-subtle   - Subtle background gradient
```

## Sombras

```css
shadow-elegant  - Sombra suave com tint primary
shadow-glow     - Sombra de brilho para hover
```

## Checklist de Implementação

Ao criar ou editar componentes:

- [ ] Todos os espaçamentos são múltiplos de 4px
- [ ] Elementos tocáveis têm mínimo 44x44px
- [ ] Responsividade implementada (mobile → desktop)
- [ ] Usa tokens de cor do tema (não hardcoded)
- [ ] Padding de seções: py-12 md:py-16 ou py-24
- [ ] Gap/Space progressivo: gap-4 md:gap-6 lg:gap-8
- [ ] Tipografia escalável: text-base md:text-lg
- [ ] Acessibilidade (aria-labels, contraste)
- [ ] Dark mode suportado via classes do tema

## Exemplos de Refatoração

### ❌ Antes

```tsx
<section className="py-20">
  <div className="container mx-auto px-4">
    <div className="mb-10 space-y-5">
      <h2 className="text-3xl">Título</h2>
    </div>
    <div className="grid md:grid-cols-2 gap-5">
```

### ✅ Depois

```tsx
<section className="py-12 md:py-16">
  <div className="container mx-auto px-4">
    <div className="mb-12 space-y-4 md:space-y-6">
      <h2 className="text-2xl md:text-3xl lg:text-4xl">Título</h2>
    </div>
    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
```

## Migração de Valores Antigos

```
py-20  →  py-16 ou py-24
mb-10  →  mb-8 ou mb-12
gap-5  →  gap-4 ou gap-6
py-5   →  py-4 ou py-6
space-y-5  →  space-y-4 ou space-y-6
```
