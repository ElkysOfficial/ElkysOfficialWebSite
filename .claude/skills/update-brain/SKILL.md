---
name: update-brain
description: Sincroniza o second brain em obsidian/ com o estado atual do código e do projeto. Use quando o usuário pedir para "atualizar o brain", "atualizar obsidian", "sincronizar conhecimento", "registrar X no obsidian", após uma sprint/PR grande, ou após resolver um issue listado em obsidian/13-issues/. Também aciona ao concluir uma decisão arquitetural relevante (criar ADR) ou ao confirmar uma hipótese ⚠️ Assumido no vault.
---

# Update Brain Skill

Mantém o second brain (`obsidian/`) sincronizado com a realidade do projeto.

## Quando esta skill aciona

Palavras-gatilho típicas (PT-BR ou EN):

- "atualize o brain", "sincronize o obsidian", "registre isso no obsidian"
- "fechei o issue X" (após mover issue de [[obsidian/13-issues/index]])
- "tomei a decisão de fazer Y" (criar ADR)
- "esse `⚠️ Assumido` é verdadeiro/falso, atualize"
- "depois desse PR, atualize o brain"
- final de sprint / "o que mudou no projeto desde a última atualização?"

## Workflow obrigatório

### 1. Diagnóstico (ler antes de escrever)

Antes de qualquer Edit, leia em **paralelo**:

- `obsidian/00-index/brain.md` (MOC central)
- `obsidian/13-issues/index.md` (lista atual de issues)
- `obsidian/12-decisions/index.md` (lista atual de ADRs)
- `obsidian/14-roadmap/index.md` (ondas)

Depois execute em paralelo:

- `git log --oneline -20` para ver commits recentes
- `git diff main..HEAD --stat` se em branch feature

Compare: o que aconteceu no código que **não** está refletido no vault?

### 2. Categorize as mudanças

Para cada mudança detectada, classifique em uma das categorias:

| Categoria                         | Ação                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Issue resolvido                   | mover `13-issues/<file>.md` → `13-issues/_resolved/<file>.md`; remover linha em `13-issues/index.md` |
| Issue novo descoberto             | criar `13-issues/<slug>.md` (severity HIGH/MEDIUM/LOW); adicionar em `index.md`                      |
| ADR (decisão arquitetural)        | criar `12-decisions/ADR-<NN>-<slug>.md`; adicionar em `index.md`                                     |
| Nova rota/página                  | atualizar `07-frontend/routing.md`                                                                   |
| Nova tabela/migration             | atualizar `05-database/erd.md` + criar nota em `02-domains/` se for nova entidade pivot              |
| Nova edge function                | criar nota em `06-api/edge-fn-<name>.md` + atualizar `06-api/index.md`                               |
| Novo fluxo cross-camada           | criar nota em `04-flows/<name>.md` + atualizar `04-flows/index.md`                                   |
| Hipótese `⚠️ Assumido` confirmada | remover marcador; atualizar texto com fato                                                           |
| Hipótese `⚠️ Assumido` refutada   | corrigir texto; remover marcador                                                                     |
| Mudança em arquivo:linha citado   | atualizar referências afetadas (use Grep no vault)                                                   |
| Roadmap concluído (item de onda)  | marcar checkbox `[x]` em `14-roadmap/index.md`                                                       |

### 3. Execute em paralelo, não em série

Use Edit/Write em **batch** — múltiplos `tool_use` em uma única mensagem quando arquivos não dependem uns dos outros.

### 4. Mantenha o padrão de cada nota

Toda nota nova segue esse esqueleto (não invente layout próprio):

```markdown
---
title: <Título>
tags: [<categoria>, <severity_se_issue>]
---

# <Título>

## Contexto

## Descrição Técnica

## Problemas Identificados

## Impacto

## Recomendações

## Relações

## Referências
```

ADR usa: `Contexto / Decisão / Alternativas / Consequências / Relações / Referências`.

### 5. Wikilinks obrigatórios

Toda menção a outra entidade do vault usa `[[caminho/nota]]`. Caminho de código usa `arquivo:linha`.

### 6. Atualize o índice MOC

Sempre que criar nota nova, **adicione linha** no MOC da pasta (`<pasta>/index.md`) — senão a nota fica órfã no grafo.

### 7. Reporte ao usuário

Ao final, mostre uma tabela compacta:

- Notas criadas
- Notas atualizadas
- Notas movidas (resolved)
- Itens de roadmap fechados
- Hipóteses `⚠️ Assumido` resolvidas

## Anti-padrões (NÃO faça)

- ❌ Reler o vault inteiro — leia só o que está mudando.
- ❌ Reescrever nota do zero quando a mudança é pequena (use Edit, não Write).
- ❌ Duplicar conteúdo entre nota e MOC (MOC só linka).
- ❌ Inventar issue/ADR sem evidência concreta no diff/log.
- ❌ Atualizar sem antes ler o estado atual da nota (sobrescrever cego).
- ❌ Esquecer de atualizar Referências quando o caminho do arquivo no código mudou.

## Saída esperada

Mensagem final ao usuário:

```
✅ Brain sincronizado

Issues resolvidos:
  - [[13-issues/<x>]] → _resolved/

ADRs novos:
  - [[12-decisions/ADR-NN-slug]]

Notas atualizadas:
  - [[<path>]] (referência arquivo:linha atualizada)

Roadmap:
  - Onda 1: 3 itens fechados
```
