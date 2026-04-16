# Testes E2E — Elkys Platform

Testes end-to-end com Playwright testando o fluxo operacional completo da plataforma com **10 personas** (8 roles admin + cliente + admin_super).

## Estrutura

```
e2e/
  .env.example          # Template de credenciais
  .env                  # Credenciais reais (gitignored)
  setup-accounts.mjs    # Script para criar contas de teste via Supabase Admin API
  README.md             # Este arquivo
  helpers/
    auth.ts             # Login, navegacao, cookie banner, toasts, console errors
    supabase-api.ts     # API direta ao Supabase (verificacoes no banco)
  specs/
    fluxo-completo.spec.ts  # Teste principal: fluxo multi-persona 20 etapas
```

## Personas testadas

| Persona    | Role          | Paginas acessadas                                                   |
| ---------- | ------------- | ------------------------------------------------------------------- |
| Comercial  | `comercial`   | CRM (leads, propostas, pipeline), clientes, tarefas                 |
| Juridico   | `juridico`    | Contratos, tarefas                                                  |
| Financeiro | `financeiro`  | Financeiro, clientes, projetos, regua de cobranca, tarefas          |
| PO         | `po`          | Projetos, documentos dev, tarefas dev, tarefas (todas)              |
| Developer  | `developer`   | Projetos, documentos dev, tarefas dev, tarefas (todas)              |
| Designer   | `designer`    | Projetos, documentos dev, tarefas dev                               |
| Marketing  | `marketing`   | CRM, calendario, documentos M&D, tarefas marketing                  |
| Suporte    | `support`     | Suporte, projetos, tarefas suporte                                  |
| Admin      | `admin_super` | Todas as 18 paginas                                                 |
| Cliente    | `cliente`     | Portal cliente: propostas, contratos, projetos, financeiro, suporte |

## Fluxo testado (20 etapas)

```
 1. [COMERCIAL]  Cria lead no CRM
 2. [COMERCIAL]  Diagnostico do lead (gate: 3 campos obrigatorios)
 3. [COMERCIAL]  Cria e envia proposta
 4. [ADMIN]      Aprova proposta → converte lead em cliente + cria contrato
 5. [SISTEMA]    Cria conta auth para o cliente convertido
 6. [CLIENTE]    Visualiza propostas no portal
 7. [CLIENTE]    Visualiza contratos no portal
 8. [JURIDICO]   Revisa contrato e envia para validacao
 9. [CLIENTE]    Aceita contrato no portal
10. [JURIDICO]   Valida assinatura e ativa contrato → projeto + cobrancas criados
11. [PO]         Completa onboarding (5 checkboxes)
12. [DEVELOPER]  Verifica projeto, tarefas e docs
13. [DESIGNER]   Verifica projeto e docs
14. [PO]         Inicia validacao, valida interna+cliente, aprova, registra aceite formal
15. [FINANCEIRO] Verifica cobrancas, projetos, regua, clientes
16. [MARKETING]  Verifica CRM, calendario, docs M&D, tarefas
17. [SUPORTE]    Verifica suporte, projetos, tarefas
18. [VERIFICACAO] Checa timeline events e proposta no banco via API
19. [COMERCIAL]  Pipeline mostra projeto concluido
20. [CLIENTE]    Visualiza projeto concluido, financeiro e suporte no portal
```

## Setup

### 1. Instalar dependencias

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Criar contas de teste

```bash
node e2e/setup-accounts.mjs
```

Cria 8 contas de equipe via edge function `create-user` (mesma logica do TeamCreate.tsx). O cliente e criado automaticamente durante o fluxo pelo RPC `convert_lead_to_client`.

### 3. Configurar credenciais

```bash
cp e2e/.env.example e2e/.env
# Preencher ADMIN_EMAIL e ADMIN_PASSWORD com credenciais reais do admin_super
```

### 4. Executar

```bash
# Headless (CI)
npm run test:e2e

# Com browser visivel
npm run test:e2e:headed

# Com UI interativa
npm run test:e2e:ui
```

## Captura de erros

Os testes capturam:

- **Erros de JavaScript** (`pageerror`): TypeError, ReferenceError, etc.
- **console.error**: Erros logados pela aplicacao
- **HTTP 4xx/5xx**: Requests falhando (edge functions, RPCs, APIs)
- **Error boundary**: Verifica que "Algo deu errado" nao aparece

Erros filtrados (infraestrutura, nao bugs):

- CSP violations (requer deploy do `.htaccess`)
- `net::ERR_*` (rede transiente)
- `Failed to fetch` (Supabase token refresh durante navegacao)
- favicon 404

## Limpeza de dados

Os testes criam dados com prefixo `E2E_TEST_{timestamp}` para facilitar limpeza.

Para limpar dados de teste manualmente:

```sql
-- Executar via Supabase SQL Editor ou migration
DELETE FROM public.leads WHERE name LIKE '%E2E\_TEST\_%' ESCAPE '\';
-- (ver migration 20260418220000 para script completo com ordem de FKs)
```

## Bugs encontrados e corrigidos pelos testes

| Bug                               | Causa                                    | Fix                                             |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| PO/Dev/Designer nao veem projetos | RLS sem policy para `has_dev_access()`   | Migration `20260418210000`                      |
| GA4 CSP bloqueado                 | `connect-src` sem `google.com`           | `.htaccess` + `_headers`                        |
| Edge functions 403 para juridico  | `requireAdminAccess` nao inclui juridico | `requireOperationalAccess` em `_shared/auth.ts` |
| Validacao RPCs 400 para PO        | `is_admin()` sem `has_dev_access()`      | Migration `20260418250000`                      |
