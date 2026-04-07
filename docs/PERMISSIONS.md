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

| Tela                  | Rota                                        | admin_super | admin | marketing | developer | support |
| --------------------- | ------------------------------------------- | ----------- | ----- | --------- | --------- | ------- |
| Visão Geral           | `/portal/admin`                             | ✅          | ✅    | ❌        | ❌        | ❌      |
| **Clientes & Vendas** |                                             |             |       |           |           |         |
| Clientes              | `/portal/admin/clientes`                    | ✅          | ✅    | ❌        | ❌        | ❌      |
| Leads (CRM)           | `/portal/admin/leads`                       | ✅          | ✅    | ❌        | ❌        | ❌      |
| Propostas             | `/portal/admin/propostas`                   | ✅          | ✅    | ❌        | ❌        | ❌      |
| Pipeline              | `/portal/admin/pipeline`                    | ✅          | ✅    | ❌        | ❌        | ❌      |
| Suporte               | `/portal/admin/suporte`                     | ✅          | ✅    | ❌        | ❌        | ✅      |
| **Projetos**          |                                             |             |       |           |           |         |
| Projetos              | `/portal/admin/projetos`                    | ✅          | ✅    | ❌        | ❌        | ❌      |
| **Financeiro**        |                                             |             |       |           |           |         |
| Receitas & Despesas   | `/portal/admin/financeiro`                  | ✅          | ✅    | ❌        | ❌        | ❌      |
| Inadimplencia         | `/portal/admin/inadimplencia`               | ✅          | ✅    | ❌        | ❌        | ❌      |
| Receita/Cliente       | `/portal/admin/receita-clientes`            | ✅          | ✅    | ❌        | ❌        | ❌      |
| Metas Financeiras     | `/portal/admin/metas`                       | ✅          | ✅    | ❌        | ❌        | ❌      |
| Regua de Cobranca     | `/portal/admin/cobranca-automatica`         | ✅          | ✅    | ❌        | ❌        | ❌      |
| **Equipe**            |                                             |             |       |           |           |         |
| Membros               | `/portal/admin/equipe`                      | ✅          | ✅    | ❌        | ❌        | ❌      |
| Notificacoes          | `/portal/admin/notificacoes`                | ✅          | ✅    | ❌        | ❌        | ❌      |
| **Marketing**         |                                             |             |       |           |           |         |
| Calendario            | `/portal/admin/calendario`                  | ✅          | ✅    | ✅        | ❌        | ❌      |
| Docs M&D              | `/portal/admin/documentos/marketing-design` | ✅          | ✅    | ✅        | ❌        | ❌      |
| **Sistema**           |                                             |             |       |           |           |         |
| Auditoria             | `/portal/admin/audit-log`                   | ✅          | ✅    | ❌        | ❌        | ❌      |
| Docs Dev              | `/portal/admin/documentos/desenvolvedor`    | ✅          | ✅    | ❌        | ✅        | ❌      |
| Perfil                | `/portal/admin/perfil`                      | ✅          | ✅    | ✅        | ✅        | ✅      |

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
| Gerenciar leads (CRM)        | ✅          | ✅    | ❌        | ❌        | ❌      |
| Gerenciar propostas          | ✅          | ✅    | ❌        | ❌        | ❌      |
| Gerenciar regua de cobranca  | ✅          | ✅    | ❌        | ❌        | ❌      |
| Definir metas financeiras    | ✅          | ✅    | ❌        | ❌        | ❌      |
| Visualizar auditoria         | ✅          | ✅    | ❌        | ❌        | ❌      |
| Cadastrar membro da equipe   | ✅          | ✅    | ❌        | ❌        | ❌      |
| Editar membro da equipe      | ✅          | ✅    | ❌        | ❌        | ❌      |
| **Excluir membro da equipe** | ✅          | ❌    | ❌        | ❌        | ❌      |
| Responder tickets            | ✅          | ✅    | ❌        | ❌        | ✅      |
| Gerenciar calendario         | ✅          | ✅    | ✅        | ❌        | ❌      |
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

| Tela               | Rota                            | Acesso                                           |
| ------------------ | ------------------------------- | ------------------------------------------------ |
| Visão Geral        | `/portal/cliente`               | Todos os clientes                                |
| Propostas          | `/portal/cliente/propostas`     | Propostas do proprio cliente (status ≠ rascunho) |
| Detalhe Proposta   | `/portal/cliente/propostas/:id` | Pode aprovar/rejeitar quando status = enviada    |
| Projetos           | `/portal/cliente/projetos`      | Todos os clientes                                |
| Detalhe do Projeto | `/portal/cliente/projetos/:id`  | Apenas projetos do proprio cliente               |
| Financeiro         | `/portal/cliente/financeiro`    | Cobrancas do proprio cliente                     |
| Suporte            | `/portal/cliente/suporte`       | Tickets do proprio cliente                       |
| Perfil             | `/portal/cliente/perfil`        | Dados do proprio cliente                         |

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

| Tabela                  | Admin (all) | Equipe (read)     | Cliente (read proprio)                                  |
| ----------------------- | ----------- | ----------------- | ------------------------------------------------------- |
| `clients`               | ✅          | ❌                | ✅ (`user_id`)                                          |
| `team_members`          | ✅          | ✅                | ❌                                                      |
| `projects`              | ✅          | ✅                | ✅ (`client_id`)                                        |
| `project_contracts`     | ✅          | ✅                | ✅ (`client_id`)                                        |
| `project_installments`  | ✅          | ✅                | ✅ (`client_id`)                                        |
| `project_subscriptions` | ✅          | ✅                | ✅ (`client_id`)                                        |
| `charges`               | ✅          | ✅                | ✅ (`client_id`)                                        |
| `documents`             | ✅          | ✅                | ✅ (`client_id` + visibility ≠ `interno`)               |
| `support_tickets`       | ✅          | ✅                | ✅ (`client_id`)                                        |
| `ticket_messages`       | ✅          | ✅                | ✅ (`ticket.client_id` + `is_internal = false`)         |
| `project_next_steps`    | ✅          | ✅                | ✅ (`client_id` + `client_visible = true`)              |
| `timeline_events`       | ✅          | ✅                | ✅ (`client_id` + visibility ∈ `cliente,ambos`)         |
| `leads`                 | ✅          | ❌                | ❌                                                      |
| `lead_interactions`     | ✅          | ❌                | ❌                                                      |
| `proposals`             | ✅          | ❌                | ✅ (read: status ≠ rascunho + update: aprovar/rejeitar) |
| `billing_templates`     | ✅          | ❌                | ❌                                                      |
| `billing_rules`         | ✅          | ❌                | ❌                                                      |
| `billing_actions_log`   | ✅          | ❌                | ❌                                                      |
| `financial_goals`       | ✅          | ❌                | ❌                                                      |
| `expenses`              | ✅          | ❌                | ❌                                                      |
| `audit_logs`            | ✅          | ✅                | ❌                                                      |
| `automation_settings`   | ✅          | ✅                | ❌                                                      |
| `internal_documents`    | ✅          | ✅ (por audience) | ❌                                                      |
| `user_roles`            | ✅          | ❌                | Le proprias roles                                       |
| `profiles`              | ✅          | Le proprio        | Le proprio                                              |

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
