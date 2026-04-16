# Testes E2E — Guia Completo

## Visao geral

Testes end-to-end com Playwright cobrindo o fluxo operacional completo da plataforma Elkys com 10 personas (8 roles admin + cliente + admin_super).

## Estrutura

```
e2e/
  .env.example            # Template de credenciais
  .env                    # Credenciais reais (gitignored)
  setup-accounts.mjs      # Cria contas de teste via Supabase Admin API
  README.md               # Documentacao detalhada
  helpers/
    auth.ts               # Login, navegacao, asserts, captura de erros
    supabase-api.ts       # API direta ao Supabase (verificacoes no banco)
  specs/
    fluxo-completo.spec.ts  # Fluxo multi-persona: 20 etapas + 18 paginas admin
```

## Personas

| Persona    | Role          | Responsabilidade no fluxo                  |
| ---------- | ------------- | ------------------------------------------ |
| Comercial  | `comercial`   | Cria lead, diagnostico, proposta, pipeline |
| Admin      | `admin_super` | Aprova proposta, visao geral               |
| Juridico   | `juridico`    | Revisao e ativacao de contratos            |
| PO         | `po`          | Onboarding, validacao, aceite formal       |
| Developer  | `developer`   | Verifica projeto, tarefas, docs            |
| Designer   | `designer`    | Verifica projeto, docs visuais             |
| Marketing  | `marketing`   | CRM, calendario, docs M&D                  |
| Financeiro | `financeiro`  | Cobrancas, regua, clientes                 |
| Suporte    | `support`     | Tickets, SLA, projetos                     |
| Cliente    | `cliente`     | Portal: propostas, contratos, projetos     |

## Comandos

```bash
# Setup inicial (uma vez)
npm install -D @playwright/test
npx playwright install chromium
node e2e/setup-accounts.mjs

# Executar
npm run test:e2e             # Headless (CI)
npm run test:e2e:headed      # Com browser visivel
npm run test:e2e:ui          # UI interativa do Playwright
```

## Fluxo testado

```
 1. [COMERCIAL]   Cria lead no CRM
 2. [COMERCIAL]   Diagnostico (gate: 3 campos obrigatorios)
 3. [COMERCIAL]   Cria e envia proposta
 4. [ADMIN]       Aprova proposta → converte lead + cria contrato
 5. [SISTEMA]     Cria conta auth para cliente convertido
 6. [CLIENTE]     Visualiza propostas no portal
 7. [CLIENTE]     Visualiza contratos no portal
 8. [JURIDICO]    Revisa contrato e envia para validacao
 9. [CLIENTE]     Aceita contrato no portal
10. [JURIDICO]    Valida assinatura e ativa → projeto + cobrancas
11. [PO]          Completa onboarding (5 checkboxes)
12. [DEVELOPER]   Verifica projeto, tarefas e docs
13. [DESIGNER]    Verifica projeto e docs
14. [PO]          Validacao e aceite formal
15. [FINANCEIRO]  Verifica cobrancas, regua, clientes
16. [MARKETING]   Verifica CRM, calendario, docs
17. [SUPORTE]     Verifica suporte, projetos, tarefas
18. [VERIFICACAO] Checa timeline e proposta no banco
19. [COMERCIAL]   Pipeline mostra projeto concluido
20. [CLIENTE]     Visualiza projeto, financeiro, suporte
```

## Captura de erros

Cada teste captura automaticamente:

- Erros de JavaScript (TypeError, ReferenceError)
- console.error da aplicacao
- Requests HTTP 4xx/5xx (edge functions, RPCs)
- Error boundary ("Algo deu errado")

## Limpeza de dados

Dados de teste usam prefixo `E2E_TEST_{timestamp}`. Para limpar:

```sql
DELETE FROM public.leads WHERE name LIKE '%E2E_TEST_%';
-- Ver e2e/README.md para script completo com ordem de FKs
```

## Bugs encontrados pelos testes

| Bug                                         | Fix                      |
| ------------------------------------------- | ------------------------ |
| PO/Dev/Designer sem acesso a projetos (RLS) | Migration 20260418210000 |
| GA4 CSP bloqueado (connect-src)             | .htaccess + \_headers    |
| Edge functions 403 para juridico            | requireOperationalAccess |
| RPCs de validacao 400 para PO               | Migration 20260418250000 |
