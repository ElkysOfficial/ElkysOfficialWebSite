---
title: Como usar este Brain
tags: [meta]
---

# Como usar este Brain

## Abrir no Obsidian

1. **File → Open vault → Open folder as vault** → selecione `D:/Elkys/ElkysOfficialWebSite/obsidian/`.
2. Aguarde indexação (alguns segundos).
3. **Graph view**: Ctrl+G — visualize núcleos centrais (`clients`, `projects`, `charges`, `AuthContext`).

## Pontos de entrada

- 🧠 [[brain]] — mapa central de tudo.
- 🗺️ MOCs por área: [[../01-architecture/system-overview]], [[../02-domains/index]], [[../03-features/index]], [[../04-flows/index]], [[../05-database/erd]], [[../06-api/index]], [[../07-frontend/index]], [[../08-backend/index]], [[../09-infra/index]], [[../10-security/index]], [[../11-performance/index]], [[../12-decisions/index]], [[../13-issues/index]], [[../14-roadmap/index]], [[../15-glossary/index]].

## Convenções

- **Wikilinks** `[[...]]` em todo lugar — clique para navegar.
- **Severidade** em issues: 🔴 HIGH · 🟠 MEDIUM · 🟢 LOW.
- **`⚠️ Assumido`** marca hipóteses não validadas no código (boas candidatas a confirmar).
- **Frontmatter** com `tags` ajuda a filtrar (ex: tag `adr`, `domain`, `flow`, `issue`).
- Toda nota segue: Contexto → Descrição Técnica → Problemas → Impacto → Recomendações → Relações → Referências.

## Agentes para enriquecer

- `/review` — review de PR.
- `/security-review` — review de segurança da branch.
- Use `Agent` (Explore) para responder "onde está X" sem poluir contexto.

## Manutenção

- Novo ADR? Adicione em `12-decisions/` e linke em `12-decisions/index.md`.
- Issue resolvida? Mova para `13-issues/_resolved/`.
- Mudança grande de arquitetura? Atualize [[../01-architecture/system-overview]] + ADR novo.
- Sempre atualize **Referências** ao mudar caminho de arquivo no código.

## Não confundir

- `obsidian/` (este diretório) — vault de conhecimento humano-legível.
- `.obsidian/` (config Obsidian na raiz do repo) — configuração do app.
- `docs/` — docs canônicos versionados (ARCHITECTURE.md, DATABASE.md, etc.). **Source of truth**; este Brain _expande_ esses docs com análise, links e diagnóstico.
