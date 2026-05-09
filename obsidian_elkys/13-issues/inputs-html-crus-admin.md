---
title: 10 arquivos admin com inputs/buttons HTML crus
tags: [issue, medium, design-system]
severity: MEDIUM
---

# 🟠 M1 — Inputs/buttons HTML crus em 10 arquivos admin

## Contexto

Auditoria 2026-04-23 identificou que `<input>` puro e `<button>` cru são usados em 10 arquivos admin, em vez de `<Input>`/`<Button>` do design system. Padrão obrigatório (DS §14): `<Field>` + `<Label>` + `<Input>` + `<ErrorText>`.

## Lista

`ChangePassword.tsx`, `Tasks.tsx`, `ProposalDetail.tsx`, `ProjectCreate.tsx`, `Leads.tsx`, `ClientCreate.tsx`, `ProjectDetail.tsx`, `LeadDetail.tsx`, `ClientDetail.tsx`, `BillingAutomation.tsx`.

Exemplos:

- `ChangePassword.tsx:117-124, 193-207` — `<input>` puro.
- `ChangePassword.tsx:126-133, 209-216` — `<button>` toggle de senha.
- `Finance.tsx:568, 610, 626, 730` — `<input>` cru com `min-h-[44px]` duplicando padrão DS.

## Impacto

- Estilo desviante (focus rings, error states diferentes).
- A11y inconsistente (sem `aria-invalid`, sem `aria-describedby` para erro).
- Refator de DS não propaga para essas instâncias.

## Recomendação

### Codemod com `jscodeshift`

```ts
// transformação:
<input type="text" className="..." />
// →
<Input type="text" />

<button onClick={...} className="...">
  <X />
</button>
// →
<Button variant="ghost" size="icon" onClick={...} aria-label="...">
  <X />
</Button>
```

### Ou manualmente, 1 arquivo por PR

Onda 1 cobre os mais visíveis (ChangePassword, BillingAutomation). Onda 2 limpa o resto.

### Lint rule

ESLint custom: `no-restricted-syntax` proibindo `<input>` JSX em `src/pages/admin/`. Allowlist via comentário.

## Onda

- 🔴 Onda 1 (ChangePassword, BillingAutomation, ContactForm)
- 🟠 Onda 2 (codemod resto)

## Relações

- [[../07-frontend/design-system]]
- [[colors-hardcoded-tasks]]
- [[../12-decisions/ADR-001-no-third-party-ui]]

## Referências

- `docs/AUDIT-2026-04-23.md` §1.2
- `docs/DESIGN-SYSTEM.md` §14
