-- Fase 3a da regua de paralisacao (docs/ROADMAP-BILLING-ESCALATION.md).
-- Adiciona 2 templates e 2 regras na tabela billing_rules.
-- O cron process-billing-rules (0 8 * * *) ja processa qualquer trigger_days
-- configurado em billing_rules, com idempotencia diaria via billing_actions_log.
-- Nenhum codigo de edge function novo e necessario para D+3 e D+15.

-- Guards WHERE NOT EXISTS: protegem caso as rows ja tenham sido criadas
-- manualmente via UI/SQL antes da migration rodar.

INSERT INTO public.billing_templates (name, subject, body, type)
SELECT
  'Lembrete 3 dias em atraso',
  'Cobranca em aberto - {{description}}',
  'Ola {{client_name}}, identificamos que a cobranca "{{description}}" no valor de {{amount}}, com vencimento em {{due_date}}, ainda consta em aberto. Caso o pagamento ja tenha sido realizado, desconsidere este aviso. Em caso de duvidas, estamos a disposicao pelo portal.',
  'cobranca'
WHERE NOT EXISTS (
  SELECT 1 FROM public.billing_templates WHERE name = 'Lembrete 3 dias em atraso'
);

INSERT INTO public.billing_templates (name, subject, body, type)
SELECT
  'Aviso 15 dias em atraso',
  'Pendencia financeira em aberto ha 15 dias',
  'Ola {{client_name}}, a cobranca "{{description}}" no valor de {{amount}}, com vencimento em {{due_date}}, permanece em aberto ha 15 dias. Solicitamos a regularizacao para evitar medidas administrativas e escalacao do caso. Se precisar negociar ou esclarecer a situacao, entre em contato conosco pelo portal.',
  'cobranca'
WHERE NOT EXISTS (
  SELECT 1 FROM public.billing_templates WHERE name = 'Aviso 15 dias em atraso'
);

INSERT INTO public.billing_rules (name, trigger_days, action_type, template_id, sort_order)
SELECT
  'Lembrete 3 dias em atraso',
  3,
  'email',
  (SELECT id FROM public.billing_templates WHERE name = 'Lembrete 3 dias em atraso'),
  4
WHERE NOT EXISTS (
  SELECT 1 FROM public.billing_rules WHERE name = 'Lembrete 3 dias em atraso'
);

INSERT INTO public.billing_rules (name, trigger_days, action_type, template_id, sort_order)
SELECT
  'Aviso 15 dias em atraso',
  15,
  'email',
  (SELECT id FROM public.billing_templates WHERE name = 'Aviso 15 dias em atraso'),
  5
WHERE NOT EXISTS (
  SELECT 1 FROM public.billing_rules WHERE name = 'Aviso 15 dias em atraso'
);
