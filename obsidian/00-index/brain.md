---
title: Elkys Second Brain — Index
tags: [index, moc, brain]
aliases: [Brain, Index, MOC, Home]
cssclasses: [brain-index]
---

# 🧠 Elkys Second Brain

> Mapa central do conhecimento operacional da Elkys Software House.
> Versão do produto: **v2.97.2** · Repositório: `D:\Elkys\ElkysOfficialWebSite` · Stack: React 18 + Vite 7 + Supabase Cloud

---

## Visão geral em uma frase

Plataforma React SPA com **site público de marketing**, **portal admin** (CRM, financeiro, projetos, suporte, equipe, marketing) e **portal cliente** (projetos, contratos, cobranças, propostas, suporte), servida como bundle estático no Hostinger e backend serverless no **Supabase Cloud** (Postgres + Auth + Edge Functions + Storage).

```
Browser SPA  ──HTTPS──▶  Supabase Cloud (Postgres+RLS · Auth · Edge Functions · Storage)
   │                          │
   ├── Site público           ├── 14+ Edge Functions (Deno)
   ├── Portal Admin           ├── pg_cron (4 jobs)
   └── Portal Cliente         └── Resend (email transacional)
```

Mais profundo em [[01-architecture/system-overview|System Overview]].

---

## 🗺️ Domínios

| Domínio             | MOC                                 | Resumo                                                                      |
| ------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| Arquitetura         | [[01-architecture/system-overview]] | Stack, build, fluxo de dados, decisões fundadoras                           |
| Domínios de negócio | [[02-domains/index]]                | Clients, Projects, Charges, Contracts, Leads, Proposals, Support            |
| Features            | [[03-features/index]]               | Pipeline CRM, Régua de cobrança, Onboarding, Aceite de contrato, Financeiro |
| Fluxos              | [[04-flows/index]]                  | Auth, First-access, Lead→Cliente, Pause/Resume automático, Cobrança         |
| Banco de dados      | [[05-database/index]]               | 28 tabelas, 16 enums, 8 funções SQL, 4 cron jobs                            |
| API / RPC           | [[06-api/index]]                    | Edge Functions, helpers `portal-data.ts`                                    |
| Frontend            | [[07-frontend/index]]               | Routing, Design System, Hooks, Pages, Components                            |
| Backend             | [[08-backend/index]]                | Edge Functions, RLS, triggers, jobs                                         |
| Infra               | [[09-infra/index]]                  | Hostinger FTP deploy, Supabase Cloud, GitHub Actions                        |
| Segurança           | [[10-security/index]]               | Auth model, RLS, OWASP, riscos                                              |
| Performance         | [[11-performance/index]]            | Bundle, manualChunks, lazy loading, prerender, SEO                          |
| Decisões (ADR)      | [[12-decisions/index]]              | 100% custom DS, no GraphQL, manualChunks gotcha                             |
| Issues / débito     | [[13-issues/index]]                 | Achados HIGH/MEDIUM/LOW da auditoria                                        |
| Roadmap             | [[14-roadmap/index]]                | Ondas 1/2/3, billing escalation, backlog v2.92                              |
| Glossário           | [[15-glossary/index]]               | Termos do domínio (Charge, Installment, Subscription, etc.)                 |

---

## ⚡ Atalhos críticos

- 🎯 **Onboarding novo dev:** [[01-architecture/system-overview]] → [[07-frontend/routing]] → [[05-database/erd]] → [[12-decisions/index]]
- 🔐 **Mexer em auth/permissões:** [[04-flows/auth-flow]] + [[10-security/rls-model]] + [[06-api/edge-fn-create-user]]
- 💰 **Mexer em cobrança:** [[02-domains/charges]] + [[03-features/billing-rules]] + [[04-flows/overdue-cron-flow]]
- 📦 **Deploy:** [[09-infra/deployment]] + [[12-decisions/ADR-005-manualchunks-pitfall]]
- 🐛 **Achar bugs estruturais:** [[13-issues/index]]

---

## 🌐 Grafo

Para a visão de grafo completa, abra `Graph view` (Ctrl+G no Obsidian). Núcleos centrais esperados:

- `clients` (entidade pivot do domínio)
- `projects` (segundo pivot)
- `charges` (centro do módulo financeiro)
- `AuthContext` (centro do controle de acesso)
- `Supabase client` (centro do data layer)

---

## 📋 Convenções deste Brain

- **Toda nota** segue a estrutura: `Contexto → Descrição Técnica → Problemas → Impacto → Recomendações → Relações → Referências`.
- **Wikilinks `[[...]]` sempre que possível** — evite citar entidade sem linkar.
- **Hipóteses inferidas** são marcadas com `⚠️ Assumido` no parágrafo.
- **Referências de código** no formato `arquivo:linha`.
- **Severidade**: 🔴 HIGH · 🟠 MEDIUM · 🟢 LOW.
