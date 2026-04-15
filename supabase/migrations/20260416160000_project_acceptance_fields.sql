-- PROBLEMA 7 — registrar aceite formal de entrega de projeto.
--
-- Hoje projects.delivered_at e o unico marco de entrega. Falta
-- registro estruturado de aceitacao do cliente: quando aceitou, quem
-- aceitou, com que ressalvas. Sem isso:
--   - risco contratual aberto (suporte vira discussao)
--   - transicao para pos-venda nao automatizada
--   - charge de entrega nao tem gatilho objetivo

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acceptance_notes text DEFAULT NULL;

COMMENT ON COLUMN public.projects.accepted_at IS
  'Timestamp do aceite formal do cliente sobre a entrega. NULL = aguardando aceite ou nao aplicavel. Quando preenchido, junto com accepted_by, e prova documental de aceite.';

COMMENT ON COLUMN public.projects.accepted_by IS
  'Usuario que registrou o aceite (admin marcando apos confirmacao verbal, ou cliente via portal).';

COMMENT ON COLUMN public.projects.acceptance_notes IS
  'Ressalvas, observacoes ou contexto do aceite. Ex: "Aceite com ressalvas: ajuste menor de cores pendente para sprint 2".';

COMMIT;
