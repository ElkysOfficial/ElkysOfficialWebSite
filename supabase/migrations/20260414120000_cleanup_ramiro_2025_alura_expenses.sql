-- Limpeza pontual solicitada:
--   1. Apagar todas as faturas (charges) do cliente "Ramiro" com due_date em 2025
--      (inclui faturas pagas - confirmado pelo usuario).
--   2. Apagar todas as despesas (expenses) referentes a "Alura" (provedor de cursos),
--      matching em description OU notes.
--
-- Executa dentro de uma transacao com contagem previa via RAISE NOTICE para auditoria.

BEGIN;

DO $$
DECLARE
  v_charges_count INTEGER;
  v_expenses_count INTEGER;
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

  SELECT COUNT(*) INTO v_expenses_count
  FROM public.expenses
  WHERE description ILIKE '%alura%'
     OR notes ILIKE '%alura%';

  RAISE NOTICE '[cleanup] charges do Ramiro (2025) a apagar: %', v_charges_count;
  RAISE NOTICE '[cleanup] expenses referentes a Alura a apagar: %', v_expenses_count;
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

DELETE FROM public.expenses
WHERE description ILIKE '%alura%'
   OR notes ILIKE '%alura%';

COMMIT;
