# Arquitetura do Ecossistema Elkys

> Estudo arquitetural para evolução do portal Elkys em núcleo operacional da
> software house e command center executivo do ecossistema de produtos SaaS.
>
> Status: proposta para discussão. Não implementado.
> Data: 2026-05-21. Stack atual de referência: React 18 + Vite 7 + Supabase Cloud.

---

## Sumário executivo (leia isto primeiro)

O erro mais caro que se pode cometer aqui é tratar "command center" como
"colocar Sonnar e Dashy dentro do portal Elkys". Não é isso. O portal Elkys
**não hospeda os produtos**. Ele hospeda uma **réplica de leitura consolidada**
de métricas que os produtos publicam. A integração é de **dados**, não de UI e
não de runtime.

Três decisões fundamentais sustentam todo o resto:

1. **Padrão hub-and-spoke (mãe e satélites).** A Elkys é o hub: identidade de
   staff, governança, consolidação financeira, observabilidade e BI. Cada
   produto (Sonnar, Dashy, futuros) é um satélite autônomo: frontend, backend,
   banco, auth e operação próprios. Satélites nunca compartilham banco nem auth
   entre si. Compartilham apenas um **contrato** (schema de métricas e eventos).

2. **O portal Elkys continua um único SPA**, mas reorganizado em **zonas de
   rota isoladas** (`/portal/ops`, `/portal/core`, `/portal/analytics`,
   `/portal/infra`). Isolamento é arquitetural (bounded contexts, code-splitting,
   guards de role, dados desacoplados), não físico (não vira micro-frontends
   agora, não vira subdomínio nunca).

3. **A consolidação vive num backend dedicado** (um projeto Supabase separado,
   o "Elkys Hub"), alimentado por ETL/ingestão a partir dos produtos. O portal
   lê desse hub. O portal nunca toca os bancos dos produtos diretamente.

Se você ler só isto e mais nada, já evitou o monolito.

---

## 1. Visão arquitetural

### 1.1 O modelo mental correto: holding operacional + federação de produtos

A Elkys tem hoje duas naturezas que estão sendo confundidas em uma só:

- **Elkys Software House**: presta serviço para clientes externos. Tem CRM,
  contratos, projetos, cobrança, suporte, equipe. É o que o portal atual já é.
- **Elkys Venture Studio / Holding**: detém produtos próprios (Sonnar, Dashy).
  Precisa de visão de portfólio, métricas SaaS, consolidação financeira e
  governança sobre produtos que são, na prática, mini-empresas.

São **dois negócios com economia diferente**. Software house é receita por
projeto/serviço, margem por hora, fluxo de caixa irregular. SaaS é receita
recorrente, margem por infraestrutura, fluxo previsível. Misturar os dois num
mesmo modelo de dados e numa mesma navegação produz relatórios que não fecham e
decisões ruins.

A arquitetura precisa **separar essas duas naturezas como bounded contexts de
primeira classe**, e tratar cada produto como um terceiro tipo de contexto:
autônomo e federado.

### 1.2 Bounded contexts

Cinco contextos delimitados, cada um com dono, dados e ciclo de vida próprios:

| Contexto                       | Natureza                                | Dono dos dados                      | Onde vive                              |
| ------------------------------ | --------------------------------------- | ----------------------------------- | -------------------------------------- |
| **Operação da Software House** | Transacional, serviço a clientes        | Banco Elkys atual                   | Portal Elkys, zona `/portal/ops`       |
| **Command Center Executivo**   | Read model consolidado, portfólio       | Elkys Hub (banco novo)              | Portal Elkys, zona `/portal/core`      |
| **BI / Analytics**             | Read model analítico, séries históricas | Elkys Hub (schema analítico)        | Portal Elkys, zona `/portal/analytics` |
| **Observabilidade / Infra**    | Telemetria operacional                  | Ferramenta de observabilidade + Hub | Portal Elkys, zona `/portal/infra`     |
| **Produto Sonnar / Dashy / N** | Transacional, autônomo                  | Banco do próprio produto            | Aplicação independente do produto      |

Os três últimos contextos do portal (Core, Analytics, Infra) **não têm dados
transacionais próprios**. Eles são camadas de leitura. Isso é deliberado: quem
escreve dado de produto é o produto. O portal só lê o consolidado.

### 1.3 Separação de responsabilidades

```
                       +----------------------------+
                       |        PORTAL ELKYS         |
                       |   (um SPA, quatro zonas)    |
                       +----------------------------+
                       |  ops      | core            |
                       |  (SH)     | (executivo)     |
                       |  analytics| infra           |
                       +----------------------------+
                          |              |
              escreve/le  |              | so le (read model)
                          v              v
                +-----------------+  +------------------+
                |  Banco Elkys    |  |   ELKYS HUB      |
                |  (operacao SH)  |  |  (consolidacao)  |
                +-----------------+  +------------------+
                                          ^   ^   ^
                                ingestao  |   |   |  ingestao
                          +---------------+   |   +----------------+
                          |                   |                    |
                  +---------------+   +---------------+    +-----------------+
                  |   SONNAR      |   |    DASHY      |    | PRODUTO FUTURO  |
                  | front/back/db |   | front/back/db |    | front/back/db   |
                  | auth/ops      |   | auth/ops      |    | auth/ops        |
                  +---------------+   +---------------+    +-----------------+
                  satelite autonomo   satelite autonomo    satelite autonomo
```

Regra de ouro: **as setas de ingestão só apontam dos produtos para o Hub.**
Nunca do Hub para os produtos, nunca de um produto para outro. Quem viola isso
está criando acoplamento que vai custar caro em 18 meses.

### 1.4 Comunicação entre produtos

Produtos **não conversam entre si**. Se Sonnar precisar de um dado do Dashy, a
resposta arquitetural padrão é: provavelmente não precisa, e se precisa, isso é
um sinal de que a fronteira entre eles está errada. A única comunicação legítima
é produto -> Hub (publicar métricas/eventos) e staff -> produto (operar via SSO).

Toda integração passa por um **contrato versionado** (ver seção 5). O Hub é o
único ponto de fan-in. Isso mantém o grafo de dependências em estrela, não em
malha. Malha é o que transforma N produtos em N-fatorial integrações frágeis.

### 1.5 Isolamento operacional

Cada produto pode cair, fazer deploy, migrar schema e ter incidente **sem
afetar nenhum outro produto nem o portal**. O portal, no pior caso, mostra
"métricas do Dashy desatualizadas há X horas" em vez de quebrar. Isso é
possível porque o portal lê do Hub (read model), e o Hub guarda o último
snapshot bem-sucedido de cada produto. Ingestão é assíncrona e tolerante a
falha por design.

### 1.6 Governança

Governança aqui significa: quem pode ver o quê, quem pode mexer no quê, e como
isso é auditado, atravessando os cinco contextos.

- **Catálogo de produtos**: uma tabela `products` no Hub é a fonte da verdade
  sobre quais produtos existem, seus ambientes, seus owners e seu estado
  (ativo, em construção, descontinuado). Tudo no command center deriva dela.
- **Política de acesso por contexto**: ver seção 6. O sócio vê tudo; um
  desenvolvedor de produto vê o produto dele e a operação; um cliente externo
  nunca entra nas zonas Core/Analytics/Infra.
- **Contratos de dados versionados**: mudança no schema de métricas de um
  produto é uma mudança de contrato e segue versionamento (v1, v2), não um
  "ajuste rápido".

### 1.7 Escalabilidade futura

A escalabilidade aqui é mais **organizacional** que técnica. O volume de dados
de um venture studio pequeno cabe em Postgres por muitos anos. O que precisa
escalar é a capacidade de **adicionar produtos e times sem reescrever nada**.
O padrão hub-and-spoke entrega isso: produto novo = implementar o contrato de
ingestão + registrar no catálogo. Zero mudança no portal além de configuração.

### 1.8 Riscos mapeados

**Riscos de acoplamento**

- _Banco compartilhado entre produtos._ O pior. Discutido na seção 4.
- _Auth compartilhado em runtime._ Segundo pior. Discutido na seção 6.
- _Lógica de domínio compartilhada._ Tentador ("ambos têm 'usuário'"), mas
  "usuário do Sonnar" e "usuário do Dashy" são conceitos diferentes que só
  parecem iguais. Compartilhar o tipo cria acoplamento semântico invisível.
- _O portal virar dependência de runtime dos produtos._ Se um produto precisar
  do portal no ar para funcionar, o isolamento morreu. O portal só consome.

**Riscos organizacionais**

- _Conway reverso._ Se uma só pessoa mantém tudo, a arquitetura vai degradar
  para monolito por gravidade, independente do desenho. Mitigação: disciplina
  de repositórios e de contratos, mesmo com time pequeno.
- _Centralização excessiva no Hub._ Se cada métrica nova exigir mudança no Hub,
  o Hub vira gargalo. Mitigação: o contrato de ingestão é genérico (séries
  temporais nomeadas), não uma coluna por métrica.
- _Spin-off difícil._ Se um produto crescer e virar empresa, a separação tem
  que ser limpa. A arquitetura federada garante isso de fábrica (ver 10.4).

**Riscos de performance**

- _Ingestão derrubando produto._ Se o Hub puxar dados do produto de forma
  síncrona e pesada, degrada o produto. Mitigação: produto publica snapshot
  pré-agregado; Hub nunca roda query analítica no banco de produção do produto.
- _Command center fazendo fan-out de queries._ Dashboard executivo que consulta
  N produtos ao vivo é lento e frágil. Mitigação: tudo pré-consolidado no Hub.

**Riscos de segurança**

- _Vazamento de métrica entre produtos / entre tenants._ Discutido na seção 9.
- _Chave de service account de produto exposta no frontend do portal._ Fatal.
  Ingestão é server-side. Discutido nas seções 6 e 9.
- _O command center como alvo de alto valor._ Ele concentra o financeiro de
  todo o ecossistema. Comprometê-lo é comprometer tudo. Hardening na seção 9.

---

## 2. Modelagem do portal Elkys

### 2.1 Duas grandes áreas, um portal

O portal passa a ter duas áreas macro, conforme pedido, mais três zonas de
apoio que servem a área executiva:

**A) Operação da software house** (`/portal/ops`)

Clientes, contratos, projetos, financeiro de serviço, suporte, deploys de
projeto de cliente, equipe, chamados, relatórios operacionais, automações de
cobrança. É essencialmente o portal admin atual, renomeado e reposicionado como
uma zona.

**B) Core executivo do ecossistema** (`/portal/core`)

Visão consolidada de produtos, métricas SaaS (MRR, ARR, churn, CAC, LTV, NRR),
custos de infraestrutura, health score por produto, crescimento, comparativos
entre produtos, fluxo de caixa consolidado do ecossistema.

As zonas de apoio:

- `/portal/analytics`: BI executivo, séries históricas, projeções, comparativos
  profundos, exportações. É o "Core" em modo analítico, para quem quer cavar.
- `/portal/infra`: observabilidade unificada (VPS, workers, scrapers, crons,
  Supabase, filas, uptime, custos técnicos, alertas).
- `/portal/products`: catálogo e launcher dos produtos. Cada card abre o produto
  (deep link via SSO) e mostra o resumo de saúde dele.

### 2.2 Por que não é tudo "admin"

O portal admin atual mistura tudo num só nível de navegação. Para um command
center isso não escala: o sócio que quer olhar churn não quer rolar por
"Contratos em validação". O desenvolvedor que cuida de projeto de cliente não
deveria nem ver "Fluxo de caixa consolidado do ecossistema".

A separação em zonas resolve isso com **context switching explícito**.

### 2.3 UX e arquitetura de navegação

O padrão recomendado é o **workspace switcher** (como Linear, Vercel, Notion):
um seletor de contexto no topo da sidebar que troca a "lente" do portal inteiro.

```
+----------------------------------------------------------+
| [ELKYS]  [ Operacao v ]              busca (Ctrl+K)  [@]  |
|          +------------------+                             |
|          | > Operacao SH    |   <- contexto atual         |
|          |   Command Center |                             |
|          |   Analytics      |                             |
|          |   Infra          |                             |
|          |   Produtos       |                             |
|          +------------------+                             |
+----------+-----------------------------------------------+
| SIDEBAR  |  CONTEUDO DA ZONA ATIVA                        |
| (muda    |                                                |
|  por     |  Cada zona tem sua propria sidebar,            |
|  zona)   |  seus proprios breadcrumbs, seu proprio        |
|          |  conjunto de paginas.                          |
+----------+-----------------------------------------------+
```

Princípios de UX:

- **A sidebar é função da zona.** Trocar de zona troca o menu inteiro. Isso
  evita a sidebar gigante de 30 itens. Cada zona tem 5 a 9 itens, no máximo.
- **O switcher é filtrado por permissão.** O usuário só vê as zonas que pode
  acessar. Um cliente externo nem sabe que Core existe.
- **Ctrl+K atravessa zonas.** A paleta de comando é global e pode levar a
  qualquer destino permitido, em qualquer zona. É o atalho que cola tudo.
- **Estado de zona persistido.** Ao voltar ao portal, o usuário cai na última
  zona usada. Sócio cai no Core, desenvolvedor cai na Operação, naturalmente.
- **Cada zona é um chunk lazy.** Quem nunca abre Analytics nunca baixa o código
  de Analytics. Isso mantém o bundle inicial enxuto (ver seção sobre rotas).

### 2.4 Dashboards: o que mostrar e como

A referência visual fornecida (`src/assets/icons/image.png`) é exatamente o
norte certo para o command center: **cards de KPI no topo**, **um gráfico de
série temporal dominante**, **tabelas densas mas legíveis** e uma **visão de
calendário/timeline** para o que é temporal. Esse vocabulário visual deve ser
reaproveitado com os tokens do design system atual (CVA + `cn()`), sem
introduzir biblioteca de UI nova.

Layout recomendado do dashboard do Core:

1. **Faixa de KPIs do ecossistema** (topo): MRR consolidado, crescimento MoM,
   churn agregado, runway/caixa. Cada card com sparkline e variação.
2. **Comparativo de produtos** (meio): uma linha por produto com MRR, usuários
   ativos, health score e tendência. Clicar abre o detalhe do produto.
3. **Gráfico dominante** (meio): MRR consolidado ao longo do tempo, empilhado
   por produto, para enxergar contribuição relativa.
4. **Alertas e anomalias** (lateral ou rodapé): churn acima do limite, custo de
   infra subindo, ingestão de produto atrasada, cron falhando.

O dashboard da Operação é diferente: pendências, receita de serviço, projetos
em risco de SLA, contratos em validação. Não misturar com métricas de produto.

### 2.5 Organização modular do código

```
src/
  app/                      # bootstrap, router raiz, providers
  zones/
    ops/                    # operacao software house (admin atual migra pra ca)
      routes.tsx
      pages/
      components/
    core/                   # command center executivo
      routes.tsx
      pages/
      components/
    analytics/
    infra/
    products/
  shared/
    design-system/          # ja existe, permanece
    data/                   # clientes de dados: supabase Elkys, cliente Hub
    auth/                   # AuthContext, guards
    components/              # NotificationBell, breadcrumbs, etc.
  contracts/                # tipos do contrato de ingestao (versionados)
```

Cada zona é autocontida: rotas, páginas e componentes próprios. O que é
genuinamente comum vai para `shared/`. Regra de revisão de PR: **uma zona não
importa de outra zona**. Se precisar, o código sobe para `shared/`. Isso é o
isolamento arquitetural dentro do próprio SPA.

---

## 3. Estrutura de rotas

### 3.1 Princípio: zonas no caminho, sem subdomínio

Tudo sob `elkys.com.br`. Sem `admin.elkys.com.br`, sem `app.elkys.com.br`. A
separação é por **prefixo de rota**, e cada prefixo é um bounded context.

### 3.2 Árvore de rotas proposta

```
elkys.com.br
│
├── /                         Site público de marketing (inalterado)
├── /cases  /servicos/:slug   ...
│
├── /portal                   Casca autenticada (ProtectedRoute + guards)
│   │
│   ├── /portal/ops            ZONA: Operacao da Software House
│   │   ├── /                  visao geral operacional
│   │   ├── /clientes
│   │   ├── /projetos
│   │   ├── /contratos
│   │   ├── /financeiro        financeiro de SERVICO (nao de produto)
│   │   ├── /cobranca
│   │   ├── /suporte
│   │   ├── /equipe
│   │   └── /tarefas
│   │
│   ├── /portal/core           ZONA: Command Center Executivo
│   │   ├── /                  dashboard consolidado do ecossistema
│   │   ├── /produtos/:id      detalhe executivo de um produto
│   │   ├── /financeiro        consolidacao financeira do ecossistema
│   │   ├── /metricas          MRR, ARR, churn, CAC, LTV, NRR
│   │   └── /comparativo       produto vs produto
│   │
│   ├── /portal/analytics      ZONA: BI Executivo
│   │   ├── /                  exploracao de series historicas
│   │   ├── /projecoes
│   │   ├── /coortes
│   │   └── /relatorios
│   │
│   ├── /portal/infra          ZONA: Observabilidade
│   │   ├── /                  single pane: uptime, erros, custos
│   │   ├── /servicos/:id      VPS, worker, cron, fila especifico
│   │   ├── /custos
│   │   └── /alertas
│   │
│   ├── /portal/products       ZONA: Catalogo / Launcher
│   │   └── /:slug             card -> deep link SSO para o produto
│   │
│   └── /portal/cliente        ZONA: Portal do Cliente (inalterado)
│       └── ...
│
└── (produtos)                 Sonnar e Dashy: aplicacoes proprias.
                               Hospedagem decidida na secao 3.4.
```

### 3.3 Guarda de rota por zona

A cadeia de guards atual (`ProtectedRoute` -> `MustChangePasswordGuard` ->
`PortalRoleGuard` -> Layout) é estendida com um **`ZoneGuard`** por zona:

```
/portal/core/*  ->  ZoneGuard zone="core"  exige role executiva
/portal/ops/*   ->  ZoneGuard zone="ops"   exige role operacional
/portal/infra/* ->  ZoneGuard zone="infra" exige role tecnica/executiva
```

O `ZoneGuard` é a fronteira de segurança no frontend. A fronteira real
continua sendo RLS no banco (frontend só esconde, não protege).

### 3.4 Onde ficam os produtos: a decisão honesta

Aqui está a tensão real do pedido. Você quer (a) sem subdomínio, (b) tudo
"dentro de elkys.com.br", (c) produtos com frontend/backend próprios e
isolados. Essas três coisas juntas só fecham de duas formas. É preciso
escolher, e a escolha tem custo de infraestrutura.

**Opção A: produtos em domínios próprios, integrados por SSO e launcher.**
Sonnar vive em `sonnar.com.br` (ou `sonnar.app`), Dashy em `dashy.app`. O
portal Elkys em `/portal/products` lista os produtos e abre cada um por deep
link com SSO. "Dentro do ecossistema" passa a significar identidade unificada,
branding e governança comuns, não a mesma URL.

- Prós: zero infraestrutura nova, isolamento total, spin-off trivial, é como
  Google opera (Gmail, Drive, Calendar em domínios/paths distintos sob uma
  identidade só).
- Contras: a URL não é literalmente `elkys.com.br/sonnar`.

**Opção B: roteamento por path com reverse proxy.** `elkys.com.br/sonnar` é
servido pela aplicação do Sonnar via um proxy de borda (Cloudflare Workers,
regras de rewrite, ou similar). Mesmo respeitando "sem subdomínio e tudo sob
elkys.com.br", as aplicações continuam separadas e isoladas: o proxy só
reescreve o caminho.

- Prós: a URL fica literalmente `elkys.com.br/<produto>`.
- Contras: exige uma camada de borda nova. O deploy atual (FTP estático para
  Hostinger) **não suporta isso**. Seria necessário pôr Cloudflare na frente
  do domínio e mover o roteamento para lá. Há risco de colisão de paths,
  complexidade de cookies/CORS e custo de manutenção do proxy.

**Recomendação:** comece pela **Opção A**. Ela entrega 95% do valor ("ecossistema
unificado") com 5% do custo, e não pede mudança de infraestrutura. Reservar a
Opção B para quando houver razão concreta de marketing/SEO para a URL única, e
nesse momento adotar Cloudflare como borda (o que, aliás, resolve de quebra o
CSP ausente e o rate limiting, vide seções 7 e 9). O importante: **a decisão de
URL é uma decisão de borda/roteamento, e é independente da arquitetura de
isolamento.** Não deixe a vontade de ter `/sonnar` na URL contaminar o desenho
dos sistemas.

---

## 4. Arquitetura dos produtos

### 4.1 O que permanece dentro de cada produto

Tudo que é **domínio e operação do produto**. Em Sonnar e em Dashy, isolados:

- Frontend, backend, banco de dados, autenticação de usuário final.
- Toda a lógica de negócio do produto.
- O ciclo de deploy, as migrações de schema, os feature flags do produto.
- Os dados dos clientes do produto (multi-tenant interno do produto, se houver).
- A operação: incidentes, logs, suporte do produto.

O produto é **soberano sobre o próprio domínio**. O portal Elkys não opina
sobre como o Sonnar modela os dados dele.

### 4.2 O que é centralizado na Elkys (no Hub)

Apenas **camadas transversais de leitura e governança**:

- **Catálogo de produtos** (fonte da verdade sobre quais produtos existem).
- **Read model consolidado**: métricas, financeiro e telemetria que os produtos
  publicam. É cópia derivada, não a fonte.
- **Identidade de staff** (SSO para a equipe interna, ver seção 6).
- **Observabilidade agregada** (o "single pane").
- **Auditoria agregada** de acesso de staff.

### 4.3 O que pode ser compartilhado (com cuidado)

- **Design tokens / design system**, como pacote npm versionado, se você quiser
  consistência visual entre produtos. Compartilhar **build artifacts**
  (tokens, componentes burros) é seguro. Compartilhar **componentes com lógica
  de negócio** não é.
- **Bibliotecas utilitárias puras** (formatação de data, helpers de moeda).
- **O contrato de ingestão** (tipos TypeScript do payload de métricas), como
  pacote versionado consumido pelo produto e pelo Hub.

Tudo isso é compartilhamento de **código sem estado**, distribuído por versão.
Cada produto escolhe quando atualizar. Isso é compartilhar sem acoplar.

### 4.4 O que nunca deve ser compartilhado

- **Banco de dados.** Nunca entre produtos. Detalhado abaixo.
- **Instância de auth em runtime.** Cada produto tem o seu. Detalhado na seção 6.
- **Tipos de domínio de negócio.** "Usuário", "Plano", "Assinatura" significam
  coisas diferentes em cada produto. Compartilhar o tipo congela os dois
  produtos no mesmo modelo mental.
- **Estado de runtime** (sessões, caches, filas). Cada produto tem o seu.

### 4.5 Riscos de compartilhar banco

Compartilhar um banco entre Sonnar e Dashy parece economia. É a decisão mais
cara que se pode tomar. Os riscos concretos:

- **Raio de explosão.** Uma migração ruim, um lock longo, um `DELETE` sem
  `WHERE` derruba os dois produtos de uma vez. Incidente de um vira incidente
  de todos.
- **Acoplamento de migração.** Sonnar não pode evoluir o schema sem considerar
  o Dashy. As releases ficam amarradas. A velocidade de cada time cai.
- **Vizinho barulhento.** Uma query pesada do Dashy consome I/O e degrada o
  Sonnar. Sem isolamento de recursos, performance de um afeta o outro.
- **Fronteira de segurança fraca.** Um bug de RLS ou uma credencial vazada em
  um produto expõe os dados do outro. Bancos separados são uma fronteira
  física; RLS é uma fronteira lógica, mais fácil de furar.
- **Spin-off inviável.** Vender ou separar um produto exige então uma cirurgia
  de extração de dados de um banco compartilhado. Com bancos separados, é só
  transferir o projeto.
- **Conformidade e backup.** Retenção, LGPD, backup e restore ficam acoplados.
  Restaurar o Dashy a um ponto no tempo não pode reverter o Sonnar junto.

Veredito: **um projeto Supabase (ou banco) por produto.** Sem exceção. O custo
de mais um projeto Supabase é desprezível perto do custo de desacoplar depois.

### 4.6 Riscos de compartilhar auth

Detalhado na seção 6. Resumo: compartilhar auth de **usuário final** entre
produtos acopla os produtos e cria um ponto único de falha de segurança que,
se cair, derruba o login de tudo. Auth de **staff** pode e deve ser unificada
via SSO, porque aí o objetivo é justamente uma identidade só para a equipe.

### 4.7 Riscos de compartilhar lógica de domínio

O acoplamento mais traiçoeiro porque é invisível no início. Quando dois
produtos importam o mesmo módulo `calcularAssinatura()`, qualquer mudança nas
regras de um produto força o outro a reagir. O módulo "comum" vira um campo
minado: ninguém mexe sem medo. A duplicação controlada (cada produto com a sua
cópia da regra) é mais barata que o acoplamento. Compartilhe dados sem regra
(formatação, tipos primitivos), nunca regra de negócio.

### 4.8 Riscos de centralização excessiva

O oposto também é risco. Se o Hub virar obrigatório para o produto funcionar,
ou se cada métrica nova exigir uma migração no Hub e um deploy do portal, o Hub
vira gargalo organizacional. Mitigações:

- O Hub é **assíncrono e opcional para o runtime do produto**. Produto funciona
  com o Hub offline; só a consolidação atrasa.
- O contrato de ingestão é **genérico**: o produto publica séries temporais
  nomeadas (`{ metric: "mrr", value, currency, ts }`), não exige coluna nova
  no Hub a cada métrica.
- Catálogo dirige a UI: produto novo aparece no command center por
  configuração de dados, não por código.

---

## 5. Integração entre sistemas

### 5.1 O que precisa fluir

- **Métricas SaaS** de cada produto para o Hub (MRR, usuários, churn, etc.).
- **Eventos de negócio** relevantes (nova assinatura, cancelamento, upgrade).
- **Telemetria de infra** (uptime, erros, custo) para observabilidade.
- **Dados financeiros** para consolidação de caixa do ecossistema.

### 5.2 Os modelos possíveis, comparados

| Modelo                      | Latência | Complexidade | Custo op. | Quando usar                              |
| --------------------------- | -------- | ------------ | --------- | ---------------------------------------- |
| **Pull / ETL agendado**     | Horas    | Baixa        | Baixo     | Métricas de negócio, snapshots diários   |
| **Push via webhook**        | Segundos | Média        | Baixo     | Eventos pontuais (cancelamento, upgrade) |
| **Fila / mensageria**       | Segundos | Média-alta   | Médio     | Quando o volume de eventos cresce        |
| **Event streaming (Kafka)** | ms       | Alta         | Alto      | Não use agora. Talvez nunca              |
| **API interna sob demanda** | ms       | Média        | Médio     | Drill-down ao vivo, pontual              |

### 5.3 Recomendação por fase

**Fase 1 (agora): pull-based, simples e robusto.**

Cada produto expõe **um endpoint de métricas** (`GET /internal/metrics`),
protegido por token de service account, que devolve um snapshot pré-agregado.
O Hub roda um job agendado (Supabase Cron / pg_cron) que, para cada produto no
catálogo, busca o snapshot e grava no read model.

- Por que pull e não push: o Hub controla o ritmo, lida com produto offline
  sem perder dado (tenta de novo no próximo ciclo), e a falha é trivial de
  diagnosticar (o job logou erro). Não precisa de fila.
- Por que snapshot pré-agregado: o produto faz o `GROUP BY` no banco dele, no
  ritmo dele. O Hub nunca roda query analítica no banco de produção do produto.
- Frequência: diária para métricas financeiras, horária para health/uptime.

**Fase 2 (quando houver eventos que não podem esperar): webhooks.**

Cancelamento de assinatura, falha de pagamento e afins são eventos que o
executivo quer ver perto do tempo real. O produto dispara um webhook assinado
(HMAC) para um endpoint de ingestão do Hub. O Hub valida assinatura, idempotência
(deduplica por `event_id`) e grava.

**Fase 3 (só se o volume exigir): fila.**

Se o volume de eventos passar do que um endpoint síncrono aguenta, coloca-se
uma fila entre o webhook e o processamento (Supabase Queues ou pg-boss sobre o
próprio Postgres). Não é Kafka. Kafka resolve um problema de escala que um
venture studio pequeno não tem, e cobra caro em operação. A regra: adote fila
quando medir a dor, não por antecipação.

### 5.4 Consolidação financeira

É o caso mais delicado porque número financeiro errado destrói confiança no
sistema inteiro. Princípios:

- Cada produto publica o **financeiro dele em moeda de origem** com `as_of`
  (data de referência) explícito.
- O Hub guarda o histórico de snapshots (nunca sobrescreve; cada ingestão é uma
  linha nova). Isso permite auditar "o que o sistema sabia em tal data".
- Conversão de moeda usa taxa **datada e armazenada**, nunca taxa "de agora"
  aplicada a dado antigo.
- A consolidação é um **read model derivado e reconstruível**: se a lógica de
  consolidação mudar, recomputa-se a partir dos snapshots crus. Snapshot cru é
  sagrado e imutável; o consolidado é descartável.
- Reconciliação: um job compara o total consolidado com a soma das fontes e
  alerta divergência. Número que não fecha tem que gritar, não passar batido.

### 5.5 Agregação de analytics

Mesma filosofia. O produto publica séries temporais já agregadas no grão certo
(diário). O Hub apenas empilha e versiona. Drill-down profundo que o Hub não
tem é resolvido por **API interna sob demanda** (Fase 1 do modelo de API):
o portal, ao abrir o detalhe de um produto, pode fazer uma chamada autenticada
ao produto para um recorte específico, sem que isso passe pelo ETL.

### 5.6 Comunicação segura entre serviços

Toda chamada produto <-> Hub:

- Usa **service account com token de curta duração e escopo mínimo** (só
  leitura de métricas, ou só escrita de ingestão).
- É **server-to-server**. O token nunca toca o frontend. Detalhado na seção 9.
- Webhooks são **assinados (HMAC) e idempotentes**.
- Todo endpoint de ingestão tem **rate limit** e valida o `Content-Length`.

### 5.7 Custo, manutenção, ganho real

O modelo de Fase 1 (pull + ETL agendado) custa, em prática: um endpoint por
produto, um job de cron no Hub, uma tabela de snapshots. É manutenção de horas
por mês, não de uma pessoa dedicada. O ganho é o command center inteiro
funcionando com dados confiáveis. A tentação de "já fazer event-driven direito"
é o erro clássico: paga-se complexidade alta hoje por um ganho que só
materializa num volume que talvez nunca chegue. Construa a Fase 1, meça, evolua.

---

## 6. Autenticação e governança

### 6.1 A distinção que resolve quase tudo

Há **dois tipos de identidade** e eles têm respostas opostas:

- **Usuário final do produto** (cliente do Sonnar, cliente do Dashy).
- **Staff / equipe Elkys** (sócios, devs, designers, financeiro).

### 6.2 Auth de usuário final: NÃO centralizar

Cada produto mantém **a própria autenticação de usuário final**, isolada.

Por quê:

- **Isolamento de blast radius.** Auth central caída derruba o login de todos
  os produtos ao mesmo tempo. Auth por produto contém o incidente.
- **Independência de evolução.** Sonnar pode adotar login social, Dashy pode
  exigir MFA, sem coordenação.
- **Modelos de identidade diferentes.** Um produto pode ser B2B com
  organizações, outro B2C com conta individual. Forçar um auth comum força um
  modelo de identidade comum, que é acoplamento de domínio (seção 4.7).
- **Spin-off limpo.** Vender o produto leva junto a base de usuários dele, sem
  desentrelaçar de um auth comum.
- **Superfície de ataque menor.** Um auth central de usuário final é um alvo
  que, comprometido, vaza os clientes de todo o ecossistema.

### 6.3 Auth de staff: SIM, centralizar (SSO)

Para a equipe interna, o objetivo é o oposto: **uma identidade só** para entrar
no portal e em qualquer ferramenta interna. Aqui SSO faz sentido.

Opções:

- **Projeto Supabase dedicado como IdP** para staff (caminho de menor custo,
  fica na stack atual).
- **IdP gerenciado** (algo como WorkOS, Auth0, Clerk) se você quiser SAML/OIDC
  pronto, provisionamento e off-boarding centralizado. Custo mensal, mas
  resolve governança de acesso de uma vez.

Recomendação: começar com o **Supabase dedicado para staff**, migrar para IdP
gerenciado quando o time passar de ~10 pessoas ou quando surgir exigência de
SAML por algum cliente enterprise.

### 6.4 RBAC e permissões organizacionais

O modelo de roles atual (roles na tabela `user_roles`, não no JWT, conforme
ADR-002) é mantido e estendido para duas dimensões:

```
permissao = (zona/contexto)  x  (papel)

Zonas:   ops | core | analytics | infra | products | cliente
Papeis:  socio | exec | gestor_op | dev | designer | financeiro |
         comercial | suporte | cliente

Exemplos:
  socio        -> todas as zonas, leitura/escrita
  financeiro   -> ops/financeiro + core/financeiro + analytics (leitura)
  dev (produto X) -> ops + infra/servicos do produto X
  comercial    -> ops (crm) ; sem acesso a core/analytics/infra
  cliente      -> apenas /portal/cliente
```

Princípio: **acesso ao Core e ao financeiro consolidado é exceção, não regra.**
A maioria do time vê só a Operação. O command center é para quem decide.

### 6.5 Acesso multi-produto e segregação

Um desenvolvedor que trabalha no Sonnar tem acesso ao Sonnar; não tem,
automaticamente, ao Dashy. A permissão é **por produto**, derivada do catálogo.
Isso é segregação de permissão: o vazamento de credencial de quem cuida do
Sonnar não dá acesso ao Dashy.

### 6.6 Service accounts

Toda integração máquina-a-máquina (ingestão produto -> Hub, observabilidade)
usa **service account**, não conta de pessoa:

- Identidade própria, sem login interativo.
- Escopo mínimo (a do ETL só lê métricas; a de ingestão só grava no Hub).
- Token de curta duração, rotacionável, com a chave fora do código.
- Aparece na auditoria como ator distinto ("svc-etl-sonnar"), nunca confundida
  com ação humana.

### 6.7 Auditoria e logs de acesso

- **Auditoria de staff centralizada** no Hub: quem entrou em qual zona, quem
  viu o financeiro consolidado, quem mudou configuração de produto.
- **Auditoria de produto** permanece no produto (quem fez o quê no Sonnar é
  problema do Sonnar).
- Acesso a dados financeiros consolidados é **sempre logado**, inclusive
  leitura. É o dado mais sensível do ecossistema.
- Logs de acesso são append-only e retidos.

### 6.8 Quando centralizar, quando não

| Item                  | Centralizar? | Razão                               |
| --------------------- | ------------ | ----------------------------------- |
| Auth de usuário final | Não          | Isolamento, blast radius, spin-off  |
| Auth/SSO de staff     | Sim          | Objetivo é identidade única do time |
| Catálogo de produtos  | Sim          | Fonte da verdade do ecossistema     |
| RBAC de staff         | Sim          | Governança transversal              |
| RBAC de usuário final | Não          | É domínio de cada produto           |
| Auditoria de staff    | Sim          | Visão de governança                 |
| Auditoria de produto  | Não          | Domínio do produto                  |
| Secrets de produto    | Não          | Cada produto gere os seus           |

Impacto em segurança de centralizar errado: auth de usuário final central vira
ponto único de falha e alvo de alto valor. Impacto em manutenção de centralizar
errado: cada produto fica refém do calendário de releases do auth central.

---

## 7. Observabilidade e infraestrutura

### 7.1 O estado atual e a lacuna

O diagnóstico interno já registra que **não há observabilidade** estruturada e
que **não há ambiente de staging** (notas `13-issues/no-observability` e
`13-issues/no-staging-environment`), além de **falta de visibilidade dos crons**
(`13-issues/cron-observability`). Um command center sem essa camada é um carro
de corrida sem painel. É a primeira fundação técnica a construir.

### 7.2 O que precisa ser observado

| Categoria                       | Sinais                                              |
| ------------------------------- | --------------------------------------------------- |
| VPS / workers / scrapers        | CPU, memória, disco, processo vivo, reinícios       |
| Cron jobs (Supabase + produtos) | Última execução, sucesso/falha, duração, atraso     |
| Supabase (cada projeto)         | Conexões, erros, latência de query, uso de disco    |
| APIs / Edge Functions           | Taxa de erro, latência p50/p95/p99, throughput      |
| Filas (quando existirem)        | Profundidade, idade da mensagem mais velha, DLQ     |
| Uptime                          | Disponibilidade externa de cada produto e do portal |
| Custos                          | Gasto por produto: Supabase, VPS, e-mail, terceiros |
| Logs                            | Centralizados, pesquisáveis, correlacionáveis       |

### 7.3 Arquitetura da camada de observabilidade

```
  Sonnar   Dashy   Portal   VPS/workers   Supabase x N
    |        |        |          |             |
    +--------+--------+----+-----+-------------+
                           |
                  agente / coletor de telemetria
                           |
            +--------------+---------------+
            |              |               |
       metricas         logs           uptime/erros
            |              |               |
            +--------------+---------------+
                           |
              Ferramenta de observabilidade
                           |
       +-------------------+--------------------+
       |                                        |
   Alertas (e-mail/Slack)        Hub: snapshot de saude por produto
                                          |
                                  /portal/infra le aqui
```

O `/portal/infra` **não substitui** a ferramenta de observabilidade. Ele mostra
o **resumo executivo** (health score, custo, status) lendo do Hub. Para cavar
um incidente, o link leva à ferramenta especializada. Não reimplemente Grafana
dentro do portal.

### 7.4 Ferramentas recomendadas

Para um venture studio pequeno, priorize **gerenciado** sobre **self-hosted**
(self-hosted de observabilidade vira um sistema a mais para manter):

- **Erros e tracing**: Sentry. Maduro, barato no início, cobre frontend e
  backend.
- **Uptime e alertas**: Better Stack (Uptime) ou similar. Checagem externa,
  status page, alerta por canal.
- **Logs e métricas**: Better Stack Logs, Axiom ou Grafana Cloud (free tier
  generoso). Grafana Cloud se você quiser dashboards técnicos ricos.
- **Supabase**: usar os logs e os advisors nativos; o coletor puxa o resto.
- **Self-hosted (Grafana + Prometheus + Loki)**: só quando o custo gerenciado
  doer ou houver exigência de dado on-premise. Não é o ponto de partida.

### 7.5 Métricas e dashboards que importam

Dashboard de Infra (`/portal/infra`), de cima para baixo:

1. **Semáforo por produto**: verde/amarelo/vermelho com base em uptime + erro +
   atraso de cron.
2. **Custo de infra do mês**, por produto, com tendência. Custo subindo sem
   receita subindo é alerta.
3. **Saúde de jobs**: tabela de crons com última execução e status. Resolve
   diretamente a lacuna `cron-observability`.
4. **Erros recentes**: taxa de erro por serviço, com link para o Sentry.
5. **Ingestão**: quando cada produto reportou pela última vez. Ingestão atrasada
   significa command center desatualizado, e isso tem que ser visível.

### 7.6 Pré-requisito de governança: staging

Sem um ambiente de staging, toda mudança é testada em produção. Para um
ecossistema com financeiro consolidado, isso é inaceitável. Criar staging
(ao menos para o portal e para o Hub) é parte da fundação, não um "depois".

---

## 8. BI executivo

### 8.1 Camadas

```
  Camada de origem    : bancos dos produtos (Sonnar, Dashy, ...)
         |  (ETL: pull de snapshots, secao 5)
         v
  Camada de dados     : Elkys Hub - schema "raw" (snapshots imutaveis)
         |  (transformacao: SQL versionado / dbt quando crescer)
         v
  Camada analitica    : Hub - schema "mart" (read model por assunto:
                        finance, growth, product_health)
         |
         v
  Camada de consumo   : /portal/core e /portal/analytics (React + API do Hub)
                        + ferramenta de exploracao (Metabase) para ad-hoc
```

### 8.2 Data layer: regras

- **Snapshot cru é imutável.** Cada ingestão grava linha nova com `as_of` e
  `ingested_at`. Nunca sobrescreve. É a fonte da verdade auditável.
- **O mart é derivado e reconstruível.** Mudou a definição de churn? Recomputa
  o mart a partir do raw. Nenhum dado se perde.
- **Tudo datado.** Toda métrica tem a data a que se refere e a data em que foi
  capturada. Sem isso, não dá para responder "o que sabíamos em março".

### 8.3 Quando usar data warehouse, quando não

**Não use warehouse agora.** Postgres (o próprio Hub) é mais que suficiente para
o volume de um venture studio pequeno por vários anos. Um warehouse dedicado
(BigQuery, ClickHouse, Snowflake) adiciona custo, um pipeline a mais e uma
tecnologia a mais para operar.

**Use warehouse quando** (e só quando) um destes for verdade, medido:

- As queries analíticas no Postgres começam a degradar o resto do Hub.
- O volume de eventos crus passa de dezenas de milhões de linhas por mês.
- Você precisa cruzar dados de muitas fontes externas (ads, billing externo).

Quando esse dia chegar, o caminho natural é ClickHouse (excelente para série
temporal, barato) ou BigQuery (zero operação, paga por uso), alimentado pelo
mesmo raw layer. Como o raw já existe e é imutável, a migração é aditiva.

### 8.4 Métricas SaaS: definir antes de medir

O maior risco de BI não é técnico, é semântico: cada tela usar uma definição
diferente de "churn". Defina cada métrica **uma vez**, em SQL versionado no
mart, e todo consumidor lê dali:

- **MRR**: receita recorrente normalizada para o mês. Anual dividido por 12.
- **ARR**: MRR x 12.
- **Churn**: distinguir churn de logo (clientes) de churn de receita (MRR), e
  bruto de líquido.
- **NRR (Net Revenue Retention)**: expansão menos contração menos churn na base
  existente. A métrica que melhor prevê saúde de SaaS.
- **CAC**: custo de aquisição. Exige dado de gasto de marketing/vendas, que vem
  da Operação da software house, não do produto.
- **LTV**: valor do tempo de vida. LTV/CAC abaixo de 3 é alerta.
- **Health score por produto**: índice composto (crescimento de MRR, churn,
  engajamento, uptime) que vira o semáforo do command center.

CAC e LTV mostram por que o portal precisa das duas áreas juntas: a receita vem
do produto, o custo de aquisição vem da operação. O command center é o único
lugar onde os dois se encontram.

### 8.5 Projeções, comparativos, alertas

- **Projeções**: comece com extrapolação simples de tendência (regressão linear,
  média móvel). Não construa modelo preditivo sofisticado para um histórico de
  poucos meses; não há dado suficiente e o resultado engana.
- **Comparativos**: produto vs produto na mesma métrica e mesmo grão; produto
  vs ele mesmo período anterior.
- **Alertas por limiar**: churn acima de X%, runway abaixo de N meses, custo de
  infra acima do orçado. Limiar é simples, explicável e suficiente para começar.
- **Detecção de anomalia**: depois dos limiares, um passo estatístico simples
  (z-score sobre a série, ou desvio da média móvel) pega o que o limiar fixo
  não pega. Machine learning de anomalia só com histórico longo e dor real.
- **Insights automáticos**: um job que traduz os números em frase ("MRR do
  Dashy caiu 8% e o churn dobrou no mês") tem ótimo retorno e custo baixo.

### 8.6 Tecnologia de consumo

- **Dashboards executivos** (Core): construídos no próprio portal, em React,
  lendo a API do Hub. Controle total de UX, integrados ao design system,
  alinhados à referência visual de `src/assets/icons/image.png`.
- **Exploração ad-hoc** (Analytics avançado): **Metabase** apontado para o mart
  do Hub, em modo leitura. Resolve o "quero cruzar isso de um jeito que ninguém
  previu" sem virar feature do portal. Embarcável numa aba de `/portal/analytics`.
- **Não** construa um construtor de relatórios genérico dentro do portal. É um
  produto inteiro. Metabase já é esse produto.

### 8.7 Custo-benefício

A abordagem Postgres + SQL versionado + React + Metabase tem custo de
infraestrutura próximo de zero acima do que já existe, e entrega o command
center completo. O warehouse, o streaming e o ML são evoluções que se pagam
**quando o volume os justifica**. Construir BI "do jeito enterprise" antes da
escala enterprise é a forma mais comum de gastar seis meses e não entregar o
dashboard que o sócio queria ver na semana um.

---

## 9. Segurança

### 9.1 Auditoria arquitetural preventiva

O command center concentra o dado mais valioso do ecossistema: o financeiro de
todos os produtos. Ele é, por construção, o alvo de maior valor. A segurança
dele não é um item de checklist, é requisito de projeto.

### 9.2 OWASP, aplicado ao desenho

- **Broken Access Control**: a falha número um. Mitigação: RLS no banco como
  fronteira real (o `ZoneGuard` do frontend só esconde); cada zona com política
  explícita; negar por padrão.
- **Injection**: queries parametrizadas sempre; nos endpoints de ingestão,
  validar e tipar todo payload (Zod) antes de tocar o banco.
- **Security Misconfiguration**: o **CSP ausente** já está mapeado como issue
  (`13-issues/security-csp-missing`). Adotar CSP é pré-requisito de ir a
  produção com o command center. Se a Opção B (Cloudflare) for adotada, o CSP
  e os headers de segurança ficam centralizados na borda.
- **Identification/Auth Failures**: SSO de staff com MFA obrigatório para quem
  acessa Core e financeiro.
- **SSRF**: o ETL do Hub busca dados de URLs de produtos. As URLs vêm do
  catálogo controlado, nunca de input de usuário. Allowlist estrita.
- **Logging Failures**: auditar acesso a dado financeiro, inclusive leitura.

### 9.3 Isolamento entre produtos

Bancos separados, auth separada, deploy separado. Esse é o isolamento mais
forte possível: é físico, não lógico. Um comprometimento total do Sonnar não
alcança o Dashy, porque não há caminho de um para o outro. O único elo é o Hub,
e o Hub só **recebe** dados; um produto comprometido pode, no pior caso, enviar
métrica falsa ao Hub (problema de integridade de dado, contornável com
reconciliação), não pivotar para outro produto.

### 9.4 Vazamento de métricas

O risco: alguém com acesso a um produto consegue ver as métricas de outro, ou
um cliente externo enxerga dado consolidado.

- O read model do Hub tem **RLS por produto e por papel**. Ver métrica de um
  produto exige permissão àquele produto.
- O dado consolidado do ecossistema é visível apenas a papéis executivos.
- O `/portal/cliente` não tem **nenhum** caminho de rota nem de dados para o
  Hub. São mundos separados, garantido por RLS, não só por roteamento.

### 9.5 Riscos multi-tenant

Dentro de cada produto, multi-tenancy é problema do produto. No Hub, o "tenant"
é o produto: a tabela de snapshots tem `product_id` e toda query é forçada a
filtrar por ele via RLS. O teste de regressão obrigatório: um service account
do Sonnar tentando ler snapshot do Dashy recebe vazio, não erro disfarçado.

### 9.6 Riscos financeiros

- **Integridade**: número financeiro é imutável após ingestão; correção é
  linha nova, nunca update. O job de reconciliação alerta divergência.
- **Confidencialidade**: acesso ao financeiro consolidado é o anel mais
  interno, restrito, com MFA e auditoria de leitura.
- **Disponibilidade**: o Hub guarda o último snapshot bom; produto offline
  degrada graciosamente ("dado de 6h atrás"), não quebra a tela.

### 9.7 Auth leakage e permissões cruzadas

- O frontend do portal **nunca** carrega chave de service role nem credencial
  de produto. Toda chamada privilegiada (ETL, ingestão) é server-side, em Edge
  Function ou serviço, com a chave em secret de servidor.
- Permissão é verificada no banco (RLS), não confiando em estado do cliente.
- Tokens de staff: curta duração, refresh seguro, timeout de inatividade (o
  portal já faz isso, 30 min; manter e estender ao Hub).

### 9.8 Rate limiting

- Endpoints de ingestão e webhooks: rate limit por service account.
- Endpoint de métricas dos produtos: rate limit, para que um Hub com bug não
  martele o produto.
- Login de staff: rate limit anti força-bruta.
- Centralizar isso na borda (Cloudflare) é o caminho mais limpo se a Opção B
  for adotada; caso contrário, rate limit nas Edge Functions.

### 9.9 Auth service-to-service

- Service accounts com escopo mínimo (seção 6.6).
- Webhooks assinados com HMAC e verificação de timestamp (anti-replay).
- Idempotência por `event_id` em toda ingestão.
- mTLS é exagero nesta escala; HMAC + token curto + HTTPS é suficiente e
  proporcional.

### 9.10 Gestão de secrets

- Secrets fora do código e fora do repositório, sempre.
- Um gerenciador de secrets (Doppler, Infisical, ou os secrets nativos do
  Supabase e do provedor de VPS) por ambiente.
- Rotação periódica das chaves de service account.
- Princípio do menor privilégio: a chave do ETL lê métrica e nada mais.
- Cada produto gere os próprios secrets; o Hub não é cofre dos produtos.

---

## 10. Escalabilidade futura

### 10.1 Novos produtos

Adicionar o terceiro, quarto, quinto produto é, por desenho, barato:

1. O produto implementa o contrato de ingestão (endpoint de métricas).
2. Registra-se uma linha no catálogo de produtos do Hub.
3. O command center, o Analytics e o Infra passam a mostrá-lo automaticamente.

Zero alteração de código no portal. Essa é a prova de que a arquitetura
escala: o custo marginal de um produto é configuração, não engenharia.

### 10.2 Múltiplos times

- **Um repositório por produto.** Times não disputam o mesmo repo.
- Código compartilhado (design tokens, contrato) distribuído como **pacote
  versionado**. Cada time atualiza no seu ritmo.
- Se a quantidade de pacotes compartilhados crescer, um **monorepo só para o
  que é compartilhado** (ou um registry npm privado) organiza isso. Os produtos
  permanecem em repos separados.
- O contrato de ingestão é a interface entre times: enquanto ele é respeitado,
  os times não precisam se coordenar no dia a dia.

### 10.3 Novos sócios e investimento

- O command center **é** o material de due diligence: MRR, churn, NRR, custos,
  por produto, com histórico auditável. Um investidor pede exatamente isso.
- A auditoria de acesso e a governança de RBAC mostram maturidade operacional.
- O histórico imutável de snapshots dá credibilidade aos números (não é uma
  planilha que alguém pode ter editado).

### 10.4 Separação de empresas (spin-off)

Este é o teste final da arquitetura, e ela passa:

- O produto já tem **banco, auth, deploy, operação e repositório próprios**.
  Separá-lo é transferir a posse desses ativos, não fazer cirurgia de extração.
- O único laço a cortar é a ingestão para o Hub e o SSO de staff. Cortar é
  remover a linha do catálogo e revogar a service account.
- Compare com o cenário de banco compartilhado: lá, o spin-off é um projeto de
  meses. Aqui, é uma tarde.

A arquitetura federada é, na prática, uma **opção de venda** embutida em cada
produto. Isso tem valor estratégico real para um venture studio.

### 10.5 Internacionalização

- **i18n** no portal e nos produtos como camada desde cedo (mesmo que só pt-BR
  ative agora), para não reescrever depois.
- **Multi-moeda** já tratado na consolidação financeira (seção 5.4): moeda de
  origem por produto, conversão datada.
- Fuso horário: armazenar tudo em UTC, apresentar no fuso do usuário.

### 10.6 Múltiplos ambientes

`dev` -> `staging` -> `produção`, para o portal e para o Hub no mínimo. Staging
é hoje uma lacuna conhecida e é pré-requisito para operar um sistema com
financeiro consolidado. Cada produto gere os próprios ambientes.

### 10.7 Expansão de infraestrutura

A stack atual (Supabase + Hostinger + VPS) leva o ecossistema longe. Os pontos
de evolução previsíveis, por gatilho:

- **Borda (Cloudflare)**: quando quiser URL unificada, CSP e rate limit
  centralizados.
- **Fila real**: quando o volume de eventos medir dor.
- **Warehouse**: quando o volume analítico medir dor (seção 8.3).
- **Sair do FTP estático**: o deploy por FTP é frágil para um sistema crítico;
  migrar o portal para um host com deploy atômico e rollback é melhoria de
  maturidade, independente do resto.

Nenhuma dessas é urgente. Todas são aditivas. A arquitetura não precisa ser
refeita para acomodá-las, e esse é o ponto.

---

## 11. Roadmap

Prazos relativos a 2026-05-21. Curto = ~3 meses, Médio = ~3 a 9 meses, Longo =
9+ meses. `ROI` e `Risco` em escala B(aixo)/M(édio)/A(lto). `Compl` =
complexidade.

### 11.1 Curto prazo: fundações

| #   | Iniciativa                                                            | ROI téc | ROI org | Risco | Compl | Depende de |
| --- | --------------------------------------------------------------------- | ------- | ------- | ----- | ----- | ---------- |
| C1  | Reorganizar o portal em zonas (`ops/core/...`) com workspace switcher | A       | A       | B     | M     | nada       |
| C2  | Criar o **Elkys Hub** (projeto Supabase): catálogo + schema raw       | A       | A       | B     | B     | nada       |
| C3  | Definir o **contrato de ingestão v1** (pacote de tipos versionado)    | A       | M       | B     | B     | nada       |
| C4  | Endpoint de métricas + ETL pull para 1 produto (piloto: Sonnar)       | A       | A       | M     | M     | C2, C3     |
| C5  | Dashboard MVP do Core (KPIs + comparativo, 1 produto)                 | M       | A       | B     | M     | C4         |
| C6  | Camada de observabilidade mínima (Sentry + uptime + saúde de cron)    | A       | M       | B     | M     | nada       |
| C7  | Corrigir lacunas de base: **CSP**, **staging** do portal/Hub          | A       | M       | M     | M     | nada       |

Foco do curto prazo: provar o fluxo ponta a ponta com **um** produto. Não
tente integrar Sonnar e Dashy ao mesmo tempo. Um produto valida o contrato, o
ETL, o read model e o dashboard. O segundo produto vira só repetição.

### 11.2 Médio prazo: consolidação

| #   | Iniciativa                                                      | ROI téc | ROI org | Risco | Compl | Depende de |
| --- | --------------------------------------------------------------- | ------- | ------- | ----- | ----- | ---------- |
| M1  | Integrar o segundo produto (Dashy) ao Hub                       | M       | A       | B     | B     | C4         |
| M2  | Consolidação financeira do ecossistema (multi-moeda, datada)    | M       | A       | M     | M     | M1         |
| M3  | SSO de staff (Supabase dedicado como IdP) + RBAC por zona       | M       | A       | M     | M     | C1         |
| M4  | Zona `/portal/analytics` + Metabase sobre o mart                | M       | M       | B     | M     | M1         |
| M5  | Zona `/portal/infra` completa (custos, alertas, single pane)    | M       | M       | B     | M     | C6         |
| M6  | Webhooks para eventos near-real-time (cancelamento, falha pgto) | M       | M       | M     | M     | M1         |
| M7  | Alertas por limiar + insights automáticos                       | A       | A       | B     | B     | M2         |

### 11.3 Longo prazo: escala (sob demanda, não por antecipação)

| #   | Iniciativa                                               | Gatilho que justifica                      | Risco | Compl |
| --- | -------------------------------------------------------- | ------------------------------------------ | ----- | ----- |
| L1  | Borda Cloudflare (URL unificada, CSP/rate limit central) | Necessidade de marketing/SEO de URL única  | M     | M     |
| L2  | Fila real entre webhook e processamento                  | Volume de eventos medindo dor              | M     | M     |
| L3  | Data warehouse (ClickHouse ou BigQuery)                  | Volume analítico degradando o Hub          | M     | A     |
| L4  | Detecção estatística de anomalia                         | Histórico longo o suficiente               | B     | M     |
| L5  | Micro-frontends (Module Federation)                      | Um produto precisar ser embutido no portal | A     | A     |
| L6  | Sair do deploy FTP para host com deploy atômico          | Maturidade operacional                     | B     | M     |

Nota sobre L5: micro-frontends só se justificam se houver requisito real de
**embutir a UI de um produto dentro do portal**. Pelo desenho hub-and-spoke,
isso provavelmente nunca será necessário. Está na lista por completude, não
como recomendação.

### 11.4 Roadmap organizacional (paralelo ao técnico)

- **Curto**: definir os donos de cada zona e de cada produto. Documentar o
  contrato de ingestão como acordo entre times.
- **Médio**: política de acesso ao Core formalizada (quem vê financeiro
  consolidado). Onboarding/offboarding de staff via SSO.
- **Longo**: cada produto com seu próprio time e seu próprio P&L. O command
  center vira a ferramenta de governança do board.

### 11.5 Roadmap de migração

A migração é **incremental e sem big bang**:

1. O portal admin atual continua funcionando como está, sob a rota antiga,
   enquanto a zona `ops` é montada ao lado.
2. As páginas migram para `/portal/ops` em lotes; redirecionamentos cobrem as
   URLs antigas.
3. O Core nasce vazio e cresce produto a produto. Nunca há um momento de
   "desligar o velho e ligar o novo".
4. O Hub começa como um projeto Supabase pequeno e ganha schema conforme C2 a
   M2. Nada no portal depende do Hub estar "pronto"; depende só do que já
   existe nele.

Risco de migração: baixo, justamente porque é aditiva. O maior risco é
organizacional: começar várias frentes ao mesmo tempo. A disciplina é seguir a
ordem C1 -> C2/C3 -> C4 -> C5, em série, validando cada elo.

---

## 12. Entrega final: decisões críticas e trade-offs

### 12.1 As cinco decisões que definem tudo

1. **Hub-and-spoke, não monolito.** O portal consome um read model; não hospeda
   produtos. Trade-off: aceita-se latência de minutos/horas na consolidação em
   troca de isolamento total. Para decisão executiva, essa latência é
   irrelevante; o isolamento é tudo.

2. **Um banco e um auth de usuário final por produto.** Trade-off: mais
   projetos Supabase para gerir, em troca de blast radius contido, evolução
   independente e spin-off trivial. O custo é desprezível; o benefício é
   estrutural.

3. **Portal como SPA único com zonas, não micro-frontends.** Trade-off: deploy
   do portal continua acoplado entre zonas, em troca de simplicidade
   operacional enorme. Para um time pequeno, é a escolha certa. Micro-frontends
   resolvem um problema de escala de time que ainda não existe.

4. **SSO só para staff; auth de cliente fica no produto.** Trade-off: a equipe
   ganha identidade única e governança; os produtos não ganham um ponto único
   de falha. A distinção staff/usuário-final é o que torna isso possível.

5. **Pull/ETL simples antes de event-driven.** Trade-off: abre-se mão de tempo
   real total em troca de robustez, baixo custo e diagnóstico fácil. Webhooks e
   filas entram quando a dor for medida, não por antecipação.

### 12.2 Stack recomendada (consolidada)

| Camada            | Recomendação                                   | Observação                      |
| ----------------- | ---------------------------------------------- | ------------------------------- |
| Portal            | React 18 + Vite (atual), reorganizado em zonas | Sem framework de UI novo        |
| Banco operação SH | Supabase atual                                 | Inalterado                      |
| Elkys Hub         | Projeto Supabase dedicado                      | Catálogo + raw + mart           |
| Produtos          | Stack própria de cada um                       | Soberania por produto           |
| Integração        | Endpoint de métricas + ETL pull (pg_cron)      | Webhooks na fase 2              |
| Contrato          | Pacote npm de tipos versionado                 | Interface entre times           |
| SSO staff         | Supabase dedicado, depois IdP gerenciado       | Migra com o crescimento do time |
| Observabilidade   | Sentry + Better Stack / Axiom / Grafana Cloud  | Gerenciado                      |
| BI consumo        | React (Core) + Metabase (ad-hoc) sobre o mart  | Sem warehouse no início         |
| Secrets           | Doppler / Infisical / secrets nativos          | Por ambiente, com rotação       |
| Borda (futuro)    | Cloudflare                                     | Só quando justificar (L1)       |

### 12.3 Riscos residuais a vigiar

- **Disciplina sob time pequeno.** A arquitetura é boa; a gravidade do "resolve
  rápido" empurra para monolito. Mitigação: o contrato e a regra "zona não
  importa de zona" precisam ser tratados como invioláveis em revisão de código.
- **Confiança nos números.** Um número financeiro errado no command center
  custa caro em credibilidade. Mitigação: snapshots imutáveis, conversão
  datada, job de reconciliação que grita.
- **Hub como gargalo.** Mitigação: contrato genérico de séries temporais,
  catálogo dirigindo a UI, Hub assíncrono e opcional para o runtime do produto.
- **Sobre-engenharia.** O maior risco de um estudo deste tamanho é tentar
  construir a fase longa agora. A ordem do roadmap (C1 -> C5 em série, um
  produto piloto) é a salvaguarda.

### 12.4 O primeiro passo concreto

Se for para escolher uma única coisa para fazer na próxima semana: **C2 + C3**,
criar o Elkys Hub vazio e escrever o contrato de ingestão v1. São baratos, sem
risco, não dependem de nada, e destravam todo o resto. O dashboard bonito vem
depois; o contrato é o que decide se a arquitetura vai ser desacoplada ou não.

---

## Anexo: próximos passos no second brain

Conforme as regras do `CLAUDE.md`, estas atualizações no vault Obsidian são
**propostas** (não aplicadas). Sugiro, após validação deste estudo:

- Criar `12-decisions/ADR-013-hub-and-spoke-ecosystem.md` (decisão 12.1.1).
- Criar `12-decisions/ADR-014-db-auth-per-product.md` (decisões 12.1.2 e 12.1.4).
- Criar `12-decisions/ADR-015-portal-zones-no-subdomain.md` (decisão 12.1.3).
- Adicionar ao `14-roadmap/index.md` a trilha de ondas da seção 11.
- Vincular este documento em `01-architecture/system-overview.md` como o
  documento de visão de evolução do ecossistema.
