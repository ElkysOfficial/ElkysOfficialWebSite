-- Refinamento da cópia do template D+15 (docs/ROADMAP-BILLING-ESCALATION.md §3a).
--
-- Contexto: a regra D+15 foi inserida em 20260423120000_billing_rules_d3_d15.sql
-- com body generico ("evitar medidas administrativas"). O roadmap prescreve que
-- este email seja o *aviso de paralisacao iminente* — deve dizer explicitamente
-- que o projeto sera pausado se o cliente nao regularizar, e em quantos dias.
-- A mensagem anterior era ambigua o suficiente para nao acionar o cliente.
--
-- Mantemos o mesmo template (id estavel, billing_actions_log preservado) e
-- apenas substituimos body + subject. WHERE garante idempotencia e evita
-- sobrescrever copia ja ajustada manualmente pelo admin via UI.

UPDATE public.billing_templates
SET
  subject = 'Acao necessaria: risco de pausa do projeto - {{description}}',
  body    = 'Ola {{client_name}}, a cobranca "{{description}}" no valor de {{amount}}, com vencimento em {{due_date}}, permanece em aberto ha 15 dias. Caso a pendencia nao seja regularizada nos proximos dias, o projeto vinculado sera pausado automaticamente conforme politica financeira, ate a quitacao. Se o pagamento ja foi realizado, desconsidere este aviso. Para negociar ou esclarecer a situacao, estamos a disposicao pelo portal.',
  updated_at = now()
WHERE name = 'Aviso 15 dias em atraso'
  AND body NOT LIKE '%pausado automaticamente%';
