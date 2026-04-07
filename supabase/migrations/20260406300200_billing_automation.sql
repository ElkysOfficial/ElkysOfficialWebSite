-- Billing automation: templates, rules and action log
CREATE TABLE public.billing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cobranca' CHECK (type IN ('cobranca','lembrete','agradecimento')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.billing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_days INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('email','notificacao')),
  template_id UUID REFERENCES public.billing_templates(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.billing_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id UUID NOT NULL REFERENCES public.charges(id),
  rule_id UUID REFERENCES public.billing_rules(id),
  action_type TEXT NOT NULL,
  template_id UUID REFERENCES public.billing_templates(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado','falha')),
  error_message TEXT,
  triggered_by TEXT NOT NULL DEFAULT 'cron' CHECK (triggered_by IN ('cron','manual'))
);

ALTER TABLE public.billing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage billing templates" ON public.billing_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')));

CREATE POLICY "Admins can manage billing rules" ON public.billing_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')));

CREATE POLICY "Admins can view billing log" ON public.billing_actions_log FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')));

CREATE INDEX idx_billing_rules_active ON public.billing_rules (is_active, sort_order);
CREATE INDEX idx_billing_actions_log_charge ON public.billing_actions_log (charge_id, sent_at DESC);
CREATE INDEX idx_billing_actions_log_sent ON public.billing_actions_log (sent_at DESC);

-- Seed default templates
INSERT INTO public.billing_templates (name, subject, body, type) VALUES
  ('Lembrete 3 dias antes', 'Lembrete: cobranca vence em breve', 'Ola {{client_name}}, sua cobranca "{{description}}" no valor de {{amount}} vence em {{due_date}}. Mantenha seus pagamentos em dia!', 'lembrete'),
  ('Cobranca no vencimento', 'Cobranca vence hoje', 'Ola {{client_name}}, sua cobranca "{{description}}" no valor de {{amount}} vence hoje ({{due_date}}). Realize o pagamento para evitar pendencias.', 'cobranca'),
  ('Cobranca em atraso', 'Cobranca em atraso', 'Ola {{client_name}}, sua cobranca "{{description}}" no valor de {{amount}} venceu em {{due_date}} e esta em atraso. Regularize o quanto antes.', 'cobranca'),
  ('Agradecimento por pagamento', 'Pagamento recebido - obrigado!', 'Ola {{client_name}}, confirmamos o recebimento do pagamento de {{amount}} referente a "{{description}}". Obrigado!', 'agradecimento');

-- Seed default rules
INSERT INTO public.billing_rules (name, trigger_days, action_type, template_id, sort_order) VALUES
  ('Lembrete 3 dias antes', -3, 'email', (SELECT id FROM public.billing_templates WHERE name = 'Lembrete 3 dias antes'), 1),
  ('Aviso no dia do vencimento', 0, 'email', (SELECT id FROM public.billing_templates WHERE name = 'Cobranca no vencimento'), 2),
  ('Cobranca 7 dias em atraso', 7, 'email', (SELECT id FROM public.billing_templates WHERE name = 'Cobranca em atraso'), 3);
