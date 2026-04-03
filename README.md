<p align="center">
  <img src="public/imgs/icons/lettering_elkys_purple.webp" alt="Elkys" width="160" />
</p>

<h1 align="center">Elkys — Plataforma Institucional & Portal do Cliente</h1>

<p align="center">
  Site institucional + plataforma B2B de gestão de clientes, projetos e financeiro da <strong>Elkys Software House</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React 18.3" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## Visão Geral

Este repositório contém o código-fonte completo da Elkys: o site institucional público **e** a plataforma B2B interna com dois portais autenticados:

- **Portal Admin** (`/portal/admin/*`) — painel interno para toda a equipe (admins, marketing, desenvolvedores, suporte)
- **Portal Cliente** (`/portal/cliente/*`) — área exclusiva de cada cliente para acompanhar projetos, financeiro e suporte

Ambos os portais são sustentados por **Supabase** (Postgres + Auth + Edge Functions + Storage) e utilizam um design system 100% autoral — sem shadcn, Radix, MUI ou Chakra.

**Produção:** [elkys.com.br](https://elkys.com.br)

---

## Stack

### Frontend

| Tecnologia                | Versão | Finalidade                                       |
| ------------------------- | ------ | ------------------------------------------------ |
| **React**                 | 18.3.x | Framework UI                                     |
| **TypeScript**            | 5.x    | Tipagem estática em todo o codebase              |
| **Vite** + SWC            | 7.x    | Build tool com HMR ultra-rápido                  |
| **Tailwind CSS**          | 3.4.x  | Utility-first CSS com design tokens customizados |
| **SCSS** (Dart Sass)      | —      | Tokens, mixins e arquitetura em `@layer`         |
| `react-router-dom`        | 6.x    | Roteamento SPA com lazy loading                  |
| `@tanstack/react-query`   | 5.x    | Server state, cache e refetch                    |
| `react-hook-form` + `zod` | —      | Formulários com validação tipada                 |
| `next-themes`             | —      | Dark mode via estratégia `class`                 |
| `sonner`                  | —      | Notificações toast                               |
| `vite-plugin-svgr`        | —      | SVGs como componentes React (tree-shakeable)     |

### Backend (Supabase)

| Componente                | Finalidade                                                     |
| ------------------------- | -------------------------------------------------------------- |
| **Postgres**              | Banco de dados relacional com RLS em todas as tabelas          |
| **Supabase Auth**         | Autenticação (email/senha); Admin API para criação de usuários |
| **Edge Functions** (Deno) | 12 funções serverless: CRUD de usuários, e-mails transacionais |
| **Storage**               | Avatares de perfil, assets de e-mail                           |
| **Cron** (pg_cron)        | Auto-marcação de cobranças em atraso, bloqueio de projetos     |

---

## Estrutura de Pastas

```
src/
├── assets/icons/           # Sistema de ícones SVGR proprietário (65+ ícones)
│   ├── svg/                # Arquivos SVG fonte
│   ├── create-icon.tsx     # HOC de ícones com a11y padronizada
│   └── index.ts            # Exports nomeados (tree-shakeable)
├── styles/                 # Tokens de design SCSS
│   ├── _tokens.scss        # Propriedades CSS customizadas (:root + .dark)
│   ├── _base.scss          # Reset tipográfico e estilos base
│   ├── _components.scss    # Classes CSS semânticas de componentes
│   └── _utilities.scss     # Gradientes, sombras, animações
├── design-system/          # Biblioteca de componentes React autoral
│   ├── components/         # Button (CVA), Card, Input, Textarea, AlertDialog, HexAvatar...
│   ├── primitives/         # Container, Section, Stack, Grid
│   ├── form/               # Label, Field, ErrorText
│   └── utils/              # cn() — clsx + tailwind-merge
├── components/
│   ├── portal/             # Layouts e guards: AdminLayout, ClientLayout, ProtectedRoute...
│   └── ...                 # Componentes do site público (Hero, Nav, Footer...)
├── contexts/
│   └── AuthContext.tsx     # Sessão, roles, inatividade (30 min), 2-min warning
├── pages/
│   ├── portal/
│   │   ├── admin/          # Overview, Clients, Projects, Finance, Team, Support...
│   │   └── client/         # Overview, Projects, Finance, Support, Profile...
│   └── ...                 # Páginas públicas
├── lib/
│   ├── portal.ts           # Type aliases e constantes de domínio
│   ├── portal-data.ts      # Helpers de leitura de dados do portal
│   ├── portal-access.ts    # Redirecionamento padrão por role
│   ├── subscription-charges.ts  # Geração de parcelas de mensalidades
│   ├── timeline.ts         # Helpers de eventos da timeline
│   └── profile.ts          # CRUD de perfil + upload de avatar
└── integrations/supabase/  # Cliente tipado + types gerados automaticamente
supabase/
├── functions/              # 12 Edge Functions Deno
│   └── _shared/            # auth.ts, email-template.ts (compartilhados)
└── migrations/             # 19 migrations SQL versionadas
```

---

## Primeiros Passos

### Pré-requisitos

- **Node.js** >= 18.16
- **npm** >= 9.5
- Projeto **Supabase** configurado (URL + chaves)

### Instalação

```bash
git clone https://github.com/elkys/client-hub-pro.git
cd client-hub-pro
npm install
```

### Variáveis de Ambiente

Crie `.env` na raiz:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

### Desenvolvimento

```bash
npm run dev     # Dev server em localhost:8080
```

---

## Scripts

| Comando                | Descrição                                         |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento com HMR               |
| `npm run build`        | Build de produção (esbuild) + sitemap + .htaccess |
| `npm run build:min`    | Build com Terser (remove console.\*, dead code)   |
| `npm run build:dev`    | Build modo desenvolvimento                        |
| `npm run format`       | Prettier — formata todos os arquivos `src/`       |
| `npm run format:check` | Verifica formatação sem alterar arquivos          |

---

## Portais

### Portal Admin (`/portal/admin`)

Acesso restrito a membros da equipe. Navegação e funcionalidades por role:

| Seção       | Rota                                        | Roles com Acesso              |
| ----------- | ------------------------------------------- | ----------------------------- |
| Visão Geral | `/portal/admin`                             | admin_super, admin            |
| Clientes    | `/portal/admin/clientes`                    | admin_super, admin            |
| Projetos    | `/portal/admin/projetos`                    | admin_super, admin            |
| Financeiro  | `/portal/admin/financeiro`                  | admin_super, admin            |
| Equipe      | `/portal/admin/equipe`                      | admin_super, admin            |
| Suporte     | `/portal/admin/suporte`                     | admin_super, admin, support   |
| Calendário  | `/portal/admin/calendario`                  | admin_super, admin, marketing |
| Docs M&D    | `/portal/admin/documentos/marketing-design` | admin_super, admin, marketing |
| Docs Dev    | `/portal/admin/documentos/desenvolvedor`    | admin_super, admin, developer |

### Portal Cliente (`/portal/cliente`)

| Seção       | Rota                         | Descrição                                      |
| ----------- | ---------------------------- | ---------------------------------------------- |
| Visão Geral | `/portal/cliente`            | Métricas resumidas, projetos ativos, cobranças |
| Projetos    | `/portal/cliente/projetos`   | Lista e detalhe de projetos                    |
| Financeiro  | `/portal/cliente/financeiro` | Extrato de cobranças e parcelas                |
| Suporte     | `/portal/cliente/suporte`    | Abertura e acompanhamento de tickets           |
| Perfil      | `/portal/cliente/perfil`     | Dados pessoais e foto de avatar                |

---

## Fluxo de Autenticação

```
Login → AuthProvider (carrega roles) → ProtectedRoute (role check)
  → MustChangePasswordGuard (primeiro acesso?)
    → PortalRoleGuard (acesso à rota específica)
      → Página
```

- Timeout de inatividade: **30 minutos** com aviso 2 minutos antes
- Primeiro acesso: flag `must_change_password` força troca de senha antes de entrar no portal
- Roles armazenadas na tabela `user_roles` (nunca em JWT claims diretos)

---

## Edge Functions

12 funções serverless Deno deployadas no Supabase:

| Função                  | Trigger       | Finalidade                                            |
| ----------------------- | ------------- | ----------------------------------------------------- |
| `create-user`           | Admin         | Cria usuário via Auth Admin API                       |
| `delete-user`           | Admin         | Remove usuário do Auth                                |
| `update-user`           | Admin         | Sincroniza email/nome no Auth + `profiles`            |
| `complete-first-access` | Cliente/Team  | Limpa flag `must_change_password`                     |
| `send-client-welcome`   | Admin         | E-mail de boas-vindas ao cliente com senha temporária |
| `send-team-welcome`     | Admin         | E-mail de boas-vindas ao membro da equipe             |
| `send-password-reset`   | Admin         | E-mail de recuperação de senha                        |
| `send-ticket-opened`    | Cliente       | Notifica equipe sobre novo ticket                     |
| `send-ticket-updated`   | Admin         | Notifica cliente sobre atualização de ticket          |
| `send-invoice-due`      | Cron (9h UTC) | Lembrete de vencimento para clientes                  |
| `send-installment-paid` | Admin         | Confirmação de pagamento de parcela                   |
| `send-document-added`   | Admin         | Notifica cliente sobre novo documento                 |

---

## Banco de Dados

Principais tabelas (todas com RLS habilitado):

| Tabela                  | Descrição                                          |
| ----------------------- | -------------------------------------------------- |
| `profiles`              | Dados de identidade de todos os usuários           |
| `user_roles`            | Roles RBAC (app_role enum)                         |
| `clients`               | Clientes cadastrados                               |
| `team_members`          | Membros da equipe interna                          |
| `projects`              | Projetos vinculados a clientes                     |
| `project_contracts`     | Contratos por projeto                              |
| `project_installments`  | Parcelas de contrato (entrada/entrega)             |
| `project_subscriptions` | Mensalidades recorrentes                           |
| `charges`               | Cobranças geradas (parcelas, mensalidades, manual) |
| `documents`             | Documentos vinculados a clientes/projetos          |
| `support_tickets`       | Tickets de suporte                                 |
| `timeline_events`       | Histórico de eventos por projeto                   |

Ver [`docs/DATABASE.md`](docs/DATABASE.md) para o schema completo com colunas, indexes e FKs.

---

## Documentação

| Arquivo                                            | Conteúdo                                                 |
| -------------------------------------------------- | -------------------------------------------------------- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)     | Arquitetura técnica, roteamento, estado, data layer      |
| [`docs/DATABASE.md`](docs/DATABASE.md)             | Schema completo: tabelas, colunas, enums, FKs, RLS       |
| [`docs/EDGE-FUNCTIONS.md`](docs/EDGE-FUNCTIONS.md) | Todas as Edge Functions: payload, comportamento, secrets |
| [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md)       | Matriz RBAC completa por role e por tela                 |
| [`docs/elkys_design_system_*.md`](docs/)           | Especificação completa do design system                  |

---

## Deploy

O projeto é deployado na **Hostinger** (hospedagem compartilhada via FTP):

```bash
npm run build:min          # Build otimizado para produção
# Upload da pasta dist/ via FTP
# O .htaccess cuida do roteamento client-side do React Router
```

Edge Functions e banco de dados são gerenciados pelo Supabase Cloud.

---

## Licença

Licença **MIT** — veja [LICENSE](LICENSE) para detalhes.

Ícones SVG em `src/assets/icons/svg/` são derivados do [Lucide](https://lucide.dev) sob [Licença ISC](src/assets/icons/LICENSE).

---

<p align="center">
  <strong>Elkys Software House</strong><br />
  Engenharia de software para empresas que exigem confiabilidade.
</p>
