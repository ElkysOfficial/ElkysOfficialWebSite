---
title: documents.url sem validação de scheme
tags: [issue, medium, security]
severity: MEDIUM
---

# 🟠 M14 — `documents.url` aceita qualquer scheme

## Contexto

Coluna `documents.url` (e `external_url`, `proposals.document_url`) aceita texto livre. Sem validação de URL no DB nem no front. `javascript:alert()`, `data:text/html;base64,...` poderiam ser inseridos por admin malicioso ou erro de UI.

## Impacto

- **XSS via clique no documento** — usuário cliente clica em "abrir documento" e executa JS arbitrário.
- Mitigado parcialmente porque admin é trusted; mas refator pode escapar contexto.

## Recomendação

### Validação Zod no front

```ts
const urlSchema = z
  .string()
  .url()
  .refine((u) => ["http:", "https:", "mailto:"].includes(new URL(u).protocol), {
    message: "URL deve ser http(s) ou mailto",
  });
```

### Constraint no DB

```sql
ALTER TABLE documents
  ADD CONSTRAINT documents_url_scheme_check
  CHECK (
    url IS NULL OR
    url ~ '^https?://' OR
    url ~ '^mailto:'
  );
```

Mesma constraint para `external_url` e `proposals.document_url`.

### Render seguro

```tsx
<a href={url} target="_blank" rel="noopener noreferrer">
  ...
</a>
```

## Onda

- 🟠 Onda 2.

## Relações

- [[../02-domains/documents]]
- [[../10-security/index]]
