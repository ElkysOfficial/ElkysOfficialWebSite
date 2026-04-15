-- Limpeza pontual solicitada pelo usuario:
-- Apagar TODAS as linhas da tabela expenses para recadastro do zero.
-- Inclui qualquer is_fixed, qualquer categoria, qualquer data.
-- Conta previa via RAISE NOTICE para auditoria.

BEGIN;

DO $$
DECLARE
  v_expenses_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_expenses_count FROM public.expenses;
  RAISE NOTICE '[cleanup] expenses a apagar: %', v_expenses_count;
END $$;

DELETE FROM public.expenses;

COMMIT;
