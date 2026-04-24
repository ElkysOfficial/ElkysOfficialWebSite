-- Fase 3a da regua de paralisacao (docs/ROADMAP-BILLING-ESCALATION.md).
-- Tracking de transicoes reais de contract_status para inadimplente
-- + cron da funcao que marca clientes + cron da edge function de envio.
--
-- Principios:
--  - 1 envio por evento de entrada em inadimplencia (unique index em client_id
--    WHERE exited_at IS NULL).
--  - So reenvia se cliente sair da condicao e voltar depois (novo evento).
--  - SQL nao chama HTTP: o trigger apenas insere linha na tabela, e um cron
--    separado dispara a edge function que le as linhas pendentes.
--  - Toda DDL com guards IF NOT EXISTS / DROP IF EXISTS para idempotencia.

-- 1) Tabela de eventos de inadimplencia.
CREATE TABLE IF NOT EXISTS public.client_inadimplencia_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ,
  warning_sent_at TIMESTAMPTZ,
  warning_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantia critica: uma unica linha "aberta" por cliente.
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_inadimplencia_warnings_open
  ON public.client_inadimplencia_warnings (client_id)
  WHERE exited_at IS NULL;

-- Indice para a edge function varrer rapidamente os pendentes.
CREATE INDEX IF NOT EXISTS idx_client_inadimplencia_warnings_pending_send
  ON public.client_inadimplencia_warnings (entered_at)
  WHERE warning_sent_at IS NULL
    AND exited_at IS NULL
    AND warning_error IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_inadimplencia_warnings_client
  ON public.client_inadimplencia_warnings (client_id, entered_at DESC);

ALTER TABLE public.client_inadimplencia_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and finance can view inadimplencia warnings"
  ON public.client_inadimplencia_warnings;
CREATE POLICY "Admins and finance can view inadimplencia warnings"
  ON public.client_inadimplencia_warnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin_super', 'admin', 'financeiro')
    )
  );

-- 2) Trigger: captura apenas transicoes reais de contract_status.
CREATE OR REPLACE FUNCTION public.track_client_inadimplencia_transitions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $trig$
BEGIN
  -- Entrou em inadimplencia: abre novo evento.
  -- ON CONFLICT DO NOTHING protege contra writes duplicados caso exista
  -- algum caminho de codigo que marque o cliente duas vezes na mesma transacao.
  IF (OLD.contract_status IS DISTINCT FROM 'inadimplente')
     AND NEW.contract_status = 'inadimplente' THEN
    INSERT INTO public.client_inadimplencia_warnings (client_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;

  -- Saiu de inadimplencia: fecha o evento aberto (se houver).
  ELSIF OLD.contract_status = 'inadimplente'
        AND (NEW.contract_status IS DISTINCT FROM 'inadimplente') THEN
    UPDATE public.client_inadimplencia_warnings
       SET exited_at = now()
     WHERE client_id = NEW.id
       AND exited_at IS NULL;
  END IF;

  RETURN NEW;
END;
$trig$;

DROP TRIGGER IF EXISTS trg_track_client_inadimplencia_transitions ON public.clients;
CREATE TRIGGER trg_track_client_inadimplencia_transitions
AFTER UPDATE OF contract_status ON public.clients
FOR EACH ROW
WHEN (OLD.contract_status IS DISTINCT FROM NEW.contract_status)
EXECUTE FUNCTION public.track_client_inadimplencia_transitions();

-- 3) Cron diario que marca inadimplentes. A funcao ja existia
--    (20260326220000_auto_inadimplente_cron.sql) mas nunca teve cron agendado.
--    Roda as 07:00 UTC (04h BRT), antes do process-billing-rules (08:00 UTC).
--    cron.unschedule protege rerun da migration.
DO $$
BEGIN
  PERFORM cron.unschedule('mark-overdue-clients-inadimplente')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mark-overdue-clients-inadimplente');
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

SELECT cron.schedule(
  'mark-overdue-clients-inadimplente',
  '0 7 * * *',
  $$SELECT public.mark_overdue_clients_inadimplente();$$
);

-- 4) Cron diario que envia o aviso. Roda 30min apos a marcacao, dando folga
--    para o trigger commitar os INSERTs. O body do POST nao carrega IDs:
--    a edge function le client_inadimplencia_warnings filtrando pendentes,
--    o que naturalmente limita o envio aos eventos recem-transicionados.
DO $$
BEGIN
  PERFORM cron.unschedule('send-inadimplencia-warning')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-inadimplencia-warning');
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

SELECT cron.schedule(
  'send-inadimplencia-warning',
  '30 7 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-inadimplencia-warning',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{"triggered_by":"cron"}'::jsonb
    );
  $$
);
