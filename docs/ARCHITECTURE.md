# Arquitetura Técnica — Elkys Platform

## Visão Geral

Aplicação React 18 SPA com dois portais autenticados e um site público, servida como bundle estático (Hostinger) com backend serverless (Supabase Cloud).

```
┌─────────────────────────────────────────────┐
│              Browser (React SPA)             │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Site Público│  │   Portais Autenticados│  │
│  │  (marketing) │  │  Admin + Cliente     │  │
│  └─────────────┘  └──────────────────────┘  │
└──────────────────────┬──────────────────────┘
                       │ HTTPS
        ┌──────────────▼──────────────┐
        │        Supabase Cloud        │
        │  ┌──────────┐ ┌──────────┐  │
        │  │ Postgres │ │   Auth   │  │
        │  │  + RLS   │ │  Admin   │  │
        │  └──────────┘ └──────────┘  │
        │  ┌──────────┐ ┌──────────┐  │
        │  │  Storage │ │  Edge    │  │
        │  │ (avatars)│ │Functions │  │
        │  └──────────┘ └──────────┘  │
        └─────────────────────────────┘
```

---

## Roteamento

Definido em `src/App.tsx` com React Router 6 e lazy loading em todos os componentes de página.

### Árvore de Rotas

```
/                           → Index (site público)
/cases                      → Cases
/servicos/:slug             → ServiceDetail
/como-trabalhamos           → ComoTrabalhamos
/login                      → Login
/forgot-password            → ForgotPassword
/terms-of-service           → TermsOfService
/privacy-policy             → PrivacyPolicy
/cookie-policy              → CookiePolicy

/portal/cliente/alterar-senha   → ChangePassword (ProtectedRoute: cliente)
/portal/admin/alterar-senha     → AdminChangePassword (ProtectedRoute: admin)

/portal/admin               → AdminLayout (ProtectedRoute: admin + MustChangePasswordGuardAdmin)
  index                     → AdminPortalHome          [admin_super, admin]
  calendario                → AdminMarketingCalendar   [admin_super, admin, marketing]
  documentos/marketing-design → AdminInternalDocuments  [admin_super, admin, marketing]
  documentos/desenvolvedor  → AdminInternalDocuments   [admin_super, admin, developer]
  clientes                  → AdminClients             [admin_super, admin]
  clientes/novo             → AdminClientCreate        [admin_super, admin]
  clientes/:id              → AdminClientDetail        [admin_super, admin]
  projetos                  → AdminProjects            [admin_super, admin]
  projetos/novo             → AdminProjectCreate       [admin_super, admin]
  projetos/:id              → AdminProjectDetail       [admin_super, admin]
  financeiro                → AdminFinance             [admin_super, admin]
  financeiro/nova-despesa   → AdminExpenseCreate       [admin_super, admin]
  equipe                    → AdminTeam                [admin_super, admin]
  equipe/novo               → AdminTeamCreate          [admin_super, admin]
  suporte                   → AdminSupport             [admin_super, admin, support]
  perfil                    → AdminProfile             (qualquer admin autenticado)

/portal/cliente             → ClientLayout (ProtectedRoute: cliente + MustChangePasswordGuard)
  index                     → ClientOverview
  projetos                  → ClientProjects
  projetos/:id              → ClientProjectDetail
  financeiro                → ClientFinance
  suporte                   → ClientSupport
  perfil                    → ClientProfile
```

### Guards de Autenticação

| Guard                          | Arquivo                                                   | Função                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProtectedRoute`               | `components/portal/auth/ProtectedRoute.tsx`               | Verifica se o usuário está autenticado e tem o role base correto (`admin` ou `cliente`). Redireciona para `/login` se não autenticado.          |
| `MustChangePasswordGuard`      | `components/portal/auth/MustChangePasswordGuard.tsx`      | Redireciona para `/portal/cliente/alterar-senha` se `must_change_password = true` na tabela `clients`.                                          |
| `MustChangePasswordGuardAdmin` | `components/portal/auth/MustChangePasswordGuardAdmin.tsx` | Mesmo comportamento para membros da equipe (`team_members`).                                                                                    |
| `PortalRoleGuard`              | `components/portal/auth/PortalRoleGuard.tsx`              | Verifica se o usuário possui um dos `allowedRoles` para a rota específica. Redireciona para a rota padrão do role via `getDefaultAdminRoute()`. |

### Componentes do Portal — Estrutura por dominio

```
src/components/portal/
  admin/           — Layout, EmptyState, MetricCard, NotificationBell, PageHeader, PortalHome
  client/          — ClientLayout, ClientRowIndicators
  auth/            — ProtectedRoute, PortalRoleGuard, MustChangePasswordGuard(Admin)
  project/         — AcceptanceCard, OnboardingChecklist, SiteLink, StageJourney,
                     StageProgressDots, SupportCard, TimelineFeed, ValidationRounds
  contract/        — ActionsButtons, AcceptanceStatusCard, VersionHistory, AddLinkForm
  proposal/        — ExpiryCountdown, RejectModal
  notification/    — NotificationBell (cliente)
  shared/          — StatusBadge, Pagination, Breadcrumbs, Loading, ErrorBoundary,
                     CollapsibleSection, ExportMenu, MetricTile, NameAvatar,
                     RecurringBadge, RelativeDate, RowActionMenu, SurfaceStat,
                     ContactLinks, ProfilePage
```

Cada subdiretorio agrupa componentes do mesmo dominio de negocio. Imports usam
o caminho completo: `@/components/portal/project/ProjectAcceptanceCard`.

---

## Autenticação e Sessão

### AuthContext (`src/contexts/AuthContext.tsx`)

O contexto central de autenticação. Expõe:

```typescript
interface AuthContextType {
  user: User | null;
  roles: AppRole[];
  isLoading: boolean;
  signIn(email, password): Promise<...>
  signOut(): Promise<void>
  refreshRoles(): Promise<void>
}

type AppRole = 'admin_super' | 'admin' | 'cliente' | 'marketing' | 'developer' | 'support';
```

**Fluxo de inicialização:**

1. `supabase.auth.getSession()` na montagem
2. Carrega roles da tabela `user_roles` via query separada
3. Inscreve em `supabase.auth.onAuthStateChange` para manter sessão sincronizada

**Timeout de inatividade:**

- 30 minutos sem atividade → signOut automático
- Aviso de 2 minutos antes do logout
- Eventos rastreados: `mousemove`, `keydown`, `click`, `scroll`

### Redirecionamento por Role

`src/lib/portal-access.ts` → `getDefaultAdminRoute(roles)`:

```
admin_super / admin  → /portal/admin
marketing            → /portal/admin/calendario
developer            → /portal/admin/documentos/desenvolvedor
support              → /portal/admin/suporte
```

---

## Design System

100% autoral, sem bibliotecas UI de terceiros. Barrel-exportado de `@/design-system`.

### Tokens (`src/styles/_tokens.scss`)

CSS custom properties com prefixo `--elk-`, em formato HSL. Variantes light e dark via `.dark` class.

```scss
:root {
  --elk-primary: 258 53% 46%; /* roxo Elkys */
  --elk-background: 0 0% 100%;
  --elk-foreground: 240 10% 10%;
  /* ... */
}
.dark {
  --elk-background: 240 10% 8%;
  /* ... */
}
```

Consumidos pelo Tailwind via `hsl(var(--elk-...))` no `tailwind.config.ts`.

### Componentes

| Componente    | Variantes CVA                                                     | Notas                                       |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `Button`      | `default, destructive, outline, ghost, link` × `sm, md, lg, icon` | CVA + `cn()`                                |
| `Card`        | —                                                                 | Wrapper com border-radius e shadow de token |
| `Input`       | —                                                                 | Estilo unificado, suporte a erro            |
| `Textarea`    | —                                                                 | Mesma linguagem do Input                    |
| `AlertDialog` | `default, destructive`                                            | Confirmação modal com overlay               |
| `HexAvatar`   | —                                                                 | Avatar hexagonal com fallback de iniciais   |
| `HexPattern`  | —                                                                 | Padrão decorativo SVG de hexágonos          |
| `Toast`       | —                                                                 | Via Sonner, estilizado com tokens           |

### Primitivas de Layout

| Primitiva   | Descrição                              |
| ----------- | -------------------------------------- |
| `Container` | `max-w` + `px` responsivo              |
| `Section`   | `py` semântico por breakpoint          |
| `Stack`     | `flex-col` com gap controlado          |
| `Grid`      | `grid` com colunas e gap configuráveis |

---

## Sistema de Ícones

SVGs individuais em `src/assets/icons/svg/` importados como componentes React via SVGR.

`create-icon.tsx` é um HOC factory que:

- Adiciona `aria-hidden="true"` por padrão (decorativo)
- Aceita prop `title` para acessibilidade (`role="img"` + `<title>`)
- Suporta `className`, `size`, `color` como props

```typescript
// Uso
import { HomeIcon } from '@/assets/icons';
<HomeIcon size={20} className="text-primary" />
<HomeIcon title="Início" /> // acessível
```

---

## Data Layer

### TanStack Query

- Usado nas páginas de portal para todas as queries ao Supabase
- `queryClient` instanciado em `App.tsx` (singleton)
- Cache padrão: `staleTime: 0`, `refetchOnWindowFocus: true`

### Helpers de Portal

| Arquivo                           | Conteúdo                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/lib/portal.ts`               | Type aliases de domínio (`Client`, `Project`, `Charge`...) e constantes (`STATUS_LABELS`, etc.) |
| `src/lib/portal-data.ts`          | Funções de leitura de dados do portal (consultas compostas ao Supabase)                         |
| `src/lib/subscription-charges.ts` | `listSubscriptionDueDates()` — gera datas de vencimento de mensalidades                         |
| `src/lib/timeline.ts`             | Helpers para leitura e formatação de `timeline_events`                                          |
| `src/lib/profile.ts`              | CRUD de perfil de usuário + upload de avatar para Supabase Storage                              |

### Cliente Supabase

`src/integrations/supabase/client.ts` — exporta `supabase` com tipos gerados automaticamente de `types.ts`.

```typescript
import { supabase } from "@/integrations/supabase/client";
const { data } = await supabase.from("clients").select("*");
```

**Headers de autenticação para Edge Functions:**

```typescript
import { getSupabaseFunctionAuthHeaders } from "@/integrations/supabase/client";
// Retorna { Authorization: 'Bearer <session_token>' }
```

---

## Build

### Vite Config (`vite.config.ts`)

- **SWC** para compilação TypeScript (mais rápido que esbuild puro)
- **Path alias**: `@/` → `src/`
- **Manual chunks**: `react-vendor` e `form-vendor` para cache otimizado
- **SVGR**: todos os `.svg` como componentes React
- **Post-build**: geração automática de `sitemap.xml` + cópia de `.htaccess`

### Modos de Build

| Modo        | Minificador   | `console.*` | Uso                       |
| ----------- | ------------- | ----------- | ------------------------- |
| `build`     | esbuild       | Mantido     | Staging / iteração rápida |
| `build:min` | Terser 2-pass | Removido    | Deploy produção           |
| `build:dev` | Nenhum        | Mantido     | Debug local               |

---

## Qualidade e Convenções

- **TypeScript strict mode** em todo o codebase
- **ESLint** com `typescript-eslint` + plugin React Hooks
- **Prettier** formatação forçada via pre-commit (Husky + lint-staged)
- **Sem bibliotecas UI de terceiros** — cada componente é autoral
- **Português brasileiro** em todas as rotas, labels e conteúdo do portal
- **Lazy loading** em todas as páginas via `React.lazy()`
- **Sem testes automatizados** configurados no momento
