<p align="center">
  <img src="public/imgs/icons/lettering_elkys_purple.webp" alt="Elkys" width="160" />
</p>

<h1 align="center">Elkys — Site Oficial</h1>

<p align="center">
  Site institucional e portfólio digital da <strong>Elkys Software House</strong>.<br />
  Engenharia de software sob demanda para empresas que superaram soluções prontas.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React 18.3" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Licença-MIT-472680" alt="Licença MIT" />
</p>

---

## Sobre

Este repositório contém o código-fonte do site oficial da Elkys — um site institucional de alta performance, otimizado para SEO, acessível (WCAG AA) e construído com um design system 100% autoral. Nenhum kit de UI de terceiros (shadcn, Radix, MUI, Chakra) é utilizado; cada componente é desenvolvido internamente.

**Produção:** [elkys.com.br](https://elkys.com.br)

---

## Stack Tecnológica

### Core

| Tecnologia           | Versão | Finalidade                                                                     |
| -------------------- | ------ | ------------------------------------------------------------------------------ |
| **React**            | 18.3.x | Framework UI com arquitetura baseada em componentes                            |
| **TypeScript**       | 5.x    | Tipagem estática em todo o codebase                                            |
| **Vite**             | 7.x    | Build tool com compilador SWC para HMR rápido e builds de produção otimizados  |
| **Tailwind CSS**     | 3.4.x  | Framework CSS utility-first com design tokens customizados                     |
| **SCSS** (Dart Sass) | —      | Tokens de design, mixins e arquitetura em camadas via `@use`/`meta.load-css()` |

### Design System

| Biblioteca                 | Finalidade                                                                 |
| -------------------------- | -------------------------------------------------------------------------- |
| `class-variance-authority` | Definição de variantes de componentes com type-safety (Button, Card, etc.) |
| `clsx` + `tailwind-merge`  | Concatenação condicional de classes com resolução de conflitos do Tailwind |
| `next-themes`              | Suporte a dark mode com estratégia `class` e detecção de preferência       |
| `sonner`                   | Sistema de notificações toast leve                                         |
| `vite-plugin-svgr`         | SVGs importados como componentes React (sistema de ícones tree-shakeable)  |

### Formulários e Dados

| Biblioteca            | Finalidade                                                     |
| --------------------- | -------------------------------------------------------------- |
| `react-hook-form`     | Gerenciamento performático de estado de formulários            |
| `zod`                 | Validação baseada em schema com inferência de tipos TypeScript |
| `@hookform/resolvers` | Ponte entre react-hook-form e schemas zod                      |
| `@emailjs/browser`    | Envio de e-mail client-side (formulário de contato)            |

### SEO e Roteamento

| Biblioteca           | Finalidade                                                     |
| -------------------- | -------------------------------------------------------------- |
| `react-router-dom`   | Roteamento client-side com code splitting                      |
| `react-helmet-async` | Meta tags dinâmicas, Open Graph e dados estruturados (JSON-LD) |

### Build e Qualidade

| Ferramenta                     | Finalidade                                             |
| ------------------------------ | ------------------------------------------------------ |
| `eslint` + `typescript-eslint` | Análise estática e garantia de qualidade do código     |
| `prettier`                     | Formatação de código padronizada                       |
| `husky` + `lint-staged`        | Hooks de pre-commit para lint e formatação automáticos |
| `terser`                       | Minificação avançada de JavaScript (modo `build:min`)  |
| `rollup-plugin-visualizer`     | Análise e visualização do tamanho do bundle            |
| `sharp`                        | Processamento e otimização de imagens                  |

---

## Arquitetura

```
src/
├── assets/icons/          # Sistema de ícones SVGR proprietário (36 ícones)
│   ├── svg/               # Arquivos SVG fonte
│   ├── create-icon.tsx    # HOC de ícones com a11y padronizada
│   └── index.ts           # Exports nomeados (tree-shakeable)
├── styles/                # Tokens de design SCSS e utilitários
│   ├── _tokens.scss       # Propriedades CSS customizadas (:root + .dark)
│   ├── _base.scss         # Reset tipográfico e estilos base
│   ├── _mixins.scss       # Mixins SCSS reutilizáveis
│   ├── _components.scss   # Classes CSS semânticas
│   └── _utilities.scss    # Gradientes, sombras, animações
├── design-system/         # Biblioteca de componentes React autoral
│   ├── components/        # Button, Card, Input, Textarea, Toast, HexPattern, HexRating
│   ├── primitives/        # Container, Section, Stack, Grid
│   ├── form/              # Label, Field, ErrorText
│   └── utils/             # cn() — clsx + tailwind-merge
├── data/                  # Dados centralizados (serviços)
├── components/            # Componentes de negócio (Hero, Nav, Footer...)
├── pages/                 # Componentes de página por rota
├── config/                # Configurações de serviços (EmailJS)
└── constants/             # Constantes da aplicação
```

### Decisões Arquiteturais

- **Tokens-first:** Todas as cores, espaçamentos, sombras e raios definidos como propriedades CSS customizadas em HSL — consumidos pelo Tailwind via `hsl(var(--token))`
- **Zero bundle de ícones:** Ícones são SVGs individuais compilados em build time via SVGR, com tree-shaking completo
- **Sistema de módulos SCSS:** Usa Dart Sass `@use`/`meta.load-css()` dentro de blocos `@layer` — zero warnings de `@import` depreciado
- **Padrão CVA:** Variantes de componentes definidas com `class-variance-authority` para estilização tipada e composável
- **Mobile-first responsivo:** Breakpoint customizado `xs: 475px` adicionado aos defaults do Tailwind

---

## Práticas de Engenharia

### Qualidade de Código

- **TypeScript strict mode** em todo o codebase com path aliases (`@/*`)
- **ESLint** com `typescript-eslint` e plugin React Hooks para análise estática
- **Prettier** para formatação consistente (forçado via hooks de pre-commit)
- **Husky + lint-staged** roda linting e formatação em cada commit automaticamente

### Performance

- **Code splitting** via React Router lazy loading — cada página é um chunk separado
- **Estratégia de chunks manuais:** `react-vendor` e `form-vendor` extraídos para cache otimizado
- **Otimização de imagens:** Formato WebP, `srcSet` responsivo, lazy loading abaixo do fold, `fetchpriority="high"` para assets do hero
- **Otimização de fontes:** Poppins self-hosted (woff2, 4 pesos) com `font-display: swap`
- **Animações GPU-optimized:** `will-change-transform` apenas em elementos animados, durações reduzidas no mobile, `prefers-reduced-motion` respeitado
- **Dois modos de build:** `build` (esbuild, rápido) e `build:min` (Terser 2-pass, remoção de console, minificação agressiva)

### Acessibilidade (WCAG AA)

- Alvos de toque mínimos de 44x44px em todos os elementos interativos
- Contraste de cores testado e verificado para todos os pares
- `focus-visible` ring em todos os elementos focáveis
- `prefers-reduced-motion` desabilita todas as animações
- HTML semântico (`<nav>`, `<main>`, `<section>`, `<h1-h6>`)
- Atributos ARIA em elementos interativos (`aria-label`, `aria-expanded`, `aria-current`)
- Sistema de ícones: decorativo por padrão (`aria-hidden`), acessível quando prop `title` é fornecida

### SEO

- Meta tags renderizadas via `react-helmet-async`
- Dados estruturados JSON-LD (Organization, BreadcrumbList, CollectionPage, Service)
- `sitemap.xml` gerado automaticamente a cada build
- URLs canônicas em todas as páginas
- Meta tags Open Graph e redes sociais

---

## Primeiros Passos

### Pré-requisitos

- **Node.js** >= 18.16.1
- **npm** >= 9.5.1

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/elkys/WebSiteOficial.git

# Entrar no diretório do projeto
cd WebSiteOficial

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:8080`.

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_EMAILJS_SERVICE_ID=seu_service_id
VITE_EMAILJS_TEMPLATE_ID=seu_template_id
VITE_EMAILJS_PUBLIC_KEY=sua_public_key
VITE_GA_ID=seu_google_analytics_id
```

---

## Scripts

| Comando                    | Descrição                                                 |
| -------------------------- | --------------------------------------------------------- |
| `npm run dev`              | Servidor de desenvolvimento com HMR                       |
| `npm run build`            | Build de produção (esbuild) + sitemap + .htaccess         |
| `npm run build:min`        | Build com minificação Terser (remoção de console, 2-pass) |
| `npm run build:dev`        | Build modo dev para testes locais                         |
| `npm run preview`          | Preview do build de produção localmente                   |
| `npm run format`           | Formatar todos os arquivos com Prettier                   |
| `npm run format:check`     | Verificar formatação sem modificar arquivos               |
| `npm run generate-sitemap` | Gerar `sitemap.xml` standalone                            |

---

## Modos de Build

| Modo        | Minificador     | Remoção de Console | Caso de Uso              |
| ----------- | --------------- | ------------------ | ------------------------ |
| `build`     | esbuild         | Não                | Iteração rápida, staging |
| `build:min` | Terser (2-pass) | Sim                | Deploy em produção       |
| `build:dev` | Nenhum (dev)    | Não                | Builds de debug          |

Todos os builds geram automaticamente `sitemap.xml` e copiam `.htaccess` para `dist/`.

---

## Deploy

O projeto está configurado para deploy na **Hostinger** (hospedagem compartilhada via FTP).

```bash
# 1. Build para produção
npm run build:min

# 2. Upload da pasta dist/ para o servidor
# O .htaccess cuida do roteamento client-side do React Router
```

---

## Páginas

| Rota                | Página                  | Descrição                                                         |
| ------------------- | ----------------------- | ----------------------------------------------------------------- |
| `/`                 | Homepage                | Hero, Sobre, Serviços, Clientes, Depoimentos, Formulário, Contato |
| `/servicos/:slug`   | Detalhe do Serviço      | Página dedicada para cada serviço com overview, benefícios e CTA  |
| `/cases`            | Portfólio               | Showcase de projetos com preview de vídeo e lazy loading          |
| `/privacy-policy`   | Política de Privacidade | Política de privacidade conforme LGPD                             |
| `/terms-of-service` | Termos de Uso           | Termos e condições de uso                                         |
| `/cookie-policy`    | Política de Cookies     | Política de uso de cookies                                        |
| `*`                 | 404                     | Página customizada de não encontrado                              |

---

## Documentação

| Documento                                | Descrição                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| [`docs/elkys_design_system_*.md`](docs/) | Especificação completa do design system (cores, tipografia, componentes, tokens, a11y) |

---

## Licença

Este projeto está licenciado sob a **Licença MIT** — veja o arquivo [LICENSE](LICENSE) para detalhes.

Os arquivos SVG de ícones em `src/assets/icons/svg/` são derivados do [Lucide](https://lucide.dev) e licenciados sob a [Licença ISC](src/assets/icons/LICENSE).

---

<p align="center">
  <strong>Elkys Software House</strong><br />
  Engenharia de software para empresas que exigem confiabilidade.
</p>
