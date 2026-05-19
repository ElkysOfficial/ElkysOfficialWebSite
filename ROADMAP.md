# Roadmap — Elkys Software House

> Roadmap de **portfólio** da Elkys Software House: a Plataforma Elkys (este
> repositório) e os produtos proprietários Sonnar e Dashy/Elkcut, além do
> microsserviço de WhatsApp que conecta todos eles.
>
> - Histórico release a release: [`CHANGELOG.md`](CHANGELOG.md).
> - Catálogo detalhado de funcionalidades do painel admin:
>   [`docs/ROADMAP.md`](docs/ROADMAP.md).
> - Política de versão: [`docs/VERSIONING.md`](docs/VERSIONING.md).
>
> Última atualização: 19/05/2026.

---

## Portfólio

| Produto              | Repositório                     | O que é                                                                                                            |
| -------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Plataforma Elkys** | `Elkys_Official_WebSite`        | Site institucional + portal B2B (Admin + Cliente): projetos, financeiro, propostas, contratos, documentos, suporte |
| **Sonnar**           | `Sonnar_Scraping`               | SaaS de matching de vagas de tecnologia (multicanal)                                                               |
| **Dashy / Elkcut**   | `Dashy_Official_WebSite`        | SaaS de gestão para barbearias (`elkut.com.br`)                                                                    |
| **Bot de WhatsApp**  | `Sonnar_Scraping/apps/whatsapp` | Microsserviço de comunicação compartilhado                                                                         |

---

## 🔌 O WhatsApp como microsserviço de conexão

O bot de WhatsApp é um **microsserviço de comunicação** da Elkys: roda numa VPS,
exposto por uma API HTTP (`POST /send`) protegida por token Bearer. Qualquer
produto da casa pode disparar mensagens por ele.

```
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │ Plataforma   │   │   Sonnar     │   │ Dashy/Elkcut │
   │   Elkys      │   │              │   │  (futuro)    │
   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
          │  POST /send (Authorization: Bearer) │
          └───────────────┬─────────────────────┘
                          ▼
            ┌─────────────────────────────┐
            │  Bot de WhatsApp (VPS)       │
            │  API Receiver :3002 — Baileys│
            └─────────────────────────────┘
                          ▼
                  WhatsApp dos clientes
```

Hoje consomem o microsserviço: **Sonnar** (cards de vaga) e **Plataforma Elkys**
(notificações transacionais). **Dashy** ainda não. O roadmap do próprio
microsserviço está na seção 4.

---

## 1. Plataforma Elkys — Portal do Cliente

### 1.1 Versões entregues

| Versão           | Data               | Resumo                                              |
| ---------------- | ------------------ | --------------------------------------------------- |
| v1.0.0           | 13/04/2026         | Landing page institucional                          |
| v2.0.0 a v2.98.0 | 03/04 a 18/05/2026 | Construção do Portal do Cliente                     |
| v3.0.0           | 19/05/2026         | WhatsApp e confiabilidade de comunicação e cobrança |
| v3.0.1           | 19/05/2026         | Personalização e refino das comunicações            |

#### ✅ v1.0.0 — Landing page institucional

Primeira versão pública: site institucional responsivo (Hero, Sobre, Serviços,
Equipe, Cases, Contato), tema dark/light, cookies LGPD, políticas legais,
design system autoral, página Cases, metodologia HDS, formulário de orçamento.

#### ✅ v2.0.0 a v2.98.0 — Portal do Cliente

Nasce o portal B2B: redesign project-centric, autenticação via Supabase,
áreas Admin e Cliente separadas, papéis (RBAC), gestão de leads, propostas,
contratos, projetos, cobranças, documentos e suporte, e as edge functions de
e-mail transacional. Linha versionada antes da política atual, com mais de
200 tags incrementais consolidadas como baseline.

#### ✅ v3.0.0 — WhatsApp e confiabilidade de comunicação e cobrança

- Espelhamento das comunicações no **WhatsApp**: todo e-mail transacional do
  portal passa a ser espelhado por uma mensagem de WhatsApp ao cliente, via o
  microsserviço (`_shared/whatsapp.ts`, modo no-op seguro).
- Rastreio de **abertura** (pixel) e **clique** (link encurtado) em todos os
  e-mails, consolidado no dashboard de Comunicações.
- Reativação de 5 cron jobs parados (cobrança, inadimplência, propostas).
- Encurtador `lnk.elkys.com.br` deixa de ser apagado a cada deploy.
- Versionamento corrigido (SemVer + changelog + `docs/VERSIONING.md`).

#### ✅ v3.0.1 — Personalização e refino das comunicações

- Mensagens de WhatsApp reescritas em tom mais acolhedor, com **saudação
  personalizada** (Bom dia/tarde/noite + Sr./Sra. + nome do cliente).
- Logo do e-mail trocada para PNG de fundo transparente.
- Mensagem clara no cadastro quando o e-mail já pertence a outra conta.

### 1.2 Versões planejadas

Ordenadas por valor sobre esforço. Cada versão tem um tema único.

#### 🔜 v3.1.0 — Portal: valor imediato

Alto valor, baixo esforço, sem mudança de banco.

- KPI Cards no dashboard administrativo.
- Relatório de Inadimplência com aging.
- Pipeline Kanban de Projetos.
- Fluxo de Caixa.
- Alertas de Cobrança.
- Visão 360 do Cliente.
- Receita por Cliente.

#### 🔜 v3.2.0 — WhatsApp de mão dupla (atendimento)

Hoje o WhatsApp só envia. Esta versão o torna canal de atendimento.

- Recebimento de mensagens do cliente pelo WhatsApp.
- Resposta a uma notificação abre um ticket automaticamente.
- Comandos self-service ("status do meu projeto", "2ª via da fatura").
- Handoff humano: estado de conversa por contato (`bot` responde menu,
  `humano` silencia o bot para aquele número), com entrada por pedido do
  cliente e saída por comando do atendente, timeout ou "encerrar".
- FAQ e auto-atendimento antes de acionar um humano.

#### 🔜 v3.3.0 — Portal: fundação operacional

- Metas Financeiras.
- Audit Trail completo (log de ações do admin).
- Dashboard de SLA de Suporte.
- Observabilidade de cron com alerta no Discord.

#### 🔜 v3.4.0 — Ações e pagamento pelo WhatsApp

- Aprovação de proposta ou etapa respondendo no chat.
- Cobrança PIX no WhatsApp (QR code e copia-e-cola) com conciliação
  automática: pago dispara a confirmação.
- Confirmação e lembrete de reunião pelo WhatsApp.

#### 🔜 v3.5.0 — Portal: produtividade da equipe

- Filtros avançados e busca em todas as listagens.
- Exportação CSV e PDF.
- Calendário unificado.
- Autosave, edição inline de status, atalhos globais.

#### 🔜 v4.0.0 — WhatsApp inteligente e crescimento

Marco maior: salto de produto.

- IA na triagem do WhatsApp: entende a intenção, responde dúvidas comuns ou
  encaminha para o humano certo.
- Notificações ricas (botões e listas) e digest proativo pelo WhatsApp.
- Campanhas segmentadas respeitando opt-in (LGPD).
- Sistema de Propostas e Orçamentos completo, CRM e Funil de Vendas, Time
  Tracking por projeto.
- Assinatura digital de contratos, PWA com push, NPS in-portal.
- Hardening: Sentry, testes automatizados, CSP, papéis no JWT, 2FA admin
  obrigatório, ambiente de staging real.

### 1.3 Priorização (valor × esforço)

| Versão | Bloco                              | Valor    | Esforço |
| ------ | ---------------------------------- | -------- | ------- |
| v3.1.0 | Portal: valor imediato             | 🥇 Alto  | Baixo   |
| v3.2.0 | WhatsApp atendimento 2-via         | 🥇 Alto  | Médio   |
| v3.3.0 | Portal: fundação operacional       | 🥈 Médio | Médio   |
| v3.4.0 | WhatsApp ações e cobrança PIX      | 🥇 Alto  | Alto    |
| v3.5.0 | Portal: produtividade              | 🥈 Médio | Médio   |
| v4.0.0 | WhatsApp inteligente e crescimento | 🥉 Médio | Alto    |

---

## 2. Sonnar — SaaS de matching de vagas

> Roadmap completo em `Roadmap.md` no repositório `Sonnar_Scraping`.

**O que é:** SaaS B2C multicanal de matching de vagas de tecnologia. Pipeline de
scraping em 15+ fontes, portal web, bot de WhatsApp com grupo de vagas e VIP.

**Estado:** v2.2.0 lançada.

- [x] v2.0.0 — Transformação em SaaS multicanal.
- [x] v2.1.x — Encurtador de URL, VIP recorrente, dados fiscais.
- [x] v2.2.0 — API Receiver do WhatsApp com autenticação por token (habilita o
      bot como microsserviço compartilhado da Elkys).
- [ ] **v3.0.0** — Novos canais (Telegram, Discord), observabilidade, testes
      E2E, filtros avançados.

---

## 3. Dashy / Elkcut — Gestão para barbearias

**O que é:** SaaS de gestão para barbearias (`elkut.com.br`). React + TypeScript

- Vite + Supabase + Stripe + Resend.

**Estado:** em desenvolvimento ativo.

### Ideias de roadmap

- [ ] Integrar o **microsserviço de WhatsApp** da Elkys:
  - [ ] Lembrete de horário marcado.
  - [ ] Confirmação/cancelamento de agendamento pelo WhatsApp.
  - [ ] Aviso de retorno ("faz X dias do seu último corte").
- [ ] Espelhar e-mails transacionais no WhatsApp reaproveitando o módulo
      `whatsapp.ts` (mesmo padrão da Plataforma Elkys).
- [ ] Dashboard de ocupação e faturamento.
- [ ] Programa de fidelidade.

> Quando o time priorizar o Dashy, esta seção deve ganhar versionamento próprio.

---

## 4. Microsserviço de WhatsApp

Bot baseado em Baileys, rodando em VPS sob PM2, com API HTTP autenticada.

### ✅ Concluído

- [x] API Receiver (`POST /send`, `/send-batch`, `/status`, `/health`).
- [x] Autenticação por token Bearer.
- [x] Consumido por Sonnar (cards de vaga) e Plataforma Elkys (notificações).

### 🛠️ Roadmap do microsserviço

- [ ] **Multi-tenant / roteamento por produto**: identificar de qual produto é
      cada conversa (Elkys / Sonnar / Dashy) — hoje todos compartilham o mesmo
      número, o que mistura os fluxos de entrada.
  - [ ] Decisão: número de WhatsApp **dedicado por produto** vs. roteamento por
        base de contatos num número único.
- [ ] **Recebimento de mensagens** com webhook por produto (suporta o
      atendimento 2-via do Elkys, v3.2.0).
- [ ] **Estado de handoff** por produto e por contato.
- [ ] **Confirmações de entrega/leitura** reportadas de volta — enriquece o
      `whatsapp_status` em `communications`.
- [ ] HTTPS na frente da porta 3002 (nginx ou Cloudflare Tunnel).
- [ ] Painel de status do microsserviço (uptime, fila, conexão).

---

## Convenções

- Cada repositório mantém seu próprio `CHANGELOG.md`.
- Versões viram tags de git ao serem lançadas (SemVer), conforme
  [`docs/VERSIONING.md`](docs/VERSIONING.md).
- Itens de longo prazo, ao virarem trabalho real, devem gerar uma issue ou um
  documento de decisão no repositório correspondente.
