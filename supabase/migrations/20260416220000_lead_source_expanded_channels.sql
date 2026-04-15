-- PROBLEMA 13 — leads.source CHECK rejeita 4 canais explicitamente
-- listados pelo usuario (site, whatsapp, formulario, reuniao) e tem
-- 'cold' como nome interno de "prospeccao". Esta migration:
--   1) Estende o CHECK incluindo todos os canais reais do funil Elkys.
--   2) Mantem retrocompat: valores antigos (inbound, indicacao,
--      rede_social, evento, cold, outro) continuam validos.
--   3) Default permanece 'inbound'.

BEGIN;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_source_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_source_check
  CHECK (source = ANY (ARRAY[
    -- canais de marketing inbound
    'inbound'::text,
    'site'::text,
    'formulario'::text,
    'rede_social'::text,
    -- canais conversacionais
    'whatsapp'::text,
    'reuniao'::text,
    -- canais comerciais
    'indicacao'::text,
    'cold'::text,
    'prospeccao'::text,
    'evento'::text,
    -- fallback
    'outro'::text
  ]));

COMMENT ON COLUMN public.leads.source IS
  'Canal pelo qual o lead entrou no funil. Valores oficiais alinhados ao fluxo Elkys: inbound, site, formulario, rede_social, whatsapp, reuniao, indicacao, cold, prospeccao, evento, outro. Quando expandir, atualizar tambem SOURCE_LABEL no TS (LeadDetail.tsx).';

COMMIT;
