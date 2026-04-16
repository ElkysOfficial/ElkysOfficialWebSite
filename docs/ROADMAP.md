# Dashboard Administrativo — Roadmap de Funcionalidades

> Levantamento completo de funcionalidades para o painel administrativo da Elkys, classificadas por **impacto no negocio** e **complexidade tecnica** (medida pela necessidade de alteracoes no banco de dados).

---

## Criterios de Classificacao

| Dimensao         | Nivel | Descricao                                                                              |
| ---------------- | ----- | -------------------------------------------------------------------------------------- |
| **Impacto**      | Alto  | Afeta diretamente receita, retencao de clientes ou eficiencia operacional critica      |
|                  | Medio | Melhora a organizacao, visibilidade ou produtividade da equipe                         |
|                  | Baixo | Conveniencia, polimento de UX ou ganhos incrementais                                   |
| **Complexidade** | Baixa | Nenhuma alteracao no banco de dados; utiliza apenas dados e tabelas existentes         |
|                  | Media | Requer adicao de colunas ou criacao de 1-2 tabelas simples                             |
|                  | Alta  | Requer novas funcionalidades completas com multiplas tabelas e/ou integracoes externas |

---

## 1. Alto Impacto

### 1.1 Baixa Complexidade

Funcionalidades que geram valor imediato sem nenhuma alteracao no banco de dados.

#### 1.1.1 Dashboard de KPI Cards

Cartoes com metricas-chave exibidos na pagina inicial do admin: receita do mes, total de inadimplencia, tickets abertos, projetos em andamento e novos clientes no periodo.

- **Tabelas utilizadas:** `charges`, `projects`, `support_tickets`, `clients`
- **Justificativa:** Oferece visao instantanea da saude do negocio sem necessidade de navegar por multiplas paginas.

#### 1.1.2 Relatorio de Inadimplencia

Lista detalhada de cobrancas vencidas com informacoes de dias em atraso, valor, cliente associado e opcao de acao direta (enviar notificacao, gerar link de pagamento).

- **Tabelas utilizadas:** `charges` (filtro por `status` e `due_date` < hoje)
- **Justificativa:** Inadimplencia e o principal risco financeiro de uma agencia. Ter visibilidade imediata reduz o ciclo de cobranca.

#### 1.1.3 Pipeline de Projetos (Kanban Visual)

Visualizacao dos projetos organizados por coluna de status (`em_andamento`, `pausado`, `entregue`, `cancelado`) com possibilidade de arrastar entre colunas.

- **Tabelas utilizadas:** `projects` (campos `status` e `current_stage`)
- **Justificativa:** Permite ao gestor enxergar gargalos de entrega e redistribuir prioridades rapidamente.

#### 1.1.4 Fluxo de Caixa Mensal

Grafico comparando receitas (cobrancas pagas) versus despesas, com exibicao do saldo liquido mes a mes e possibilidade de filtrar por periodo.

- **Tabelas utilizadas:** `charges` (campo `paid_at` e `amount`) e `expenses` (campo `expense_date` e `amount`)
- **Justificativa:** Controle financeiro basico e indispensavel para tomada de decisao sobre investimentos e contratacoes.

#### 1.1.5 Alertas de Cobrancas Proximas

Painel com cobrancas que vencem nos proximos 7, 15 e 30 dias, incluindo cobrancas recorrentes de assinaturas, com opcao de gerar link de pagamento antecipado.

- **Tabelas utilizadas:** `charges` (campo `due_date`) e `project_subscriptions` (campo `due_day`)
- **Justificativa:** Prevencao de inadimplencia — atuar antes do vencimento e mais eficaz do que cobrar depois.

#### 1.1.6 Visao 360 do Cliente

Pagina unificada que consolida todas as informacoes de um cliente em um unico lugar: dados cadastrais, projetos, cobrancas, tickets de suporte, documentos e timeline de eventos.

- **Tabelas utilizadas:** Todas as tabelas vinculadas por `client_id`
- **Justificativa:** Elimina a necessidade de navegar entre multiplas telas para entender a situacao completa de um cliente.

#### 1.1.7 Relatorio de Receita por Cliente

Ranking dos clientes ordenados por receita gerada (cobrancas pagas), com filtros por periodo, tipo de cobranca e status do cliente.

- **Tabelas utilizadas:** `charges` (campos `paid_at`, `amount`, `client_id`) e `clients`
- **Justificativa:** Identifica os clientes mais valiosos e permite direcionar esforcos de retencao.

---

### 1.2 Media Complexidade

Funcionalidades de alto valor que exigem pequenas alteracoes no banco de dados.

#### 1.2.1 Metas Financeiras

Definicao de metas de faturamento por periodo (mensal, trimestral, anual) com barra de progresso comparando meta versus realizado.

- **Criar no banco:** Tabela `financial_goals` com campos: `id`, `period_start`, `period_end`, `target_amount`, `goal_type`, `created_at`
- **Justificativa:** Sem metas claras nao ha como medir crescimento. Visualizar o progresso motiva e orienta decisoes.

#### 1.2.2 Log de Atividades do Admin (Audit Trail)

Registro automatico de acoes administrativas: quem editou um cliente, aprovou uma cobranca, respondeu um ticket, alterou status de projeto.

- **Criar no banco:** Tabela `audit_logs` com campos: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `metadata`, `created_at`
- **Justificativa:** Rastreabilidade e essencial para equipes com mais de uma pessoa, alem de ser requisito para compliance.

#### 1.2.3 Tags e Categorias em Projetos

Categorizar projetos por tipo de solucao (site, aplicativo, marketing digital, manutencao) usando tags para facilitar filtros e relatorios.

- **Criar no banco:** Coluna `tags text[]` na tabela `projects` (mesmo padrao ja utilizado em `clients`)
- **Justificativa:** Permite segmentar relatorios por tipo de servico e entender a distribuicao do portfolio.

#### 1.2.4 Dashboard de SLA de Suporte

Metricas de desempenho do suporte: tempo medio de primeira resposta, tempo medio de resolucao, tickets por categoria e indice de satisfacao.

- **Criar no banco:** Colunas `first_response_at` e `resolved_at` na tabela `support_tickets`
- **Justificativa:** Medir a qualidade do atendimento e identificar gargalos no processo de suporte.

#### 1.2.5 Previsao de Receita (Forecast)

Projecao de receita futura baseada em assinaturas ativas, parcelas agendadas e contratos vigentes, com visao de 3, 6 e 12 meses.

- **Criar no banco:** View materializada ou coluna `forecast_amount` calculada a partir de `project_subscriptions` + `project_installments`
- **Justificativa:** Prever receita permite planejar investimentos, contratacoes e antecipar periodos de baixa.

---

### 1.3 Alta Complexidade

Funcionalidades de alto valor que exigem novas estruturas completas no banco de dados.

#### 1.3.1 Sistema de Propostas e Orcamentos

Criacao e envio de propostas comerciais diretamente pelo painel. O cliente recebe, visualiza e aprova pelo portal. Ao aprovar, o sistema gera automaticamente o projeto e as cobrancas.

- **Criar no banco:**
  - `proposals` — id, client_id, title, status (rascunho, enviada, aprovada, rejeitada, expirada), valid_until, total_amount, approved_at, created_by, created_at
  - `proposal_items` — id, proposal_id, description, quantity, unit_price, amount
  - `proposal_terms` — id, proposal_id, payment_conditions, scope, observations
- **Justificativa:** Profissionaliza o processo comercial, reduz retrabalho manual e acelera o ciclo de vendas.

#### 1.3.2 Time Tracking por Projeto

Registro de horas trabalhadas por membro da equipe em cada projeto, com calculo de custo real versus valor cobrado e relatorios de produtividade.

- **Criar no banco:**
  - `time_entries` — id, team_member_id, project_id, client_id, hours, description, entry_date, billable, created_at
  - `hourly_rates` — id, team_member_id, rate, effective_from
- **Justificativa:** Sem controle de horas e impossivel saber se um projeto e rentavel ou se a equipe esta sobrecarregada.

#### 1.3.3 Automacao de Cobranca (Regua de Cobranca)

Sistema de regras automaticas para cobranca: lembrete X dias antes do vencimento, notificacao no dia, escalonamento apos vencimento, com templates de email configuráveis.

- **Criar no banco:**
  - `billing_rules` — id, trigger_days, action_type (email, notificacao, bloqueio), template_id, is_active
  - `billing_actions_log` — id, charge_id, rule_id, action_type, sent_at, status
  - `email_templates` — id, name, subject, body, variables, type
- **Justificativa:** Automatizar cobranca reduz inadimplencia e libera tempo da equipe para atividades de maior valor.

#### 1.3.4 CRM e Funil de Vendas

Pipeline completo de vendas: captacao de leads, qualificacao, envio de proposta, negociacao e fechamento, com probabilidade de conversao e valor estimado.

- **Criar no banco:**
  - `leads` — id, name, email, phone, company, source, status, estimated_value, probability, assigned_to, created_at
  - `lead_interactions` — id, lead_id, type (ligacao, email, reuniao), notes, created_by, created_at
  - `sales_pipeline_stages` — id, name, sort_order, default_probability
- **Justificativa:** Para crescer de forma previsivel, e necessario ter visibilidade sobre o funil de vendas e nao depender apenas de indicacoes.

---

## 2. Medio Impacto

### 2.1 Baixa Complexidade

Melhorias de organizacao e visibilidade que utilizam dados existentes.

#### 2.1.1 Filtros Avancados de Clientes

Sistema de filtros combinaveis na listagem de clientes: por tags, status do contrato, origem, cidade, estado, tipo (PF/PJ) e faixa de valor mensal.

- **Tabelas utilizadas:** `clients` (todos os campos necessarios ja existem)
- **Justificativa:** Facilita a segmentacao para acoes direcionadas como campanhas de upsell ou renovacao.

#### 2.1.2 Exportacao de Relatorios (CSV e PDF)

Botao de exportacao em todas as listagens principais (clientes, cobrancas, projetos, despesas) nos formatos CSV e PDF.

- **Tabelas utilizadas:** Todas — implementacao apenas no frontend
- **Justificativa:** Necessario para reunioes, compartilhamento com contabilidade e analises externas.

#### 2.1.3 Calendario Unificado

Visao de calendario que consolida: datas de vencimento de cobrancas, eventos de marketing, datas previstas de entrega de projetos e prazos de proximos passos.

- **Tabelas utilizadas:** `charges.due_date`, `marketing_calendar_events`, `projects.expected_delivery_date`, `project_next_steps.due_date`
- **Justificativa:** Uma visao temporal unificada evita conflitos de agenda e esquecimentos.

#### 2.1.4 Painel de Tickets por Prioridade

Visao dos tickets de suporte agrupados por prioridade (alta, media, baixa) e categoria, com indicadores visuais de tempo desde a abertura.

- **Tabelas utilizadas:** `support_tickets` (campos `priority`, `category`, `created_at`)
- **Justificativa:** Garante que tickets criticos nao fiquem perdidos em meio a solicitacoes de baixa urgencia.

#### 2.1.5 Dashboard de Marketing

Resumo visual do calendario de marketing: quantidade de posts planejados versus publicados no mes, distribuicao por canal e por cliente.

- **Tabelas utilizadas:** `marketing_calendar_events` (campos `status`, `channel`, `client_id`)
- **Justificativa:** Permite acompanhar a producao de conteudo e identificar clientes com entregas atrasadas.

#### 2.1.6 Relatorio de Despesas por Categoria

Grafico de distribuicao das despesas agrupadas por categoria, com comparativo entre meses e identificacao de tendencias de gastos.

- **Tabelas utilizadas:** `expenses` (campos `category`, `amount`, `expense_date`)
- **Justificativa:** Visibilidade sobre onde o dinheiro esta sendo gasto permite cortar desperdicio.

---

### 2.2 Media Complexidade

Melhorias operacionais que exigem pequenas adicoes ao banco de dados.

#### 2.2.1 Notas Internas por Cliente

Area para a equipe registrar observacoes livres sobre o cliente (preferencias, historico de negociacao, pontos de atencao), independente de tickets ou projetos.

- **Criar no banco:** Tabela `client_notes` com campos: `id`, `client_id`, `author_id`, `body`, `pinned`, `created_at`, `updated_at`
- **Justificativa:** Conhecimento institucional sobre o cliente nao deve ficar apenas na cabeca de quem atende.

#### 2.2.2 Checklist de Onboarding de Clientes

Template de etapas padronizadas para integrar um novo cliente: coleta de documentos, configuracao de acesso ao portal, reuniao de kickoff, assinatura de contrato.

- **Criar no banco:**
  - `onboarding_templates` — id, name, items (jsonb)
  - `onboarding_checklists` — id, client_id, template_id, status, started_at, completed_at
  - `onboarding_items` — id, checklist_id, title, completed, completed_at
- **Justificativa:** Padroniza o processo e evita que etapas importantes sejam esquecidas.

#### 2.2.3 Lembretes e Tarefas Internas

Sistema simples de tarefas para a equipe, nao vinculadas necessariamente a um projeto (exemplo: "ligar para fulano quinta", "renovar dominio do cliente X").

- **Criar no banco:** Tabela `internal_tasks` com campos: `id`, `assignee_id`, `title`, `description`, `due_date`, `status`, `client_id` (opcional), `created_by`, `created_at`
- **Justificativa:** Evita que tarefas administrativas se percam entre conversas de WhatsApp e post-its.

#### 2.2.4 Controle de Versionamento de Documentos

Historico de versoes dos documentos enviados, permitindo acessar versoes anteriores e comparar alteracoes.

- **Criar no banco:** Tabela `document_versions` com campos: `id`, `document_id`, `version_number`, `url`, `storage_path`, `uploaded_by`, `uploaded_at`, `notes`
- **Justificativa:** Evita confusao sobre qual e a versao vigente de um contrato ou briefing.

#### 2.2.5 Notificacoes Internas para Admins

Sistema de notificacoes (sino) para administradores: novo ticket aberto, pagamento recebido, projeto atrasado, proposta aprovada.

- **Criar no banco:** Tabela `admin_notifications` com campos: `id`, `user_id`, `type`, `title`, `body`, `read_at`, `entity_type`, `entity_id`, `created_at`
- **Justificativa:** Garante que eventos importantes sejam vistos sem depender de verificacao manual constante.

---

### 2.3 Alta Complexidade

Funcionalidades robustas que agregam valor operacional significativo.

#### 2.3.1 Construtor de Relatorios Customizaveis

Interface onde o admin monta relatorios combinando metricas, filtros e agrupamentos, podendo salvar templates para reutilizacao e agendar envio automatico.

- **Criar no banco:**
  - `report_templates` — id, name, description, config (jsonb com metricas, filtros, agrupamentos), created_by, created_at
  - `report_schedules` — id, template_id, frequency, recipients, last_sent_at, is_active
- **Justificativa:** Elimina a dependencia de planilhas externas para analises recorrentes.

#### 2.3.2 Contratos com Assinatura Digital

Geracao de contratos a partir de templates pre-definidos, com envio para assinatura digital, rastreamento de status e armazenamento automatico apos assinatura.

- **Criar no banco:**
  - `contract_templates` — id, name, body_html, variables (jsonb), created_by, created_at
  - `contract_signatures` — id, contract_id, signer_id, signer_name, signer_email, signed_at, ip_address, signature_hash
- **Integracao externa:** API de assinatura digital (DocuSign, Clicksign ou similar)
- **Justificativa:** Profissionaliza o processo de contratacao e reduz o tempo entre fechamento e inicio do projeto.

#### 2.3.3 Portal de Briefing e Solicitacoes

Canal estruturado para clientes enviarem demandas (novo post, alteracao no site, solicitacao de material), com fluxo de avaliacao, priorizacao e acompanhamento.

- **Criar no banco:**
  - `service_requests` — id, client_id, project_id, type, title, description, status, priority, assigned_to, created_at
  - `request_comments` — id, request_id, author_id, body, created_at
  - `request_attachments` — id, request_id, url, filename, created_at
- **Justificativa:** Organiza as solicitacoes que hoje chegam por WhatsApp e email, dando visibilidade e rastreabilidade.

---

## 3. Baixo Impacto

### 3.1 Baixa Complexidade

Polimentos e conveniencias que utilizam dados existentes.

#### 3.1.1 Indicador de Clientes Inativos

Badge ou lista destacando clientes marcados como inativos ou que nao possuem projetos atualizados ha mais de X meses.

- **Tabelas utilizadas:** `clients.is_active` e `projects.updated_at`
- **Justificativa:** Visibilidade rapida sobre contas que podem precisar de reativacao ou encerramento formal.

#### 3.1.2 Contagem de Documentos por Cliente

Na listagem de clientes, exibir um contador de quantos documentos cada cliente possui associados.

- **Tabelas utilizadas:** `documents` (COUNT agrupado por `client_id`)
- **Justificativa:** Indicador rapido de completude do dossiê do cliente.

#### 3.1.3 Ordenacao Customizada de Listagens

Possibilidade de ordenar clientes, projetos e cobrancas por qualquer coluna (nome, valor, data, status) diretamente na interface.

- **Tabelas utilizadas:** Todas — implementacao apenas no frontend
- **Justificativa:** Flexibilidade basica de navegacao que melhora a experiencia de uso diario.

#### 3.1.4 Perfil do Admin com Avatar

Edicao completa do perfil do administrador incluindo foto com crop, nome de exibicao e telefone.

- **Tabelas utilizadas:** `profiles` (ja possui `avatar_url`, `avatar_zoom`, `avatar_position_x`, `avatar_position_y`)
- **Justificativa:** Personalizacao basica que ja possui toda a infraestrutura pronta.

#### 3.1.5 Resumo Geral de Proximos Passos

Lista consolidada de todos os proximos passos pendentes de todos os projetos, agrupados por projeto e ordenados por data limite.

- **Tabelas utilizadas:** `project_next_steps` (filtro por `status = pendente`)
- **Justificativa:** Visao rapida do que precisa ser feito sem precisar abrir projeto por projeto.

---

### 3.2 Media Complexidade

Pequenas funcionalidades que exigem adicoes simples ao banco de dados.

#### 3.2.1 Favoritar Clientes e Projetos

Opcao para o admin marcar clientes ou projetos como favoritos, exibindo-os em uma secao de acesso rapido no dashboard.

- **Criar no banco:** Tabela `favorites` com campos: `id`, `user_id`, `entity_type`, `entity_id`, `created_at`
- **Justificativa:** Atalho para acesso rapido aos clientes e projetos mais acessados.

#### 3.2.2 Historico de Alteracao de Status

Registro automatico de cada mudanca de status de projetos e tickets, com data, responsavel e status anterior/novo.

- **Criar no banco:** Tabela `status_history` com campos: `id`, `entity_type`, `entity_id`, `old_status`, `new_status`, `changed_by`, `changed_at`
- **Justificativa:** Permite rastrear o ciclo de vida de projetos e identificar padroes de atraso.

#### 3.2.3 Campos Personalizados para Clientes

O admin define campos extras no cadastro de clientes (exemplo: "Instagram", "Segmento de atuacao", "Responsavel comercial").

- **Criar no banco:**
  - `custom_fields` — id, entity_type, field_name, field_type, options (jsonb), sort_order, created_at
  - `custom_field_values` — id, field_id, entity_id, value, created_at
- **Justificativa:** Flexibilidade para adaptar o cadastro sem alterar o schema principal.

#### 3.2.4 Templates de Resposta para Tickets

Respostas pre-prontas para tipos comuns de tickets, permitindo que a equipe responda mais rapido mantendo um padrao de comunicacao.

- **Criar no banco:** Tabela `ticket_reply_templates` com campos: `id`, `title`, `body`, `category`, `created_by`, `created_at`
- **Justificativa:** Agiliza o atendimento e mantem consistencia nas respostas.

---

### 3.3 Alta Complexidade

Funcionalidades avancadas de menor urgencia para o momento atual.

#### 3.3.1 Sistema de Permissoes Granular (RBAC)

Controle detalhado de permissoes por modulo: definir o que cada membro da equipe pode visualizar, criar, editar e excluir em cada area do sistema.

- **Criar no banco:**
  - `permissions` — id, name, description, module
  - `role_permissions` — id, role, permission_id, allowed
  - Refatoracao da tabela `user_roles` existente
- **Justificativa:** Necessario apenas quando a equipe crescer e houver necessidade de restringir acesso por funcao.

#### 3.3.2 Chat Interno da Equipe

Sistema de mensagens entre membros da equipe, com canais organizados por projeto ou tema.

- **Criar no banco:**
  - `chat_channels` — id, name, type (direto, projeto, geral), project_id, created_at
  - `chat_messages` — id, channel_id, sender_id, body, created_at
  - `channel_members` — id, channel_id, user_id, joined_at
- **Justificativa:** Util apenas se a equipe nao utilizar ferramentas externas como Slack ou Discord.

#### 3.3.3 Integracoes com Ferramentas Externas

Webhooks e integracoes com servicos como Slack, WhatsApp Business, Google Sheets e plataformas de pagamento.

- **Criar no banco:**
  - `integrations` — id, type, name, config (jsonb), credentials (jsonb criptografado), is_active
  - `webhook_events` — id, integration_id, event_type, payload, status, processed_at
  - `integration_logs` — id, integration_id, direction, status, request, response, created_at
- **Justificativa:** Valor alto a longo prazo, mas exige manutencao continua e depende de APIs externas.

---

## Matriz Resumo

|                   | Baixa Complexidade                                                                                                               | Media Complexidade                                                                      | Alta Complexidade                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Alto Impacto**  | KPI Cards, Inadimplencia, Pipeline Kanban, Fluxo de Caixa, Alertas de Cobranca, Visao 360, Receita por Cliente                   | Metas Financeiras, Audit Trail, Tags Projetos, SLA Suporte, Forecast                    | Propostas/Orcamentos, Time Tracking, Automacao Cobranca, CRM/Funil |
| **Medio Impacto** | Filtros Avancados, Exportacao CSV/PDF, Calendario Unificado, Tickets por Prioridade, Dashboard Marketing, Despesas por Categoria | Notas Internas, Onboarding Checklist, Tarefas Internas, Versao Docs, Notificacoes Admin | Report Builder, Assinatura Digital, Portal Briefing                |
| **Baixo Impacto** | Clientes Inativos, Contagem Docs, Ordenacao, Perfil Admin, Proximos Passos                                                       | Favoritos, Historico Status, Campos Custom, Templates Ticket                            | RBAC, Chat Interno, Integracoes Externas                           |

---

## Recomendacao de Priorizacao

**Fase 1 — Valor imediato (Alto Impacto + Baixa Complexidade)**
Implementar os 7 itens da secao 1.1. Nenhum requer alteracao no banco de dados e todos geram visibilidade critica sobre financas, projetos e clientes.

**Fase 2 — Fundacao operacional (Alto Impacto + Media Complexidade)**
Implementar metas financeiras, audit trail e SLA de suporte. Exigem apenas 1-2 tabelas simples cada e elevam o nivel de controle do negocio.

**Fase 3 — Produtividade da equipe (Medio Impacto + Baixa Complexidade)**
Filtros avancados, exportacao de relatorios e calendario unificado. Melhoram o dia a dia sem custo de infraestrutura.

**Fase 4 — Crescimento (Alto Impacto + Alta Complexidade)**
Sistema de propostas e CRM. Investimento maior, porem essencial para escalar a operacao comercial de forma estruturada.
