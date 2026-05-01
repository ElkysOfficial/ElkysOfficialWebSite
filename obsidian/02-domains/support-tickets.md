---
title: Domínio — Support Tickets
tags: [domain, support]
---

# Domínio — Support Tickets

## Contexto

Cliente abre tickets pelo portal; admin responde. Threading via `ticket_messages`. SLA tracking via `first_response_at` e `resolved_at`.

## Estrutura

| Campo               | Função                                           |
| ------------------- | ------------------------------------------------ |
| `subject`, `body`   | conteúdo inicial                                 |
| `status`            | `aberto`, `em_andamento`, `resolvido`, `fechado` |
| `priority`          | `baixa`, `media`, `alta`                         |
| `first_response_at` | auto-set na 1ª resposta admin                    |
| `resolved_at`       | auto-set ao resolver                             |
| `project_id`        | nullable; ticket pode ser geral                  |

`ticket_messages` (1:N) — `is_internal` (notas internas não visíveis ao cliente), `sender_user_id`.

## Fluxo

1. Cliente abre via `/portal/cliente/suporte` → INSERT `support_tickets` + INSERT primeira `ticket_messages`.
2. Trigger / front dispara `send-ticket-opened` → email para `TICKET_NOTIFY_EMAILS`.
3. Admin responde via `/portal/admin/suporte` → INSERT `ticket_messages`. Update de status. Trigger seta `first_response_at` se nulo.
4. `send-ticket-updated` envia email pro cliente.
5. Resolver: status = `resolvido` + `resolved_at = now()`.

## RLS

- Admin / `support` → full
- Cliente → tickets onde `client_id = get_client_id_for_portal_user(uid)`
- `ticket_messages`: cliente vê apenas onde `is_internal = false`

## Problemas Identificados

🟠 **Sem SLA visível ao cliente** — não há badge "respondemos em 24h úteis". Onda 1.
🟠 **Sem anexos** — cliente não consegue enviar print/documento. Onda 3.
🟢 **`priority` sem definição clara de SLA por nível**.

## Relações

- [[../03-features/support-sla]]
- [[../04-flows/ticket-open-flow]]
- [[../04-flows/ticket-reply-flow]]
- [[../06-api/edge-fn-send-ticket-opened]]
- [[../06-api/edge-fn-send-ticket-updated]]
- [[../03-features/ticket-thread]]

## Referências

- `src/pages/portal/cliente/Support.tsx`
- `src/pages/admin/Support.tsx`
- `src/lib/portal-sla.ts`
