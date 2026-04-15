-- PROBLEMA 18 — trigger de bloqueio contra escrita em snapshots
-- legados de clients. Forca consumo via client_financial_summary
-- e RPCs de contrato. Leitura permanece permitida (historico
-- pre-P10 ainda mora nesses campos ate backfill completo).
--
-- Colunas guardadas: monthly_value, project_total_value,
-- contract_status, contract_type, contract_start, contract_end,
-- scope_summary, payment_due_day.

CREATE OR REPLACE FUNCTION public.fn_guard_clients_legacy_snapshots()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.monthly_value IS DISTINCT FROM OLD.monthly_value THEN
      RAISE EXCEPTION 'clients.monthly_value e snapshot legado — leia via client_financial_summary.monthly_value_calculated. Dados vem de project_subscriptions/charges.';
    END IF;
    IF NEW.project_total_value IS DISTINCT FROM OLD.project_total_value THEN
      RAISE EXCEPTION 'clients.project_total_value e snapshot legado — leia via client_financial_summary.project_total_value_calculated.';
    END IF;
    IF NEW.contract_status IS DISTINCT FROM OLD.contract_status THEN
      RAISE EXCEPTION 'clients.contract_status e snapshot legado — use transition_project_contract RPC. Leia via client_financial_summary.contract_status_calculated.';
    END IF;
    IF NEW.contract_type IS DISTINCT FROM OLD.contract_type THEN
      RAISE EXCEPTION 'clients.contract_type e snapshot legado — dado vem de project_contracts.';
    END IF;
    IF NEW.contract_start IS DISTINCT FROM OLD.contract_start THEN
      RAISE EXCEPTION 'clients.contract_start e snapshot legado — use project_contracts.signed_at.';
    END IF;
    IF NEW.contract_end IS DISTINCT FROM OLD.contract_end THEN
      RAISE EXCEPTION 'clients.contract_end e snapshot legado — use project_contracts.ends_at.';
    END IF;
    IF NEW.scope_summary IS DISTINCT FROM OLD.scope_summary THEN
      RAISE EXCEPTION 'clients.scope_summary e snapshot legado — dado vem de project_contracts.scope_summary.';
    END IF;
    IF NEW.payment_due_day IS DISTINCT FROM OLD.payment_due_day THEN
      RAISE EXCEPTION 'clients.payment_due_day e snapshot legado — dado vem de project_subscriptions.due_day.';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Permite defaults (0/NULL/'ativo') para nao quebrar criacao de cliente novo.
    IF NEW.monthly_value IS NOT NULL AND NEW.monthly_value <> 0 THEN
      RAISE EXCEPTION 'clients.monthly_value nao pode ser setado no insert — crie via create_project_with_billing RPC.';
    END IF;
    IF NEW.project_total_value IS NOT NULL AND NEW.project_total_value <> 0 THEN
      RAISE EXCEPTION 'clients.project_total_value nao pode ser setado no insert — crie via create_project_with_billing RPC.';
    END IF;
    IF NEW.contract_type IS NOT NULL THEN
      RAISE EXCEPTION 'clients.contract_type nao pode ser setado no insert — dado vem de project_contracts.';
    END IF;
    IF NEW.contract_start IS NOT NULL THEN
      RAISE EXCEPTION 'clients.contract_start nao pode ser setado no insert — dado vem de project_contracts.signed_at.';
    END IF;
    IF NEW.contract_end IS NOT NULL THEN
      RAISE EXCEPTION 'clients.contract_end nao pode ser setado no insert — dado vem de project_contracts.ends_at.';
    END IF;
    IF NEW.scope_summary IS NOT NULL THEN
      RAISE EXCEPTION 'clients.scope_summary nao pode ser setado no insert — dado vem de project_contracts.scope_summary.';
    END IF;
    IF NEW.payment_due_day IS NOT NULL THEN
      RAISE EXCEPTION 'clients.payment_due_day nao pode ser setado no insert — dado vem de project_subscriptions.due_day.';
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_guard_clients_legacy_snapshots ON public.clients;
CREATE TRIGGER trg_guard_clients_legacy_snapshots
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_guard_clients_legacy_snapshots();

COMMENT ON FUNCTION public.fn_guard_clients_legacy_snapshots() IS
  'PROBLEMA 18: bloqueia escrita nos snapshots legados em clients (monthly_value, project_total_value, contract_status, contract_type, contract_start, contract_end, scope_summary, payment_due_day). Leitura permanece permitida para compatibilidade com dados pre-P10. UPDATEs idempotentes (sem mudanca) passam via IS DISTINCT FROM. Campos serao dropados em ciclo futuro apos todos os consumidores lerem via client_financial_summary.';
