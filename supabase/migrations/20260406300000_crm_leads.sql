-- CRM: Leads and Lead Interactions
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT NOT NULL DEFAULT 'inbound' CHECK (source IN ('inbound','indicacao','rede_social','evento','cold','outro')),
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','qualificado','proposta','negociacao','ganho','perdido')),
  estimated_value NUMERIC(12,2) DEFAULT 0,
  probability SMALLINT DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  lost_reason TEXT,
  converted_client_id UUID REFERENCES public.clients(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ligacao','email','reuniao','whatsapp','nota')),
  notes TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leads" ON public.leads FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')));

CREATE POLICY "Admins can manage lead interactions" ON public.lead_interactions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')));

CREATE INDEX idx_leads_status ON public.leads (status);
CREATE INDEX idx_leads_source ON public.leads (source);
CREATE INDEX idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX idx_lead_interactions_lead_id ON public.lead_interactions (lead_id, created_at DESC);
