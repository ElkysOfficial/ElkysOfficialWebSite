---
title: ADR-001 — Sem libs UI de terceiros
tags: [adr, design-system]
status: accepted
---

# ADR-001 — Sem libs UI de terceiros (Design System 100% autoral)

## Contexto

A Elkys vende identidade visual e diferenciação como parte do produto. Adotar shadcn/Radix/MUI/Chakra implicaria estilo similar a milhares de outras marcas e exposição a churn de manutenção das libs.

## Decisão

Construir **design system 100% autoral** em `src/design-system/`, baseado em **CVA (Class Variance Authority)** + utilitário `cn()` (clsx + tailwind-merge), com tokens em CSS custom properties (HSL) e CVA para variantes.

## Alternativas consideradas

| Opção               | Por que não                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| shadcn/ui           | Padrão visual reconhecível; exigiria heavy customization para diferenciar |
| Radix UI primitives | Boa A11y mas força semântica que conflita com layouts próprios            |
| MUI / Chakra        | Bundle pesado, theming engine próprio, churn de upgrades                  |
| Headless UI         | Boa, mas time pequeno preferiu controle total                             |

## Consequências

### Positivas

- Identidade visual única; controle total sobre tokens, breakpoints, ritmo.
- Bundle enxuto (sem `@mui/material` 200KB+ ou Radix).
- Curva de aprendizado pequena para devs novos: tudo é Tailwind + CVA.

### Negativas (debt)

- **A11y é responsabilidade do time** — sem AlertDialog/Combobox prontos. Risco em modais, popovers complexos.
- Manter `Button`, `Input`, `Card` exige disciplina de revisão.
- Auditoria 2026-04-22 mostrou ~10 arquivos do admin usando `<input>`/`<button>` HTML cru — desvio que requer governança.

## Hooks de implementação

- `src/design-system/components/` — Button, Card, Input, Textarea, AlertDialog, HexAvatar, HexPattern.
- `src/design-system/primitives/` — Container, Section, Stack, Grid.
- `src/design-system/form/` — Label, Field, ErrorText.
- Tokens: `src/styles/_tokens.scss`.

## Relações

- [[../07-frontend/design-system]]
- [[../13-issues/inputs-html-crus-admin]]
- [[../13-issues/borders-inconsistentes]]
- `docs/DESIGN-SYSTEM.md`

## Referências

- Auditoria DS: `docs/AUDIT-2026-04-23.md` §1
- Padronização: `docs/DESIGN-SYSTEM.md` §14
