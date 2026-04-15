-- PROBLEMA 15 — vinculo Aceite ↔ Suporte (etapa 15 do fluxo).
--
-- Adiciona:
--   1) projects.warranty_period_days (default 90 dias)
--   2) support_tickets.in_warranty (flag preenchido pela RPC)
-- Sem trigger automatico — o calculo precisa de auth.uid()/regras de
-- negocio que ficam mais limpas em uma RPC controlada.

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS warranty_period_days integer NOT NULL DEFAULT 90;

COMMENT ON COLUMN public.projects.warranty_period_days IS
  'Periodo de garantia em dias contado a partir de accepted_at. Default 90 dias (referencia de mercado para servicos de software). Tickets abertos dentro dessa janela sao marcados in_warranty=true automaticamente pela RPC open_project_support_ticket.';

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS in_warranty boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.support_tickets.in_warranty IS
  'TRUE quando o ticket foi aberto dentro da janela de garantia do projeto vinculado (project.accepted_at + project.warranty_period_days). Preenchido automaticamente pela RPC open_project_support_ticket — nunca editar manualmente.';

CREATE INDEX IF NOT EXISTS idx_support_tickets_warranty
  ON public.support_tickets (project_id, in_warranty)
  WHERE project_id IS NOT NULL;

COMMIT;
