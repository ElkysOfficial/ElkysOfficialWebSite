-- Limpeza pontual solicitada:
--   Apagar todas as faturas (charges) do cliente "Ramiro Silva" com due_date
--   em 2025 (inclui pagas, pendentes e vencidas - autorizado pelo usuario).
--
-- Reexecucao: a migration anterior (20260414120000) ja havia aplicado a mesma
-- limpeza, porem novas faturas 2025 foram recriadas e continuam aparecendo em
-- inadimplencia na tela financeira. Esta migration repete o DELETE.

BEGIN;

DO $$
DECLARE
  v_charges_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_charges_count
  FROM public.charges
  WHERE due_date >= DATE '2025-01-01'
    AND due_date <= DATE '2025-12-31'
    AND client_id IN (
      SELECT id FROM public.clients
      WHERE full_name ILIKE '%ramiro%'
         OR nome_fantasia ILIKE '%ramiro%'
         OR razao_social ILIKE '%ramiro%'
    );

  RAISE NOTICE '[cleanup] charges do Ramiro (2025) a apagar: %', v_charges_count;
END $$;

DELETE FROM public.charges
WHERE due_date >= DATE '2025-01-01'
  AND due_date <= DATE '2025-12-31'
  AND client_id IN (
    SELECT id FROM public.clients
    WHERE full_name ILIKE '%ramiro%'
       OR nome_fantasia ILIKE '%ramiro%'
       OR razao_social ILIKE '%ramiro%'
  );

COMMIT;
