---
title: Fluxos — MOC
tags: [flows, moc]
---

# Fluxos — MOC

Fluxos são as **sequências cross-camada** que descrevem como o produto se comporta na prática. Cada fluxo amarra UI + edge + DB + cron.

## Fluxos de auth e identidade

- [[auth-flow]] — login → roles → redirect
- [[first-access-flow]] — primeiro acesso e troca obrigatória de senha
- [[password-reset-flow]] — esqueci minha senha
- [[terms-acceptance-flow]] — aceite de termos com versão

## Fluxos comerciais

- [[lead-to-client-flow]] — lead vira cliente
- [[proposal-flow]] — criar → enviar → aprovar/rejeitar/expirar
- [[contract-acceptance-flow]] — admin emite contrato → cliente aceita

## Fluxos financeiros

- [[charge-creation-flow]] — origem (parcela, mensalidade, manual) → INSERT charges
- [[overdue-cron-flow]] — diário 02h UTC
- [[billing-rules-flow]] — diário 08h UTC
- [[invoice-reminder-flow]] — diário 09h UTC
- [[pause-resume-flow]] — financial blocks
- [[inadimplencia-flow]] — D+15 / D+30 com idempotência

## Fluxos de projeto

- [[project-creation-flow]] — admin cria → contrato → instalments + subscriptions
- [[project-stage-change-flow]] — etapa muda → email
- [[validation-round-flow]] — round QA cliente↔interno
- [[project-completion-flow]] — concluido → email + arquivamento

## Fluxos de suporte

- [[ticket-open-flow]] — cliente abre → email pra suporte
- [[ticket-reply-flow]] — admin responde → email pra cliente

## Fluxos de notificação

- [[scheduled-notifications-flow]] — cron 5min
- [[broadcast-notification-flow]] — admin dispara campanha

## Fluxos de auditoria

- [[audit-trigger-flow]] — UPDATE/DELETE em tabelas críticas → audit_logs
- [[legal-acceptance-flow]] — aceite imutável
