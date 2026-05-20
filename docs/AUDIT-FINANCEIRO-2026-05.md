# Auditoria de Cálculos Financeiros — 2026-05

Auditoria página-por-página dos cálculos do dashboard admin. Cada achado lista `arquivo:linha`, severidade (`bug` / `ux` / `nit`), e proposta. Itens marcados `corrigido` já entraram na branch `feature/comms-dashboard-v2`.

---

## 1. Overview (`src/pages/portal/admin/Overview.tsx`)

### 1.1 `insightHeadline`: "R$ 100,00 igual em 1m/6m/9m/12m vs MRR só em 3m"

- **Severidade**: `ux`
- **Local**: `Overview.tsx:1442-1472`
- **Status**: `aberto — corrigir em PR isolado`

**Diagnóstico**: cascata de prioridade — só mostra MRR change quando `periodMrrChange.kind === "value"` E o módulo é ≥ 5%. Em 6m/9m/12m a janela cai em `kind='na'` (não há `due_date` registrado tão atrás) ou `kind='new'`, então pula direto pro 3º item (overdue). Em 1m provavelmente o módulo do change é < 5%, mesma cascata.

`overdueReceivables` (`Overview.tsx:1017-1020`) é snapshot point-in-time corretamente — não deveria mesmo mudar com cadência.

**Fix proposto**: incluir branch quando `kind === "new"` mostrando "MRR atual de R$X (sem base comparável a Nm)" antes de cair em overdueReceivables. Tooltip no headline explicando regra.

---

## 2. Finance (`src/pages/portal/admin/Finance.tsx`)

### 2.1 `pendingReceivables` exclui `atrasado` mas o label sugere "A receber"

- **Severidade**: `ux`
- **Local**: `Finance.tsx:1971-1979`
- **Status**: `aberto`

**Diagnóstico**: `pendingReceivables` filtra `status === 'pendente' OR ('agendada' AND due_date <= fim-do-mês)`. Charges `atrasado` ficam em metric separado (`overdueReceivables`). Tecnicamente correto, mas o label "A receber" pode passar a impressão de incluir overdues.

**Fix proposto**: renomear label do KPI no tile pra "A receber este mês (não vencidas)" ou criar um KPI agregado "Total a receber = pending + overdue" com decomposição expandida no hover.

### 2.2 Aging mistura `pendente` e `atrasado`

- **Severidade**: `nit`
- **Local**: `Finance.tsx:1872-1878`
- **Status**: `wontfix — verificar com PO`

**Diagnóstico**: `agingCharges` inclui `pendente` E `atrasado`, ambas com `due_date <= today`. Operacionalmente é correto (`pendente` com due_date passado vira atrasado quando o trigger roda) e evita perder cobranças que o trigger ainda não atualizou. Adicionar comentário no código explicando para que não pareça duplicação com `overdueReceivables`.

### 2.3 `monthlySeries[length-1]` sem bounds check

- **Severidade**: `nit`
- **Local**: `Finance.tsx:1990` (e similares)
- **Status**: `aberto`

**Diagnóstico**: `const curMonth = monthlySeries[monthlySeries.length - 1]` retorna `undefined` se a série estiver vazia. O encadeamento `curMonth?.net ?? 0` evita crash mas mascara estado de erro: tudo zerado em vez de "Sem dados".

**Fix proposto**: adicionar guard no início do `useMemo` que produz o summary: se `monthlySeries.length === 0` retornar estado tipo `{ kind: 'empty' }`, e a UI mostrar empty-state explícito.

### 2.4 Period "1M" do RevenueByClient é mês-a-data, não 30 dias

- **Severidade**: `ux`
- **Local**: `RevenueByClient.tsx:48-51`
- **Status**: `aberto`

**Diagnóstico**: `getStartDate(1)` usa `d.setDate(1)` → vai do dia 1 do mês corrente até hoje (MTD, "month-to-date"), enquanto outras cadências (3M, 6M, etc.) usam `setMonth` (janela rolling). Inconsistência que confunde quem compara métricas entre cadências.

**Fix proposto**: padronizar para janela rolling (`setDate(d.getDate() - 30)`) ou renomear "1M" pra "Mês atual" e documentar.

---

## 3. Clients (`src/pages/portal/admin/Clients.tsx`) + `useAdminClients.ts`

### 3.1 `client.monthly_value` usado direto sem clareza da fonte

- **Severidade**: `nit`
- **Local**: `Clients.tsx:149`, `Clients.tsx:152`
- **Status**: `verificado — OK`

**Diagnóstico**: `Number(client.monthly_value)` é usado direto no render. Verificado em `useAdminClients.ts:148`: o hook sobrescreve `monthly_value` com o valor calculado da `client_financial_summary` view (PA11). A UI já recebe o valor de verdade. **Comportamento correto**, apenas nit de legibilidade — poderia ter um `getMonthlyValue(client)` que documenta a origem.

### 3.2 Indicadores de cliente baseados em `client_id` em `proposals` opcional

- **Severidade**: `nit`
- **Local**: `useAdminClients.ts:122-125`
- **Status**: `aberto`

**Diagnóstico**: `pendingProposalClientIds` só adiciona se `proposal.client_id` existir (proposta vinculada). Propostas com `client_id IS NULL` (leads ainda não convertidos) são ignoradas no indicador do cliente. Esperado, mas verificar se há leads convertidos com proposals.client_id ainda NULL — seria perda de indicador.

---

## 4. Charges (página Delinquency + tabela `charges`)

Não há `Charges.tsx` (cobranças aparecem em `Finance.tsx` aba e `Delinquency.tsx`). Auditoria do `Delinquency.tsx` foca em:

### 4.1 Status "atrasado" depende de trigger de DB

- **Severidade**: `bug-potencial`
- **Local**: `Finance.tsx:1982`, `Overview.tsx:1019`
- **Status**: `aberto — investigar`

**Diagnóstico**: o filtro `status === "atrasado"` confia no DB ter atualizado o status. Se o trigger/cron de atualização de status não roda (ex.: cobrança com `due_date` ontem mas status ainda `pendente`), métricas `overdueReceivables` ficam subestimadas e `pendingReceivables` superestimadas.

**Fix proposto**: usar `(status === 'atrasado' OR (status === 'pendente' AND due_date < today))` no frontend pra ser independente do trigger. Já usado no `useAdminClients.ts:111-114` corretamente — replicar.

### 4.2 `is_historical` flag inconsistente entre métricas

- **Severidade**: a verificar
- **Local**: múltiplos
- **Status**: `aberto — investigar`

**Diagnóstico**: alguns filtros aplicam `!c.is_historical` (overdueReceivables em `Finance.tsx:1982`, `Overview.tsx:1019`), outros não (`agingCharges` em `Finance.tsx:1872-1878` aplica corretamente). Conferir consistência — uma cobrança histórica não deveria entrar em nenhuma métrica corrente.

---

## 5. Contracts (`src/pages/portal/admin/Contracts.tsx`)

### 5.1 `total_amount` agregação consistente

- **Severidade**: `verificado — OK`
- **Local**: `useAdminClients.ts:101-107`
- **Status**: `OK`

**Diagnóstico**: o hook soma `project_contracts.total_amount` por cliente em `contractTotals` Map e sobrescreve `project_total_value`. Consistente.

### 5.2 `contract_end` snapshot vs calculado

- **Severidade**: `verificado — OK`
- **Local**: `useAdminClients.ts:134, 151`
- **Status**: `OK`

**Diagnóstico**: `contract_end` é sobrescrito pelo valor da view `client_financial_summary.contract_end_calculated`. Correto.

---

## 6. Communications (`src/pages/portal/admin/Communications.tsx`)

### 6.1 Taxa "Clique / Abertura" > 100%

- **Severidade**: `bug`
- **Status**: `corrigido em feature/comms-dashboard-v2`

Numerador misturava cliques de e-mail + WhatsApp; denominador era abertura só de e-mail. Corrigido: funis separados por canal, taxa "clique / abertura" usa só email.

### 6.2 "Cliente arquivado" em 100% dos clientes

- **Severidade**: `bug`
- **Status**: `corrigido em feature/comms-dashboard-v2`

`clientsBundle?.clients` em vez de usar o array direto.

### 6.3 "Equipe Elkys" genérico em vez do nome do membro

- **Severidade**: `ux`
- **Status**: `corrigido em feature/comms-dashboard-v2`

Resolvido por lookup `email → full_name` em `team_members`.

### 6.4 `pessoa(s)` sem identificação

- **Severidade**: `ux`
- **Status**: `corrigido em feature/comms-dashboard-v2`

Substituído pela lista nominal de quem clicou sem o pixel disparar.

### 6.5 Em-dashes "—" na UI

- **Severidade**: `nit`
- **Status**: `corrigido em feature/comms-dashboard-v2`

Substituídos por pontuação adequada.

### 6.6 Empty-state do time series

- **Severidade**: `nit`
- **Status**: `corrigido em feature/comms-dashboard-v2`

Quando há 0 ou 1 ponto, mostra mensagem explicativa em vez de gráfico vazio.

---

## 7. Team / TeamCreate / TeamEdit

### 7.1 Usuário logado não conseguia se selecionar como "Líder direto"

- **Severidade**: `bug`
- **Status**: `corrigido em feature/comms-dashboard-v2`

Query filtrava `is_active=true AND user_id IS NOT NULL`. Agora inclui o usuário logado sempre, com fallback resolvendo `user_id` via auth context.

---

## Resumo

| Severidade    | Total | Corrigidos | Abertos                |
| ------------- | ----- | ---------- | ---------------------- |
| bug           | 4     | 4          | 0                      |
| bug-potencial | 1     | 0          | 1 (4.1)                |
| ux            | 5     | 2          | 3 (1.1, 2.1, 2.4)      |
| nit           | 5     | 1          | 4 (2.2, 2.3, 3.1, 3.2) |
| OK            | 3     | —          | —                      |

**Próximos PRs sugeridos** (a partir de develop):

1. `fix/overview-insight-headline` — caso 1.1
2. `fix/charges-overdue-resilient-filter` — caso 4.1 (alto impacto financeiro)
3. `fix/finance-monthly-series-empty-guard` — caso 2.3
4. `chore/revenue-by-client-cadence-consistency` — caso 2.4
5. `chore/finance-receivables-label-clarity` — caso 2.1
6. `chore/finance-aging-comment` — caso 2.2

A branch `feature/comms-dashboard-v2` carrega 6 fixes (4 bugs + 2 ux/nit) prontos para merge.
