# Backlog pós-v2.92.0

Snapshot do backlog após liberação da **v2.92.0** (NPS em entrega de projeto + ticket resolvido). Este documento registra o que ficou pendente da esteira de e-mails, próximos passos sugeridos e o que foi deliberadamente adiado.

> Data do snapshot: **2026-04-24**
> Versão corrente: **v2.92.0**

---

## ✅ Entregue até aqui

### v2.91.0 — Emails formais + campos estendidos

- **Onda 1 — emails formais**: 17 edge functions reescritas com tom formal uniforme (`Bom dia, Sr./Sra./Prezado(a) {nome},` + `Atenciosamente / Equipe Elkys`)
- Helper compartilhado `supabase/functions/_shared/greeting.ts` (saudação BRT, Sr./Sra., truncate, pluralização)
- Bugs do template corrigidos: preheader agora renderiza, `escapeAttr` em href (XSS), `showInstitutional`/`showSecurityNote` condicionais, `reply_to` configurável
- **Onda 2 — modelagem estendida**:
  - `clients` ganhou 18 colunas (gender, rg, birth_date, inscrições, CNAE, regime tributário, whatsapp, financeiro, SLA, owner_id, notes_internal, aceite_termos com trigger)
  - `team_members` ganhou 6 colunas (gender, cpf, birth_date, senioridade, manager_id, last_login_at)
  - 5 enums novos
- `ClientCreate` reorganizado em 4 steps (Identificação / Contato & Endereço / Comercial / Revisão)
- Seção Comercial colapsável em `ClientDetail`
- `TeamCreate`/`TeamEdit` estendidos

### v2.92.0 — NPS / feedback

- Bloco de avaliação condicional em `send-project-completed` (renderiza apenas com `REVIEW_URL` configurado)
- NPS em `send-ticket-updated` (evento `resolvido`): botões "Sim, resolveu" / "Ainda não" via `mailto` pré-preenchido
- Destinatário configurável via `SUPPORT_FEEDBACK_EMAIL` (fallback `REPLY_TO_EMAIL` → `contato@elkys.com.br`)

### Secrets configurados no Supabase

| Secret                   | Valor                                     |
| ------------------------ | ----------------------------------------- |
| `REVIEW_URL`             | `https://g.page/r/CYRKlvyrnr5DEAE/review` |
| `SUPPORT_FEEDBACK_EMAIL` | `suporte-feedback@elkys.com.br`           |
| `REPLY_TO_EMAIL`         | `contato@elkys.com.br`                    |

---

## 🟢 Fechamento da esteira de e-mails — v2.93.0 (sugerido)

Esforço: ~2 horas. Risco: baixo. Fecha limpo o ciclo de e-mails antes de mudar de domínio.

- [ ] Adicionar header `List-Unsubscribe` no `sendEmail` do `_shared/email-template.ts` — melhora reputação no Gmail, reduz spam score
  - Valor sugerido: `<mailto:unsubscribe@elkys.com.br>`
  - Adicionar também `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- [ ] **From display name** — trocar secret `FROM_EMAIL` de `noreply@elkys.com.br` para `Elkys <noreply@elkys.com.br>`
  - Só configuração, sem código
  - Cliente vê "Elkys" como remetente em vez do endereço cru

---

## 🟠 Equipe — gestão de capacidade — v2.94.0 (próxima feature grande)

Esforço: 1–2 dias. Impacto: abre cálculo de margem real e alocação no admin.

Campos a adicionar em `team_members`:

- [ ] `custo_hora` (numeric) — essencial para calcular margem de projeto
- [ ] `capacidade_horas_semanais` (integer) — dimensionamento de alocação
- [ ] `skills` (text[]) — matching em novos projetos
- [ ] `squad` (text) — agrupamento lógico de times
- [ ] `status_detalhado` (enum `ativo | suspenso | desligado`) — hoje só `is_active` booleano
- [ ] `created_by` (uuid FK auth.users) — auditoria de quem cadastrou

Nova tabela relacional:

- [ ] `project_team_members` (N:N entre `projects` e `team_members`) — quem está em qual projeto, com `role_in_project` e `allocation_percentage`

Forms:

- [ ] `TeamCreate`/`TeamEdit` — seção "Operacional" com os novos campos
- [ ] `ProjectDetail` — painel "Equipe do projeto" para gerenciar alocações

---

## 🟡 Cliente — ajustes pontuais (aproveitar em alguma feature)

Escopo pequeno, pode ir junto de outra entrega.

- [ ] `status_cliente` dedicado (enum `lead | ativo | churn | bloqueado`) — hoje é derivado de `contract_status + is_active`, o que atrapalha filtros explícitos
- [ ] `external_id` (text) — pra integrações com sistemas externos (ERP, CRM)
- [ ] `risk_score` (numeric 0–100) — útil para segmentação futura; opcional

---

## 🔴 Épico adiado — Onda 3 (reestruturação estrutural)

Separar `clients` em tabelas dedicadas:

- `companies` — dados PJ puros (razão social, CNPJ, inscrições, CNAE, regime)
- `people` — dados PF puros (nome, CPF, RG, nascimento, gender)
- `client_contacts` — já existe parcialmente, consolidar como tabela de junção
- `contracts` — já existe `project_contracts`, promover para domínio próprio
- `billing_profiles` — dados financeiros extraídos de `clients`

**Escopo**: ~40+ arquivos, refactor de 13 queries, 9 policies RLS, 17 edge functions, E2E tests (624 linhas).
**Tempo**: 1–2 semanas.
**Risco**: alto.

**Recomendação**: adiar até surgir dor concreta no modelo atual. O combo atual (`clients` + `client_contacts` + `project_contracts`) tem resolvido bem.

---

## 🔵 Outras áreas (fora da esteira de e-mails)

Referências para não perder de vista:

- `docs/AUDIT-2026-04-23.md` — backlog de QOL em 3 ondas (portal admin/cliente/marketing)
- `docs/ROADMAP.md` — roadmap do dashboard admin
- `e2e/fluxo-completo.spec.ts` — specs podem precisar atualizar com os novos campos de cliente/equipe

---

## Sugestão de ordem de ataque

1. **v2.93.0** — Fechamento de e-mails (List-Unsubscribe + From display name) — meio dia
2. **v2.94.0** — Capacidade de equipe (`custo_hora`, `skills`, `squad`, alocação N:N) — 1–2 dias
3. **v2.95.0+** — Ajustes pontuais de cliente (`status_cliente`, `external_id`) em alguma feature próxima
4. **Adiar** — Onda 3 estrutural, até virar bloqueador real
