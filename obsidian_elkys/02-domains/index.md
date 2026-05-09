---
title: Domínios de Negócio
tags: [domains, moc]
---

# Domínios de Negócio

Cada domínio mapeia a um agregado central no banco. Use estas notas como ponto de entrada para entender o ciclo de vida de uma entidade e seus colaboradores.

## Pilar comercial (top-of-funnel → contrato)

- [[leads]] — captura, qualificação, perda/ganho
- [[proposals]] — escopo + valor antes do contrato; aprovação pelo cliente
- [[clients]] — entidade pivot; tudo vincula
- [[client-contacts]] — múltiplos contatos por cliente, com acesso opcional ao portal

## Pilar de entrega

- [[projects]] — coração da execução
- [[project-contracts]] — contratos formais com versionamento
- [[project-installments]] — parcelas 50/50 (entrada/entrega)
- [[project-subscriptions]] — mensalidades recorrentes
- [[project-next-steps]] — accountability cliente↔elkys
- [[timeline-events]] — histórico de tudo que aconteceu

## Pilar financeiro

- [[charges]] — cobranças individuais (origem: parcela, mensalidade ou manual)
- [[expenses]] — despesas operacionais
- [[financial-goals]] — metas mensais/trimestrais/anuais
- [[billing-rules]] + [[billing-templates]] + [[billing-actions-log]] — régua de cobrança

## Pilar suporte e comunicação

- [[support-tickets]] + [[ticket-messages]]
- [[documents]] — contratos, NFs, código-fonte
- [[internal-documents]] — knowledge base interna (M&D / Dev)

## Pilar pessoas

- [[team-members]] — internos
- [[user-roles]] — RBAC
- [[profiles]] — espelho de `auth.users`

## Pilar marketing

- [[marketing-calendar-events]]

## Pilar governança

- [[audit-logs]] — auditoria de ações críticas
- [[automation-settings]] — chaves dinâmicas para crons
