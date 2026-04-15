-- PROBLEMA 8 — marcar propostas de expansao (upsell/cross-sell de cliente
-- ja ativo) para distinguir de propostas de primeira venda.
--
-- Sem essa marca, metricas de expansion rate, NRR, CAC vs LTV ficam
-- impossiveis de calcular — toda proposta entra como "nova venda" no
-- funil mesmo quando e cliente ativo gerando nova oportunidade.

BEGIN;

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS is_expansion boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.proposals.is_expansion IS
  'TRUE quando a proposta foi criada para um cliente ativo (upsell, cross-sell, novo projeto). FALSE = primeira venda (lead convertido ou cliente novo sem historico). Permite calcular expansion rate, distinguir NRR, e nao confundir o funil comercial.';

-- Index parcial para queries de metricas (so nas que sao expansao).
CREATE INDEX IF NOT EXISTS idx_proposals_expansion
  ON public.proposals (client_id, created_at DESC)
  WHERE is_expansion = true;

COMMIT;
