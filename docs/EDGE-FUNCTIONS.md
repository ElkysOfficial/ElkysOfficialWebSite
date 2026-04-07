# Edge Functions — Elkys Platform

Todas as funções são serverless Deno deployadas no Supabase. Código em `supabase/functions/`.

## Shared Utilities

### `_shared/auth.ts`

```typescript
requireAdminAccess(req, CORS);
// Valida o Bearer token da requisição e verifica se o usuário
// tem role admin_super ou admin via user_roles.
// Retorna { adminClient } ou Response com erro.

createServiceRoleClient();
// Cria cliente Supabase com SUPABASE_SERVICE_ROLE_KEY.
// Ignora RLS — use apenas em contexto server-side confiável.
```

### `_shared/email-template.ts`

```typescript
buildEmail(options): string
// Monta HTML de e-mail transacional com layout Elkys.
// Suporta: preheader, title, greeting, body, highlight (tabela),
//          button, note, warning.

sendEmail({ to, subject, html }): Promise<{ ok, error? }>
// Envia via Resend API. Usa secrets FROM_EMAIL e RESEND_API_KEY.

CORS  // Headers CORS padrão para todas as respostas.
```

---

## Funções de Gestão de Usuários

### `create-user`

**Trigger:** Chamada pelo admin ao cadastrar cliente (`ClientCreate`) ou membro da equipe (`TeamCreate`).

**Payload:**

```json
{ "email": "string", "password": "string", "full_name": "string" }
```

**Comportamento:**

- Usa `auth.admin.createUser()` com `email_confirm: true`
- Não envia e-mail de confirmação do Supabase (enviamos o nosso próprio)
- Retorna `{ ok: true, user_id: "uuid" }`

**Auth:** Requer Bearer token de usuário admin.

**Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `delete-user`

**Trigger:** Chamada pelo admin ao excluir cliente ou membro da equipe.

**Payload:**

```json
{ "user_id": "uuid" }
```

**Comportamento:**

- Remove o usuário do Supabase Auth via `auth.admin.deleteUser()`
- A exclusão do registro na tabela `clients` ou `team_members` deve ser feita separadamente pelo frontend
- Retorna `{ ok: true }`

**Auth:** Requer Bearer token de usuário admin.

**Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `update-user`

**Trigger:** Chamada pelo admin ao editar dados de um cliente ou membro da equipe.

**Payload:**

```json
{
  "user_id": "uuid",
  "email": "string (opcional)",
  "full_name": "string (opcional)",
  "phone": "string | null (opcional)"
}
```

**Comportamento:**

1. Busca usuário atual via `auth.admin.getUserById()`
2. Se `email` fornecido: atualiza no Auth (`email_confirm: true`)
3. Se `full_name` fornecido: atualiza `user_metadata.full_name` no Auth
4. Sincroniza campos alterados na tabela `profiles`
5. Retorna `{ ok: true }`

**Auth:** Requer Bearer token de usuário admin.

**Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `complete-first-access`

**Trigger:** Chamada pelo cliente ou membro da equipe após trocar a senha temporária no primeiro acesso.

**Payload:** Nenhum (autenticação via Bearer token do usuário logado).

**Comportamento:**

1. Valida o Bearer token e resolve o `user.id`
2. Tenta atualizar `must_change_password = false` em `clients` (pela `user_id`)
3. Tenta atualizar `must_change_password = false` em `team_members` (pela `user_id`)
4. Pelo menos um dos dois deve retornar registro — caso contrário, retorna 404
5. Retorna `{ ok: true, updated_client: bool, updated_team_member: bool }`

**Auth:** Bearer token do próprio usuário (não requer admin).

**Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Funções de E-mail

### `send-client-welcome`

**Trigger:** Chamada imediatamente após criar um novo cliente.

**Payload:**

```json
{ "email": "string", "name": "string", "temp_password": "string" }
```

**E-mail enviado para:** `email` do cliente.

**Conteúdo:**

- Boas-vindas ao portal Elkys
- Credenciais de acesso (e-mail + senha temporária)
- Botão: "Ir para o seu portal"

**Auth:** Requer Bearer token de usuário admin.

**Secrets:** `RESEND_API_KEY`, `FROM_EMAIL`, `PORTAL_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `send-team-welcome`

**Trigger:** Chamada imediatamente após criar um novo membro da equipe.

**Payload:**

```json
{ "email": "string", "name": "string", "temp_password": "string" }
```

**E-mail enviado para:** `email` do membro.

**Conteúdo:**

- Boas-vindas à equipe Elkys
- Credenciais de acesso ao painel interno
- Botão: "Ir para o painel"

**Auth:** Requer Bearer token de usuário admin.

**Secrets:** `RESEND_API_KEY`, `FROM_EMAIL`, `PORTAL_URL`

---

### `send-password-reset`

**Trigger:** Chamada pela tela de "Esqueci a senha" ou pelo admin ao resetar senha manualmente.

**Payload:**

```json
{ "email": "string" }
```

**E-mail enviado para:** o e-mail informado.

**Conteúdo:**

- Link de redefinição de senha (gerado via `auth.admin.generateLink()`)

**Secrets:** `RESEND_API_KEY`, `FROM_EMAIL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `send-ticket-opened`

**Trigger:** Chamada quando um cliente abre um novo ticket de suporte.

**Payload:**

```json
{
  "ticket_id": "uuid",
  "client_id": "uuid",
  "subject": "string",
  "body": "string"
}
```

**E-mail enviado para:** todos os endereços em `TICKET_NOTIFY_EMAILS` (vírgula-separados).

**Comportamento:**

1. Lê destinatários de `TICKET_NOTIFY_EMAILS` — se vazio, loga aviso e retorna `{ ok: true, skipped: true }`
2. Busca dados do cliente na tabela `clients`
3. Monta e-mail com resumo do ticket (body truncado em 300 chars)
4. Envia para todos os destinatários em paralelo via `Promise.allSettled`
5. Retorna `{ ok: true }` mesmo com falhas parciais (loga warnings)

**Auth:** Sem verificação de admin (chamada pelo cliente autenticado).

**Secrets:** `RESEND_API_KEY`, `FROM_EMAIL`, `PORTAL_URL`, `TICKET_NOTIFY_EMAILS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `send-ticket-updated`

**Trigger:** Chamada pelo admin ao responder ou atualizar um ticket.

**Payload:**

```json
{
  "ticket_id": "uuid",
  "client_id": "uuid",
  "subject": "string",
  "status": "string",
  "response": "string"
}
```

**E-mail enviado para:** e-mail do cliente.

**Conteúdo:**

- Notificação de atualização do ticket
- Status atual e resposta da equipe

**Auth:** Requer Bearer token de usuário admin.

**Secrets:** `RESEND_API_KEY`, `FROM_EMAIL`, `PORTAL_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `send-invoice-due`

**Trigger:** Cron job — todo dia às 9h UTC (`0 9 * * *`).

**Payload:** Nenhum (sem body).

**Comportamento:**

1. Calcula `targetDate = hoje + INVOICE_DAYS_BEFORE` (padrão: 3 dias)
2. Busca `charges` com `due_date = targetDate`, `status IN ('pendente', 'agendada')`, `is_historical = false`
3. Busca dados dos clientes únicos vinculados
4. Agrupa cobranças por cliente
5. Para cada cliente: monta e-mail com resumo (lista de cobranças + total + data)
6. Clientes `inadimplentes` recebem e-mail com alerta especial
7. Retorna `{ ok: true, sent: N, failed: N, total: N }`

**Secrets:** `RESEND_API_KEY`, `FROM_EMAIL`, `PORTAL_URL`, `INVOICE_DAYS_BEFORE`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `send-installment-paid`

**Trigger:** Chamada pelo admin ao marcar uma parcela ou mensalidade como paga.

**Payload:**

```json
{
  "client_id": "uuid",
  "charge_id": "uuid",
  "description": "string",
  "amount": "number",
  "paid_at": "string (ISO date)"
}
```

**E-mail enviado para:** e-mail do cliente.

**Conteúdo:**

- Confirmação de recebimento do pagamento
- Detalhes da cobrança paga (descrição, valor, data)

**Auth:** Requer Bearer token de usuário admin.

**Secrets:** `RESEND_API_KEY`, `FROM_EMAIL`, `PORTAL_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `send-document-added`

**Trigger:** Chamada pelo admin ao adicionar um documento para um cliente.

**Payload:**

```json
{
  "client_id": "uuid",
  "document_label": "string",
  "document_type": "string"
}
```

**E-mail enviado para:** e-mail do cliente.

**Conteúdo:**

- Notificação de novo documento disponível no portal

**Auth:** Requer Bearer token de usuário admin.

**Secrets:** `RESEND_API_KEY`, `FROM_EMAIL`, `PORTAL_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `process-billing-rules`

**Trigger:** Cron diario as 8h UTC (`0 8 * * *`) ou disparo manual pelo admin via botao "Executar regua agora".

**Payload (opcional):**

```json
{
  "triggered_by": "manual" | "cron"
}
```

**Fluxo de execucao:**

1. Carrega todas as `billing_rules` ativas, ordenadas por `sort_order`
2. Para cada regra, calcula a data-alvo: `hoje - trigger_days`
   - `trigger_days = -3` → busca cobrancas com `due_date` = daqui a 3 dias (pendente/agendada)
   - `trigger_days = 0` → busca cobrancas com `due_date` = hoje (pendente)
   - `trigger_days = 7` → busca cobrancas com `due_date` = 7 dias atras (atrasado)
3. Verifica duplicatas no `billing_actions_log` para evitar reenvio no mesmo dia
4. Resolve o template vinculado e substitui variaveis (`{{client_name}}`, `{{amount}}`, `{{due_date}}`, `{{description}}`)
5. Envia email via `buildEmail()` + `sendEmail()` (Resend API)
6. Registra resultado no `billing_actions_log`

**Resposta:**

```json
{
  "ok": true,
  "sent": 5,
  "errors": 0
}
```

**Auth:** Aceita Bearer token admin ou Service Role Key (para cron).

**Secrets:** `RESEND_API_KEY`, `FROM_EMAIL`, `PORTAL_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `process-scheduled-notifications`

**Trigger:** Cron a cada 5 minutos (`*/5 * * * *`).

**Fluxo:** Busca notificacoes com `status = 'agendada'` e `send_at <= now()`. Processa ate 20 por execucao, enviando emails aos destinatarios filtrados.

**Auth:** Service Role Key (cron).

---

## Configuração de Secrets

Secrets configurados via Supabase Dashboard (Settings → Edge Functions → Secrets) ou CLI:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set FROM_EMAIL=noreply@elkys.com.br
supabase secrets set PORTAL_URL=https://elkys.com.br/portal/cliente
supabase secrets set TICKET_NOTIFY_EMAILS=suporte@elkys.com.br,outro@elkys.com.br
supabase secrets set INVOICE_DAYS_BEFORE=3
```

| Secret                      | Obrigatório | Padrão                                | Finalidade                                       |
| --------------------------- | ----------- | ------------------------------------- | ------------------------------------------------ |
| `SUPABASE_URL`              | Sim         | —                                     | Auto-injetado pelo Supabase                      |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim         | —                                     | Auto-injetado pelo Supabase                      |
| `RESEND_API_KEY`            | Sim         | —                                     | API de envio de e-mail                           |
| `FROM_EMAIL`                | Sim         | —                                     | Remetente dos e-mails transacionais              |
| `PORTAL_URL`                | Não         | `https://elkys.com.br/portal/cliente` | URL base do portal no botão dos e-mails          |
| `TICKET_NOTIFY_EMAILS`      | Não         | `""`                                  | Destinatários de notificação de tickets          |
| `INVOICE_DAYS_BEFORE`       | Não         | `3`                                   | Dias de antecedência para lembrete de vencimento |

---

## Deploy

```bash
# Deployar uma função específica
supabase functions deploy create-user
supabase functions deploy send-invoice-due

# Deployar todas as funções
supabase functions deploy

# Funções que precisam da flag --no-verify-jwt
supabase functions deploy complete-first-access --no-verify-jwt
supabase functions deploy delete-user --no-verify-jwt
supabase functions deploy update-user --no-verify-jwt

# Funções de automaç��o (chamadas por cron + admin)
supabase functions deploy process-billing-rules --no-verify-jwt
supabase functions deploy process-scheduled-notifications --no-verify-jwt
```
