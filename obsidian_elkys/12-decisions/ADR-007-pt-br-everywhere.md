---
title: ADR-007 — Português brasileiro em tudo
tags: [adr, i18n]
status: accepted
---

# ADR-007 — Português brasileiro em todo conteúdo

## Contexto

Cliente-alvo é exclusivamente brasileiro. Internacionalização adicionaria peso ao bundle, complexidade de tradução, drift entre idiomas.

## Decisão

UI, labels, copy, nomes de tabela, enums, comentários SQL e documentação — **tudo em português brasileiro**.

## Alternativas

- i18next + arquivos de tradução: descartado por overhead.
- Base inglês + i18n só para strings visuais: complica DB labels (`status='ativo'` vs `status='active'`).

## Consequências

### Positivas

- Sem duplicação de fonte.
- Banco lê-se como linguagem natural: `SELECT * FROM clients WHERE contract_status='inadimplente'`.
- Clientes recebem comunicação 100% nativa.

### Negativas

- **Difícil terceirizar dev internacional** sem fluência mínima.
- Documentação no GitHub Issues / PRs misturada (técnico em inglês, copy em pt-BR).
- Se um dia precisar exportar produto para outros países LATAM (Espanhol), refator é massivo.

## Convenções

- Nomes de variáveis em **inglês** (`clientId`, `dueDate`).
- Nomes de tabelas, enums, status em **português** (`clientes`, `cobranças`).
- Funções utilitárias `formatBRDate`, `maskCPF` em inglês com prefixo BR explícito.

## Relações

- [[../15-glossary/index]]
- `src/lib/masks.ts`, `src/lib/finance-metrics.ts`

## Referências

- Quase todos os arquivos
