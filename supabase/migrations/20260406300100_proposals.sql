-- Proposals system
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id),
  lead_id UUID REFERENCES public.leads(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviada','aprovada','rejeitada','expirada')),
  valid_until DATE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  scope_summary TEXT,
  payment_conditions TEXT,
  observations TEXT,
  document_url TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage proposals" ON public.proposals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin_super','admin')));

-- Client read access for sent/approved/rejected proposals
CREATE POLICY "Clients can view their proposals" ON public.proposals FOR SELECT
  USING (
    status != 'rascunho'
    AND client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Client can update status (approve/reject only)
CREATE POLICY "Clients can respond to proposals" ON public.proposals FOR UPDATE
  USING (
    status = 'enviada'
    AND client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('aprovada','rejeitada')
  );

CREATE INDEX idx_proposals_status ON public.proposals (status);
CREATE INDEX idx_proposals_client_id ON public.proposals (client_id);
CREATE INDEX idx_proposals_lead_id ON public.proposals (lead_id);
CREATE INDEX idx_proposals_created_at ON public.proposals (created_at DESC);
