# Permissões e Controle de Acesso — Elkys Platform

## Roles

O sistema usa RBAC (Role-Based Access Control) com os seguintes roles definidos no enum `app_role`:

| Role          | Descrição                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `admin_super` | Super administrador. Acesso total a todas as telas e operações, incluindo exclusão permanente de clientes, projetos e membros da equipe.                           |
| `admin`       | Administrador. Acesso total a todas as telas e operações **exceto** exclusão permanente de registros. Pode criar e editar clientes, projetos, equipe e financeiro. |
| `marketing`   | Membro de marketing/design. Acesso restrito ao Calendário de Marketing e Documentos de Marketing & Design.                                                         |
| `developer`   | Desenvolvedor interno. Acesso restrito a Documentos de Desenvolvimento.                                                                                            |
| `support`     | Suporte. Acesso restrito à tela de Suporte.                                                                                                                        |
| `cliente`     | Cliente da Elkys. Acesso exclusivo ao Portal do Cliente.                                                                                                           |

---

## Matriz de Permissões — Portal Admin

### Acesso por Tela

| Tela        | Rota                                        | admin_super | admin | marketing | developer | support |
| ----------- | ------------------------------------------- | ----------- | ----- | --------- | --------- | ------- |
| Visão Geral | `/portal/admin`                             | ✅          | ✅    | ❌        | ❌        | ❌      |
| Clientes    | `/portal/admin/clientes`                    | ✅          | ✅    | ❌        | ❌        | ❌      |
| Projetos    | `/portal/admin/projetos`                    | ✅          | ✅    | ❌        | ❌        | ❌      |
| Financeiro  | `/portal/admin/financeiro`                  | ✅          | ✅    | ❌        | ❌        | ❌      |
| Equipe      | `/portal/admin/equipe`                      | ✅          | ✅    | ❌        | ❌        | ❌      |
| Suporte     | `/portal/admin/suporte`                     | ✅          | ✅    | ❌        | ❌        | ✅      |
| Calendário  | `/portal/admin/calendario`                  | ✅          | ✅    | ✅        | ❌        | ❌      |
| Docs M&D    | `/portal/admin/documentos/marketing-design` | ✅          | ✅    | ✅        | ❌        | ❌      |
| Docs Dev    | `/portal/admin/documentos/desenvolvedor`    | ✅          | ✅    | ❌        | ✅        | ❌      |
| Perfil      | `/portal/admin/perfil`                      | ✅          | ✅    | ✅        | ✅        | ✅      |

### Operações por Role

| Operação                     | admin_super | admin | marketing | developer | support |
| ---------------------------- | ----------- | ----- | --------- | --------- | ------- |
| Cadastrar cliente            | ✅          | ✅    | ❌        | ❌        | ❌      |
| Editar cliente               | ✅          | ✅    | ❌        | ❌        | ❌      |
| **Excluir cliente**          | ✅          | ❌    | ❌        | ❌        | ❌      |
| Cadastrar projeto            | ✅          | ✅    | ❌        | ❌        | ❌      |
| Editar projeto               | ✅          | ✅    | ❌        | ❌        | ❌      |
| **Excluir projeto**          | ✅          | ❌    | ❌        | ❌        | ❌      |
| Gerenciar financeiro         | ✅          | ✅    | ❌        | ❌        | ❌      |
| Cadastrar membro da equipe   | ✅          | ✅    | ❌        | ❌        | ❌      |
| Editar membro da equipe      | ✅          | ✅    | ❌        | ❌        | ❌      |
| **Excluir membro da equipe** | ✅          | ❌    | ❌        | ❌        | ❌      |
| Responder tickets            | ✅          | ✅    | ❌        | ❌        | ✅      |
| Gerenciar calendário         | ✅          | ✅    | ✅        | ❌        | ❌      |
| Gerenciar docs internos      | ✅          | ✅    | ✅ (M&D)  | ✅ (Dev)  | ❌      |

> **Regra principal:** `admin_super` e `admin` têm acesso **idêntico** a todas as telas. A única diferença é que **somente `admin_super` pode excluir** clientes, projetos e membros da equipe permanentemente.

---

## Rota Padrão por Role

Quando um usuário com role de equipe faz login, é redirecionado para:

| Role          | Rota Padrão                              |
| ------------- | ---------------------------------------- |
| `admin_super` | `/portal/admin`                          |
| `admin`       | `/portal/admin`                          |
| `marketing`   | `/portal/admin/calendario`               |
| `developer`   | `/portal/admin/documentos/desenvolvedor` |
| `support`     | `/portal/admin/suporte`                  |

Lógica em `src/lib/portal-access.ts` → `getDefaultAdminRoute(roles)`.

---

## Portal do Cliente

O portal do cliente é completamente separado do portal admin. Usuários com role `cliente` **nunca** têm acesso ao portal admin.

| Tela               | Rota                           | Acesso                             |
| ------------------ | ------------------------------ | ---------------------------------- |
| Visão Geral        | `/portal/cliente`              | Todos os clientes                  |
| Projetos           | `/portal/cliente/projetos`     | Todos os clientes                  |
| Detalhe do Projeto | `/portal/cliente/projetos/:id` | Apenas projetos do próprio cliente |
| Financeiro         | `/portal/cliente/financeiro`   | Cobranças do próprio cliente       |
| Suporte            | `/portal/cliente/suporte`      | Tickets do próprio cliente         |
| Perfil             | `/portal/cliente/perfil`       | Dados do próprio cliente           |

---

## Row Level Security (RLS)

As permissões são aplicadas em duas camadas: no frontend (guards de rota) e no banco de dados (RLS policies).

### Funções SQL de Apoio

```sql
-- Verifica role específico
has_role(user_id, role) → boolean

-- Verifica se é admin (admin_super OU admin)
is_admin(user_id) → boolean

-- Verifica se tem qualquer role de equipe
has_any_team_role(user_id) → boolean

-- Resolve client_id para o usuário logado
get_client_id_for_portal_user(user_id) → uuid
```

### Políticas por Tabela

| Tabela                  | Admin (all) | Equipe (read)     | Cliente (read próprio)                          |
| ----------------------- | ----------- | ----------------- | ----------------------------------------------- |
| `clients`               | ✅          | ❌                | ✅ (`user_id`)                                  |
| `team_members`          | ✅          | ✅                | ❌                                              |
| `projects`              | ✅          | ✅                | ✅ (`client_id`)                                |
| `project_contracts`     | ✅          | ✅                | ✅ (`client_id`)                                |
| `project_installments`  | ✅          | ✅                | ✅ (`client_id`)                                |
| `project_subscriptions` | ✅          | ✅                | ✅ (`client_id`)                                |
| `charges`               | ✅          | ✅                | ✅ (`client_id`)                                |
| `documents`             | ✅          | ✅                | ✅ (`client_id` + visibility ≠ `interno`)       |
| `support_tickets`       | ✅          | ✅                | ✅ (`client_id`)                                |
| `ticket_messages`       | ✅          | ✅                | ✅ (`ticket.client_id` + `is_internal = false`) |
| `project_next_steps`    | ✅          | ✅                | ✅ (`client_id` + `client_visible = true`)      |
| `timeline_events`       | ✅          | ✅                | ✅ (`client_id` + visibility ∈ `cliente,ambos`) |
| `expenses`              | ✅          | ❌                | ❌                                              |
| `audit_logs`            | ✅          | ✅                | ❌                                              |
| `automation_settings`   | ✅          | ✅                | ❌                                              |
| `internal_documents`    | ✅          | ✅ (por audience) | ❌                                              |
| `user_roles`            | ✅          | ❌                | Lê próprias roles                               |
| `profiles`              | ✅          | Lê próprio        | Lê próprio                                      |

---

## Implementação no Frontend

### Verificação de `isSuperAdmin`

Em cada página que possui operação de exclusão:

```typescript
const { roles } = useAuth();
const isSuperAdmin = roles.includes("admin_super");

// Renderização condicional do botão/ação de exclusão
canDelete = { isSuperAdmin };
```

### `PortalRoleGuard`

Componente wrapper que verifica os `allowedRoles` para uma rota:

```tsx
<PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
  <AdminClients />
</PortalRoleGuard>
```

Quando o usuário não possui nenhum dos roles permitidos, é redirecionado para `getDefaultAdminRoute(roles)`.

### Sidebar — Filtro de Navegação

O `AdminLayout` filtra os itens de navegação com base nos roles do usuário logado. Itens de cada seção têm um array `roles` que é intersectado com `user.roles` para determinar visibilidade.

```typescript
// Estrutura em ALL_NAV_SECTIONS (AdminLayout.tsx)
{
  label: "Clientes",
  href: "/portal/admin/clientes",
  roles: ["admin_super", "admin"],
  icon: UsersIcon,
}
```
