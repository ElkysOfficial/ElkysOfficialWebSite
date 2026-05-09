---
title: ADR-005 — manualChunks por arquivo, não por objeto
tags: [adr, performance, build]
status: accepted-corrective
---

# ADR-005 — manualChunks por arquivo, não por objeto

## Contexto

Até a v2.83.4, `vite.config.ts` definia `manualChunks` no formato **objeto** (chave = nome do chunk, valor = array de módulos). Isso parecia limpo, mas vazava dependências transitivas: `clsx` foi parar em `recharts-vendor` (98KB) e era baixado na landing pública.

## Decisão

Migrar `manualChunks` para a forma **função `(id) => string`**, decidindo por arquivo (`id`) qual chunk receber o módulo. Isso impede vazamento transitivo.

## Alternativas

- Continuar com objeto (status quo) — descartado por bundle de landing inflar 98KB.
- Sem manualChunks (deixar Vite splitar automático) — descartado: produzia muitos chunks pequenos com tradeoff de cache pior.

## Consequências

### Positivas

- Landing **não** baixa `recharts-vendor`.
- Controle por _path glob_ (`/node_modules/recharts/...` → `recharts-vendor`).

### Negativas

- Arquivo `vite.config.ts` mais verboso.
- Adicionar nova lib pesada exige decisão consciente em qual chunk vai.

## Convenção atual

```
react-vendor      ← react, react-dom, react-router-dom, @tanstack/react-query
form-vendor       ← react-hook-form, @hookform/resolvers, zod
recharts-vendor   ← recharts
supabase-vendor   ← @supabase/*
```

Entry chunk é **inlined** no HTML para eliminar 1 RTT crítico (~27KB gzip). PurgeCSS isola CSS landing × portal.

## Relações

- [[../11-performance/build-pipeline]]
- [[../11-performance/bundle-strategy]]
- Memory: [[../../memory/project_manualchunks_gotcha]]

## Referências

- `vite.config.ts`
- `package.json` (scripts `build`, `build:min`)
