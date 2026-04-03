# Banco de Dados — Elkys Platform

Supabase (PostgreSQL 15). RLS habilitado em todas as tabelas. Schema: `public`.

---

## Enums

| Enum                          | Valores                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| `app_role`                    | `admin_super`, `admin`, `cliente`, `marketing`, `developer`, `support` |
| `project_status`              | `negociacao`, `em_andamento`, `pausado`, `concluido`, `cancelado`      |
| `billing_type`                | `mensal`, `projeto`                                                    |
| `invoice_status`              | `pendente`, `pago`, `atrasado`, `cancelado`                            |
| `document_type`               | `contrato`, `aditivo`, `nota_fiscal`, `codigo_fonte`, `outro`          |
| `project_pause_reason`        | `financeiro`, `dependencia_cliente`, `interno`, `escopo`, `outro`      |
| `pause_source`                | `automatico`, `manual`                                                 |
| `contract_record_status`      | `rascunho`, `ativo`, `encerrado`, `cancelado`                          |
| `payment_model`               | `50_50`                                                                |
| `project_installment_type`    | `entrada`, `entrega`                                                   |
| `project_installment_status`  | `agendada`, `pendente`, `paga`, `atrasada`, `cancelada`                |
| `project_installment_trigger` | `assinatura`, `conclusao`, `data_fixa`                                 |
| `subscription_status`         | `agendada`, `ativa`, `pausada`, `encerrada`                            |
| `document_visibility`         | `cliente`, `interno`, `ambos`                                          |
| `next_step_owner`             | `elkys`, `cliente`, `compartilhado`                                    |
| `next_step_status`            | `pendente`, `em_andamento`, `concluido`, `cancelado`                   |

---

## Tabelas

### `profiles`

Dados de identidade de todos os usuários (clientes e equipe). Criado automaticamente via trigger `on_auth_user_created` após cada signup.

| Coluna       | Tipo          | Notas                                      |
| ------------ | ------------- | ------------------------------------------ |
| `id`         | `uuid` PK     | FK → `auth.users(id)` ON DELETE CASCADE    |
| `full_name`  | `text`        | Sincronizado com `user_metadata.full_name` |
| `email`      | `text`        |                                            |
| `phone`      | `text`        | Nullable                                   |
| `avatar_url` | `text`        | Nullable; URL pública do Supabase Storage  |
| `is_active`  | `boolean`     | Default `true`                             |
| `created_at` | `timestamptz` |                                            |
| `updated_at` | `timestamptz` |                                            |

**RLS:** Usuário lê/edita próprio perfil. Admin lê todos.

---

### `user_roles`

Tabela de roles RBAC. Um usuário pode ter múltiplos roles (ex: `admin` + `marketing`).

| Coluna       | Tipo          | Notas                                   |
| ------------ | ------------- | --------------------------------------- |
| `id`         | `uuid` PK     |                                         |
| `user_id`    | `uuid`        | FK → `auth.users(id)` ON DELETE CASCADE |
| `role`       | `app_role`    | Default `cliente`                       |
| `created_at` | `timestamptz` |                                         |

**Unique:** `(user_id, role)` — sem duplicatas de role por usuário.

**RLS:** Admin gerencia tudo. Usuário lê apenas próprias roles.

---

### `clients`

Clientes da Elkys. Cada cliente tem um `user_id` que vincula ao Auth (para acesso ao portal).

| Coluna                 | Tipo            | Notas                                              |
| ---------------------- | --------------- | -------------------------------------------------- |
| `id`                   | `uuid` PK       |                                                    |
| `user_id`              | `uuid`          | FK → `auth.users(id)` ON DELETE SET NULL; nullable |
| `full_name`            | `text`          | Nome completo / razão social                       |
| `email`                | `text`          | Unique                                             |
| `cpf`                  | `text`          | Unique                                             |
| `cnpj`                 | `text`          | Nullable                                           |
| `phone`                | `text`          | Nullable                                           |
| `address`              | `text`          | Nullable                                           |
| `nome_fantasia`        | `text`          | Nullable                                           |
| `contract_status`      | `text`          | `ativo`, `inadimplente`, `encerrado`               |
| `monthly_value`        | `numeric(12,2)` | Valor de mensalidade (legado)                      |
| `project_total_value`  | `numeric(12,2)` | Valor total de projetos (legado)                   |
| `client_since`         | `date`          |                                                    |
| `must_change_password` | `boolean`       | Flag de primeiro acesso                            |
| `is_active`            | `boolean`       |                                                    |
| `created_at`           | `timestamptz`   |                                                    |
| `updated_at`           | `timestamptz`   |                                                    |

**RLS:** Admin gerencia tudo. Cliente lê apenas próprios dados.

**Cascade:** Deletar um `client` cascateia para `projects`, `charges`, `documents`, `support_tickets`, `project_subscriptions`, `project_next_steps`, `timeline_events`, `client_contacts`.

---

### `client_contacts`

Contatos adicionais de um cliente (ex: sócios, responsáveis financeiros). Um contato pode ter `auth_user_id` para acesso ao portal.

| Coluna                    | Tipo          | Notas                                              |
| ------------------------- | ------------- | -------------------------------------------------- |
| `id`                      | `uuid` PK     |                                                    |
| `client_id`               | `uuid`        | FK → `clients(id)` ON DELETE CASCADE               |
| `auth_user_id`            | `uuid`        | FK → `auth.users(id)` ON DELETE SET NULL; nullable |
| `full_name`               | `text`        |                                                    |
| `email`                   | `text`        |                                                    |
| `phone`                   | `text`        | Nullable                                           |
| `cpf`                     | `text`        | Nullable                                           |
| `role_label`              | `text`        | Ex: "Sócio", "Financeiro"                          |
| `is_primary`              | `boolean`     | Unique partial index: apenas 1 por cliente         |
| `is_legal_representative` | `boolean`     |                                                    |
| `receives_finance`        | `boolean`     | Default `true`                                     |
| `created_at`              | `timestamptz` |                                                    |
| `updated_at`              | `timestamptz` |                                                    |

---

### `team_members`

Membros internos da equipe Elkys.

| Coluna                 | Tipo          | Notas                                    |
| ---------------------- | ------------- | ---------------------------------------- |
| `id`                   | `uuid` PK     |                                          |
| `user_id`              | `uuid`        | FK → `auth.users(id)` ON DELETE SET NULL |
| `full_name`            | `text`        |                                          |
| `email`                | `text`        |                                          |
| `phone`                | `text`        | Nullable                                 |
| `role_title`           | `text`        | Título do cargo (ex: "Desenvolvedor")    |
| `must_change_password` | `boolean`     | Flag de primeiro acesso                  |
| `is_active`            | `boolean`     |                                          |
| `created_at`           | `timestamptz` |                                          |
| `updated_at`           | `timestamptz` |                                          |

**RLS:** Admin gerencia tudo. Membro lê próprios dados.

---

### `projects`

Projetos vinculados a clientes.

| Coluna                   | Tipo                   | Notas                                                      |
| ------------------------ | ---------------------- | ---------------------------------------------------------- |
| `id`                     | `uuid` PK              |                                                            |
| `client_id`              | `uuid`                 | FK → `clients(id)` ON DELETE CASCADE                       |
| `name`                   | `text`                 |                                                            |
| `description`            | `text`                 | Nullable                                                   |
| `status`                 | `project_status`       | Default `em_andamento`                                     |
| `current_stage`          | `text`                 | Etapa atual (ex: "Desenvolvimento")                        |
| `billing_type`           | `billing_type`         | `mensal` ou `projeto`                                      |
| `solution_type`          | `text`                 | Nullable                                                   |
| `started_at`             | `date`                 |                                                            |
| `expected_delivery_date` | `date`                 | Nullable                                                   |
| `delivered_at`           | `date`                 | Nullable                                                   |
| `pause_reason`           | `project_pause_reason` | Nullable                                                   |
| `pause_source`           | `pause_source`         | `automatico` ou `manual`                                   |
| `manual_status_override` | `boolean`              | Default `false`; quando `true`, o cron não altera o status |
| `client_visible_summary` | `text`                 | Resumo visível ao cliente                                  |
| `internal_notes`         | `text`                 | Notas internas (não visíveis ao cliente)                   |
| `archived_at`            | `timestamptz`          | Nullable                                                   |
| `created_at`             | `timestamptz`          |                                                            |
| `updated_at`             | `timestamptz`          |                                                            |

**RLS:** Admin gerencia tudo. Cliente lê próprios projetos.

**Cascade:** Deletar um projeto cascateia para `project_contracts`, `project_installments`, `project_subscriptions`, `charges` (project_id), `project_next_steps`, `timeline_events` (project_id).

---

### `project_contracts`

Contratos formais por projeto. Pode ter múltiplas versões (`version_no`).

| Coluna          | Tipo                     | Notas                                    |
| --------------- | ------------------------ | ---------------------------------------- |
| `id`            | `uuid` PK                |                                          |
| `project_id`    | `uuid`                   | FK → `projects(id)` ON DELETE CASCADE    |
| `client_id`     | `uuid`                   | FK → `clients(id)` ON DELETE CASCADE     |
| `version_no`    | `integer`                | Default `1`                              |
| `status`        | `contract_record_status` | Default `ativo`                          |
| `signed_at`     | `date`                   | Nullable                                 |
| `starts_at`     | `date`                   | Nullable                                 |
| `ends_at`       | `date`                   | Nullable                                 |
| `scope_summary` | `text`                   | Nullable                                 |
| `total_amount`  | `numeric(12,2)`          |                                          |
| `payment_model` | `payment_model`          | Default `50_50`                          |
| `created_by`    | `uuid`                   | FK → `auth.users(id)` ON DELETE SET NULL |
| `created_at`    | `timestamptz`            |                                          |
| `updated_at`    | `timestamptz`            |                                          |

---

### `project_installments`

Parcelas de projeto (entrada e entrega). Padrão 50/50.

| Coluna               | Tipo                          | Notas                                          |
| -------------------- | ----------------------------- | ---------------------------------------------- |
| `id`                 | `uuid` PK                     |                                                |
| `contract_id`        | `uuid`                        | FK → `project_contracts(id)` ON DELETE CASCADE |
| `project_id`         | `uuid`                        | FK → `projects(id)` ON DELETE CASCADE          |
| `client_id`          | `uuid`                        | FK → `clients(id)` ON DELETE CASCADE           |
| `installment_type`   | `project_installment_type`    | `entrada` ou `entrega`                         |
| `percentage`         | `numeric(5,2)`                | Ex: `50.00`                                    |
| `amount`             | `numeric(12,2)`               |                                                |
| `trigger_type`       | `project_installment_trigger` | `assinatura`, `conclusao`, `data_fixa`         |
| `expected_due_date`  | `date`                        | Nullable                                       |
| `effective_due_date` | `date`                        | Data real de vencimento (nullable)             |
| `status`             | `project_installment_status`  | Default `agendada`                             |
| `is_blocking`        | `boolean`                     | Default `true`; bloqueia projeto se atrasado   |
| `paid_at`            | `date`                        | Nullable                                       |
| `created_at`         | `timestamptz`                 |                                                |
| `updated_at`         | `timestamptz`                 |                                                |

**Unique:** `(contract_id, installment_type)` — 1 entrada + 1 entrega por contrato.

---

### `project_subscriptions`

Mensalidades recorrentes vinculadas a projetos.

| Coluna        | Tipo                  | Notas                                                     |
| ------------- | --------------------- | --------------------------------------------------------- |
| `id`          | `uuid` PK             |                                                           |
| `project_id`  | `uuid`                | FK → `projects(id)` ON DELETE CASCADE                     |
| `client_id`   | `uuid`                | FK → `clients(id)` ON DELETE CASCADE                      |
| `label`       | `text`                | Descrição (ex: "Manutenção Mensal")                       |
| `amount`      | `numeric(12,2)`       |                                                           |
| `due_day`     | `smallint`            | Dia de vencimento (1–31)                                  |
| `starts_on`   | `date`                | Data de início; 1ª cobrança = mês seguinte ao `starts_on` |
| `ends_on`     | `date`                | Nullable; `null` = contrato por tempo indeterminado       |
| `status`      | `subscription_status` | Default `ativa`                                           |
| `is_blocking` | `boolean`             | Default `true`                                            |
| `grace_days`  | `smallint`            | Dias de carência antes de marcar como atrasado (0–31)     |
| `created_at`  | `timestamptz`         |                                                           |
| `updated_at`  | `timestamptz`         |                                                           |

---

### `charges`

Cobranças individuais geradas a partir de parcelas, mensalidades ou manualmente. É a tabela central do módulo financeiro.

| Coluna              | Tipo             | Notas                                                         |
| ------------------- | ---------------- | ------------------------------------------------------------- |
| `id`                | `uuid` PK        |                                                               |
| `client_id`         | `uuid`           | FK → `clients(id)` ON DELETE CASCADE                          |
| `project_id`        | `uuid`           | FK → `projects(id)` ON DELETE CASCADE; nullable               |
| `contract_id`       | `uuid`           | FK → `project_contracts(id)` ON DELETE SET NULL; nullable     |
| `installment_id`    | `uuid`           | FK → `project_installments(id)` ON DELETE SET NULL; nullable  |
| `subscription_id`   | `uuid`           | FK → `project_subscriptions(id)` ON DELETE SET NULL; nullable |
| `origin_type`       | `text`           | `parcela_projeto`, `mensalidade`, `manual`                    |
| `description`       | `text`           |                                                               |
| `amount`            | `numeric(12,2)`  |                                                               |
| `due_date`          | `date`           |                                                               |
| `status`            | `invoice_status` | Default `pendente`                                            |
| `is_historical`     | `boolean`        | Default `false`; cobranças históricas importadas              |
| `paid_at`           | `date`           | Nullable                                                      |
| `payment_reference` | `text`           | Nullable                                                      |
| `payment_link`      | `text`           | Nullable                                                      |
| `is_blocking`       | `boolean`        | Default `false`                                               |
| `created_at`        | `timestamptz`    |                                                               |
| `updated_at`        | `timestamptz`    |                                                               |

**Indexes:** `(client_id, status, due_date)`, `(project_id, due_date DESC)`

**Lógica de status de mensalidades:**

- Ao ser criada (sync no Finance.tsx): `status = 'agendada'` se `due_date > hoje`
- Quando `due_date <= hoje`: deve ser promovida para `pendente` (via sync na abertura do Finance)
- Quando `due_date < hoje` e ainda `pendente`: promovida para `atrasado` via `mark_overdue_charges()`

---

### `documents`

Documentos vinculados a clientes e projetos (links externos ou arquivos em Storage).

| Coluna         | Tipo                  | Notas                                                     |
| -------------- | --------------------- | --------------------------------------------------------- |
| `id`           | `uuid` PK             |                                                           |
| `client_id`    | `uuid`                | FK → `clients(id)` ON DELETE CASCADE                      |
| `project_id`   | `uuid`                | FK → `projects(id)` ON DELETE SET NULL; nullable          |
| `contract_id`  | `uuid`                | FK → `project_contracts(id)` ON DELETE SET NULL; nullable |
| `type`         | `document_type`       |                                                           |
| `label`        | `text`                | Nome exibido                                              |
| `url`          | `text`                | URL legada                                                |
| `external_url` | `text`                | URL externa (Google Drive, etc.)                          |
| `storage_path` | `text`                | Path no Supabase Storage                                  |
| `visibility`   | `document_visibility` | Default `cliente`                                         |
| `description`  | `text`                | Nullable                                                  |
| `uploaded_by`  | `uuid`                | FK → `auth.users(id)` ON DELETE SET NULL                  |
| `archived_at`  | `timestamptz`         | Nullable                                                  |
| `created_at`   | `timestamptz`         |                                                           |

---

### `support_tickets`

Tickets de suporte abertos por clientes.

| Coluna       | Tipo          | Notas                                            |
| ------------ | ------------- | ------------------------------------------------ |
| `id`         | `uuid` PK     |                                                  |
| `client_id`  | `uuid`        | FK → `clients(id)` ON DELETE CASCADE             |
| `project_id` | `uuid`        | FK → `projects(id)` ON DELETE SET NULL; nullable |
| `subject`    | `text`        |                                                  |
| `body`       | `text`        |                                                  |
| `status`     | `text`        | `aberto`, `em_andamento`, `resolvido`, `fechado` |
| `priority`   | `text`        | `baixa`, `media`, `alta`; default `media`        |
| `created_at` | `timestamptz` |                                                  |
| `updated_at` | `timestamptz` |                                                  |

---

### `ticket_messages`

Mensagens de um ticket (thread de suporte).

| Coluna           | Tipo          | Notas                                                   |
| ---------------- | ------------- | ------------------------------------------------------- |
| `id`             | `uuid` PK     |                                                         |
| `ticket_id`      | `uuid`        | FK → `support_tickets(id)` ON DELETE CASCADE            |
| `sender_user_id` | `uuid`        | FK → `auth.users(id)` ON DELETE SET NULL                |
| `body`           | `text`        |                                                         |
| `is_internal`    | `boolean`     | Default `false`; notas internas não visíveis ao cliente |
| `created_at`     | `timestamptz` |                                                         |

---

### `project_next_steps`

Próximos passos de um projeto, visíveis ao cliente ou apenas internamente.

| Coluna           | Tipo               | Notas                                 |
| ---------------- | ------------------ | ------------------------------------- |
| `id`             | `uuid` PK          |                                       |
| `project_id`     | `uuid`             | FK → `projects(id)` ON DELETE CASCADE |
| `client_id`      | `uuid`             | FK → `clients(id)` ON DELETE CASCADE  |
| `title`          | `text`             |                                       |
| `description`    | `text`             | Nullable                              |
| `owner`          | `next_step_owner`  | `elkys`, `cliente`, `compartilhado`   |
| `due_date`       | `date`             | Nullable                              |
| `status`         | `next_step_status` | Default `pendente`                    |
| `client_visible` | `boolean`          | Default `true`                        |
| `sort_order`     | `integer`          | Default `0`                           |
| `created_at`     | `timestamptz`      |                                       |
| `updated_at`     | `timestamptz`      |                                       |

---

### `timeline_events`

Histórico de eventos de projeto. Alimentado manualmente e por ações do sistema.

| Coluna          | Tipo                  | Notas                                            |
| --------------- | --------------------- | ------------------------------------------------ |
| `id`            | `uuid` PK             |                                                  |
| `client_id`     | `uuid`                | FK → `clients(id)` ON DELETE CASCADE             |
| `project_id`    | `uuid`                | FK → `projects(id)` ON DELETE CASCADE; nullable  |
| `event_type`    | `text`                | Ex: `status_change`, `payment`, `document_added` |
| `title`         | `text`                |                                                  |
| `summary`       | `text`                |                                                  |
| `visibility`    | `document_visibility` | Default `ambos`                                  |
| `source_table`  | `text`                | Nullable; tabela de origem                       |
| `source_id`     | `uuid`                | Nullable; ID do registro de origem               |
| `actor_user_id` | `uuid`                | FK → `auth.users(id)` ON DELETE SET NULL         |
| `metadata`      | `jsonb`               | Default `{}`                                     |
| `occurred_at`   | `timestamptz`         |                                                  |
| `created_at`    | `timestamptz`         |                                                  |

---

### `internal_documents`

Documentos internos da equipe (não visíveis a clientes).

| Coluna        | Tipo          | Notas                                    |
| ------------- | ------------- | ---------------------------------------- |
| `id`          | `uuid` PK     |                                          |
| `title`       | `text`        |                                          |
| `description` | `text`        | Nullable                                 |
| `url`         | `text`        |                                          |
| `audience`    | `text`        | `marketing_design`, `developer`          |
| `created_by`  | `uuid`        | FK → `auth.users(id)` ON DELETE SET NULL |
| `created_at`  | `timestamptz` |                                          |
| `updated_at`  | `timestamptz` |                                          |

---

### `marketing_calendar_events`

Eventos do calendário de marketing.

| Coluna        | Tipo          | Notas                                    |
| ------------- | ------------- | ---------------------------------------- |
| `id`          | `uuid` PK     |                                          |
| `title`       | `text`        |                                          |
| `description` | `text`        | Nullable                                 |
| `event_date`  | `date`        |                                          |
| `event_type`  | `text`        |                                          |
| `created_by`  | `uuid`        | FK → `auth.users(id)` ON DELETE SET NULL |
| `created_at`  | `timestamptz` |                                          |

---

### `expenses`

Despesas operacionais da empresa.

| Coluna         | Tipo            | Notas           |
| -------------- | --------------- | --------------- |
| `id`           | `uuid` PK       |                 |
| `description`  | `text`          |                 |
| `category`     | `text`          | Default `geral` |
| `amount`       | `numeric(12,2)` |                 |
| `expense_date` | `date`          |                 |
| `notes`        | `text`          | Nullable        |
| `created_at`   | `timestamptz`   |                 |

---

### `audit_logs`

Log de auditoria de operações críticas.

| Coluna          | Tipo          | Notas                                    |
| --------------- | ------------- | ---------------------------------------- |
| `id`            | `uuid` PK     |                                          |
| `entity_type`   | `text`        | Ex: `clients`, `projects`                |
| `entity_id`     | `uuid`        |                                          |
| `action`        | `text`        | Ex: `delete`, `update`                   |
| `before_data`   | `jsonb`       | Nullable                                 |
| `after_data`    | `jsonb`       | Nullable                                 |
| `reason`        | `text`        | Nullable                                 |
| `actor_user_id` | `uuid`        | FK → `auth.users(id)` ON DELETE SET NULL |
| `created_at`    | `timestamptz` |                                          |

---

### `automation_settings`

Configurações de automações (cron, regras de negócio).

| Coluna       | Tipo          | Notas  |
| ------------ | ------------- | ------ |
| `id`         | `uuid` PK     |        |
| `key`        | `text`        | Unique |
| `value_json` | `jsonb`       |        |
| `updated_at` | `timestamptz` |        |

---

## Funções SQL

### `has_role(_user_id, _role)`

Retorna `boolean`. Verifica se o usuário possui o role especificado. `SECURITY DEFINER`.

### `is_admin(_user_id)`

Retorna `boolean`. Verifica se o usuário tem role `admin_super` ou `admin`. `SECURITY DEFINER`.

### `has_any_team_role(_user_id)`

Retorna `boolean`. Verifica se o usuário tem qualquer role de equipe (`admin_super`, `admin`, `marketing`, `developer`, `support`).

### `get_client_id_for_user(_user_id)`

Retorna `uuid`. Busca o `id` do cliente pelo `user_id`. (Legado — use `get_client_id_for_portal_user`.)

### `get_client_id_for_portal_user(_user_id)`

Retorna `uuid`. Busca o `client_id` por `clients.user_id` (prioridade 1) ou `client_contacts.auth_user_id` (prioridade 0).

### `mark_overdue_charges()`

Atualiza `charges.status` de `pendente` → `atrasado` para cobranças com `due_date < CURRENT_DATE`.

### `sync_projects_from_blocking_charges()`

Pausa projetos com cobranças bloqueantes atrasadas (`is_blocking = true`, `status = atrasado`).
Retoma projetos pausados automaticamente quando não há mais cobranças bloqueantes atrasadas.

### `sync_financial_blocks()`

Chama `mark_overdue_charges()` + `sync_projects_from_blocking_charges()` em sequência. Executada pelo cron.

---

## Cron Jobs (pg_cron)

| Job                    | Schedule    | Função                                                                 |
| ---------------------- | ----------- | ---------------------------------------------------------------------- |
| Auto-mark inadimplente | `0 2 * * *` | Executa `sync_financial_blocks()` + atualiza `clients.contract_status` |
| Invoice reminders      | `0 9 * * *` | Chama Edge Function `send-invoice-due`                                 |

---

## Storage Buckets

| Bucket         | Acesso        | Finalidade                             |
| -------------- | ------------- | -------------------------------------- |
| `avatars`      | Privado (RLS) | Fotos de perfil de clientes e equipe   |
| `email-assets` | Público       | Imagens usadas nos templates de e-mail |

---

## Diagrama de Relacionamentos (simplificado)

```
auth.users
    ├── profiles (1:1)
    ├── user_roles (1:N)
    ├── clients (1:1, via user_id)
    └── team_members (1:1, via user_id)

clients (1:N) ─┬─ projects (1:N) ─┬─ project_contracts (1:N) ─ project_installments (1:2)
               │                   ├─ project_subscriptions (1:N)
               │                   ├─ project_next_steps (1:N)
               │                   └─ timeline_events (1:N)
               ├─ charges (1:N)
               ├─ documents (1:N)
               ├─ support_tickets (1:N) ─ ticket_messages (1:N)
               └─ client_contacts (1:N)
```
