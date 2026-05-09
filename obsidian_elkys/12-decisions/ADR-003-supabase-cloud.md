---
title: ADR-003 — Supabase Cloud como backend único
tags: [adr, infra]
status: accepted
---

# ADR-003 — Supabase Cloud como backend único

## Contexto

Equipe de 1-3 devs, ciclo de release semanal, base pequena (<1000 clientes). Necessidade de Postgres + Auth + Storage + Functions + Cron sem dedicar tempo a infra.

## Decisão

Adotar **Supabase Cloud** como único backend. Sem servidor próprio, sem Docker prod, sem Kubernetes.

## Alternativas

| Opção                              | Por que não                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Supabase self-hosted               | Custo de manutenção + monitoramento + backup absurdo para a fase            |
| Firebase                           | Sem Postgres, schema-less; ruim para relacionamentos complexos do produto   |
| Render/Railway + Postgres dedicado | 2-3× custo Supabase Cloud Pro; menos features prontas (RLS, edge fns, cron) |
| AWS RDS + Lambda                   | Curva ENORME; ROI ruim para tamanho atual                                   |

## Consequências

### Positivas

- 5 minutos de tempo total para subir produção.
- Auth + Storage + RLS + pg_cron prontos.
- Tipos TypeScript gerados automaticamente.

### Negativas

- **Vendor lock-in moderado** — sair exigiria reimplementar `_shared/auth.ts`, RLS, Storage policies em Postgres puro.
- **Custos crescem com escala** — DB rows e Edge Function invocations.
- **Limite de duração Edge Function** (Deno) impõe arquitetura "fast and small".
- **Sem controle sobre versões Postgres / runtime Deno** — dependente do timing do Supabase.
- **Service role key monolítica** — sem scoping fino até suporte deles.

## Sinais de "hora de sair"

- 1k+ tenants ativos.
- Edge Functions atingindo timeout regularmente.
- Necessidade de SLA contratado.
- Custo mensal > $500.

## Relações

- [[../01-architecture/system-overview]]
- [[../09-infra/supabase-config]]
- [[ADR-010-edge-fn-verify-jwt-false]]
- [[../13-issues/service-role-key-monolithic]]

## Referências

- `supabase/config.toml`
- `package.json` (`@supabase/supabase-js`)
