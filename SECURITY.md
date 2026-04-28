# Política de Segurança — Elkys

## Reportar uma vulnerabilidade

Se você encontrou uma vulnerabilidade de segurança no website ou nos
portais Elkys, por favor **NÃO abra uma issue pública**. Em vez disso:

- E-mail: **contato@elkys.com.br** (assunto: `[security] <breve descricao>`)
- Resposta inicial: até 5 dias úteis
- Tempo médio de correção: 14 dias para vulnerabilidades altas/críticas

Solicitamos divulgação coordenada: aguarde a correção ser liberada
antes de tornar pública qualquer informação sobre a vulnerabilidade.

## Escopo

Estão no escopo deste programa:

- `https://elkys.com.br` (site público)
- `https://elkys.com.br/portal/admin/*` (portal administrativo)
- `https://elkys.com.br/portal/cliente/*` (portal do cliente)
- Edge Functions hospedadas em Supabase do projeto Elkys

**Fora do escopo**:

- DoS / DDoS
- Engenharia social, phishing, físico
- Vulnerabilidades em dependências de terceiros já publicadas (use o
  canal do mantenedor original)
- Ausência de cabeçalhos sem impacto demonstrado
- Issues de configuração de e-mail (SPF/DKIM/DMARC) sem prova de abuso

## Boas práticas para o time

### Tratamento de secrets

| Tipo                                   | Local correto                         | NUNCA pode estar em                                                         |
| -------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`            | Edge Functions (`Deno.env`)           | `src/`, `dist/`, repositório, logs                                          |
| `FTP_PASSWORD`, `FTP_USERNAME`         | GitHub Secrets                        | Workflow YAML em texto, repositório                                         |
| `DISCORD_WEBHOOK`                      | GitHub Secrets                        | Workflow YAML em texto, repositório                                         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` (anon) | `.env` local + GitHub Secrets para CI | OK no bundle (público por design, protegido por RLS)                        |
| `VITE_EMAILJS_PUBLIC_KEY`              | `.env` local + GitHub Secrets para CI | OK no bundle (público por design, mitigado por dominio whitelist no painel) |
| Senhas de teste E2E                    | `e2e/.env` (gitignore'd)              | `e2e/.env.example`, repositório                                             |

### Princípios

1. **Nunca commitar `.env`** — está no `.gitignore` raiz e o
   pre-commit hook bloqueia.
2. **Anon key da Supabase é pública por design** — proteção real está
   no RLS. Nunca confie no anon key como barreira de acesso.
3. **Service role só em server-side** — apenas Edge Functions, nunca
   no frontend, scripts locais ou logs.
4. **Logs não devem conter PII nem tokens** — em prod, `console.*` é
   removido pelo Vite (drop em esbuild/terser). Em dev, evitar logar
   `JSON.stringify(user)` ou headers `Authorization`.
5. **Rotação de secrets é normal** — qualquer suspeita de vazamento,
   rotacione antes de investigar.

### RLS (Row-Level Security)

- Toda tabela em `public` deve ter `ENABLE ROW LEVEL SECURITY`.
- Toda tabela com dados de cliente deve ter pelo menos uma policy
  filtrando por `auth.uid()`.
- Operações de escrita do cliente que precisam bypassar RLS devem
  usar `SECURITY DEFINER` em funções RPC dedicadas, com `auth.uid()`
  validado dentro da função.

### Dependências

- `npm audit --audit-level=high --omit=dev` roda no CI (workflow
  `security.yml`) em PRs, push em `main` e semanalmente.
- Dependências de produção com vulnerabilidade alta/crítica bloqueiam
  o merge.

## Rotação de secrets

| Secret             | Periodicidade recomendada                   | Onde rotacionar                                                |
| ------------------ | ------------------------------------------- | -------------------------------------------------------------- |
| Anon key Supabase  | Apenas se houver suspeita                   | Dashboard Supabase → Settings → API                            |
| Service role key   | Apenas se houver suspeita                   | Dashboard Supabase → Settings → API + atualizar Edge Functions |
| FTP_PASSWORD       | A cada 6 meses ou se houver acesso indevido | hPanel Hostinger + GitHub Secrets                              |
| Discord webhook    | Se vazar                                    | Discord → Edit Channel → Integrations                          |
| EmailJS public key | A cada 12 meses                             | Painel EmailJS + `.env`                                        |

## Contato

- **DPO / Encarregado**: contato@elkys.com.br
- **Security**: contato@elkys.com.br (mesmo canal, prefixo `[security]`)
