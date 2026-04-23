-- =========================================================================
-- SMOKE TEST (v2.89.1): Reconciliacao de inadimplencia via view
-- =========================================================================
-- Rodar no Dashboard SQL editor APOS o hotfix v2.89.1 ter sido aplicado.
-- Toda manipulacao esta em BEGIN/ROLLBACK — nao deixa rastro.
--
-- Testa:
--   1) Primeira execucao sincroniza tabela com view.
--   2) Idempotencia: 2a execucao eh no-op (opened=0, closed=0).
--   3) reconcile fecha warning orfao (cliente nao-inadimplente com row aberta).
--   4) Unique partial index bloqueia duplo aberto.
--
-- Nao requer UPDATE em clients (o guard fn_guard_clients_legacy_snapshots
-- bloquearia). So usa leitura da view + inserts controlados em
-- client_inadimplencia_warnings.
-- =========================================================================

BEGIN;

DO $$
DECLARE
  v_opened INT;
  v_closed INT;
  v_repeat_opened INT;
  v_repeat_closed INT;
  v_baseline INT;
  v_open_rows INT;
  v_non_inadimplente_client UUID;
  v_any_open_client UUID;
BEGIN
  -- ========================================
  -- TEST 1: Sincronia com a view
  -- ========================================
  SELECT opened, closed INTO v_opened, v_closed
  FROM reconcile_inadimplencia_warnings();
  RAISE NOTICE '[TEST] 1a execucao: opened=% closed=%', v_opened, v_closed;

  SELECT COUNT(*) INTO v_baseline
  FROM client_financial_summary
  WHERE contract_status_calculated = 'inadimplente'
    AND client_id IS NOT NULL;

  SELECT COUNT(*) INTO v_open_rows
  FROM client_inadimplencia_warnings
  WHERE exited_at IS NULL;

  IF v_open_rows <> v_baseline THEN
    RAISE EXCEPTION '[TEST 1 FAIL] view diz % inadimplentes, tabela tem % abertas',
      v_baseline, v_open_rows;
  END IF;
  RAISE NOTICE '[TEST 1 OK] sincronia view<->tabela (% inadimplentes)', v_baseline;

  -- ========================================
  -- TEST 2: Idempotencia
  -- ========================================
  SELECT opened, closed INTO v_repeat_opened, v_repeat_closed
  FROM reconcile_inadimplencia_warnings();

  IF v_repeat_opened <> 0 OR v_repeat_closed <> 0 THEN
    RAISE EXCEPTION '[TEST 2 FAIL] 2a execucao deveria ser no-op, veio opened=% closed=%',
      v_repeat_opened, v_repeat_closed;
  END IF;
  RAISE NOTICE '[TEST 2 OK] idempotente (2a execucao: 0/0)';

  -- ========================================
  -- TEST 3: Fechar warning fake pra cliente nao-inadimplente
  -- ========================================
  SELECT cfs.client_id INTO v_non_inadimplente_client
  FROM client_financial_summary cfs
  WHERE cfs.contract_status_calculated <> 'inadimplente'
    AND cfs.client_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM client_inadimplencia_warnings w
      WHERE w.client_id = cfs.client_id
        AND w.exited_at IS NULL
    )
  LIMIT 1;

  IF v_non_inadimplente_client IS NULL THEN
    RAISE NOTICE '[TEST 3 SKIP] sem cliente nao-inadimplente disponivel';
  ELSE
    INSERT INTO client_inadimplencia_warnings (client_id)
    VALUES (v_non_inadimplente_client);

    SELECT opened, closed INTO v_opened, v_closed
    FROM reconcile_inadimplencia_warnings();

    IF v_closed < 1 THEN
      RAISE EXCEPTION '[TEST 3 FAIL] reconcile deveria fechar pelo menos o fake, veio closed=%',
        v_closed;
    END IF;
    RAISE NOTICE '[TEST 3 OK] reconcile fechou row fake (closed=%)', v_closed;
  END IF;

  -- ========================================
  -- TEST 4: Unique partial index bloqueia duplo aberto
  -- ========================================
  SELECT client_id INTO v_any_open_client
  FROM client_inadimplencia_warnings
  WHERE exited_at IS NULL
  LIMIT 1;

  IF v_any_open_client IS NULL THEN
    -- Nao ha clientes inadimplentes no momento; inserir um fake temporario
    SELECT cfs.client_id INTO v_any_open_client
    FROM client_financial_summary cfs
    WHERE cfs.client_id IS NOT NULL
    LIMIT 1;

    IF v_any_open_client IS NULL THEN
      RAISE NOTICE '[TEST 4 SKIP] sem cliente disponivel';
    ELSE
      INSERT INTO client_inadimplencia_warnings (client_id)
      VALUES (v_any_open_client);
    END IF;
  END IF;

  IF v_any_open_client IS NOT NULL THEN
    BEGIN
      INSERT INTO client_inadimplencia_warnings (client_id)
      VALUES (v_any_open_client);
      RAISE EXCEPTION '[TEST 4 FAIL] unique index nao bloqueou duplo aberto';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE '[TEST 4 OK] unique index bloqueou duplo aberto';
    END;
  END IF;

  RAISE NOTICE '=== TODOS OS TESTES PASSARAM ===';
END $$;

ROLLBACK;

-- Confirmar que nada sobrou (rodar apos o bloco acima):
-- SELECT COUNT(*) FROM client_inadimplencia_warnings;
-- -- deve bater com o valor baseline anterior ao teste
