-- Etapa 4 / Step 3 da auditoria arquitetural (P-009 — versionamento de contratos).
--
-- Antes: project_contracts.version_no existia desde 20260329120000 mas
-- nunca era incrementado. Editar um contrato sobrescrevia silenciosamente
-- o estado anterior — sem trilha de aditivos, sem como responder "como
-- era esse contrato no dia X?". Falha estrutural para qualquer auditoria
-- juridica seria.
--
-- Esta migration:
--   1) Cria tabela project_contract_versions guardando snapshots dos
--      campos contratualmente relevantes a cada vez que um contrato e
--      editado.
--   2) Cria trigger BEFORE UPDATE em project_contracts que:
--      - snapshot do OLD em project_contract_versions
--      - incrementa NEW.version_no
--      - so dispara quando algum campo CONTRATUAL muda (total_amount,
--        scope, datas, status, payment_model). Edicoes administrativas
--        (updated_at puro, etc) nao geram versao nova.
--   3) Aceita uma "razao da mudanca" opcional via setting de sessao
--      `app.contract_change_reason` que o caller pode setar antes do
--      UPDATE para registrar o motivo do aditivo.

-- ────────────────────────────────────────────────────────────────────
-- 1) Tabela de versoes
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_contract_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.project_contracts(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  -- Snapshot dos campos contratuais.
  total_amount numeric(12,2),
  scope_summary text,
  payment_model payment_model,
  signed_at date,
  starts_at date,
  ends_at date,
  status contract_record_status,
  -- Janela de validade desta versao.
  valid_from timestamptz NOT NULL,
  valid_to timestamptz NOT NULL DEFAULT now(),
  -- Auditoria.
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  change_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_contract_versions_unique UNIQUE (contract_id, version_no)
);

ALTER TABLE public.project_contract_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS project_contract_versions_contract_idx
  ON public.project_contract_versions (contract_id, version_no DESC);

COMMENT ON TABLE public.project_contract_versions IS
  'Historico de versoes de project_contracts. Snapshot da versao anterior toda vez que um campo contratual muda. Trigger fn_version_project_contract preenche.';

-- RLS: leitura para admins e team (mesma granularidade de project_contracts).
-- INSERTs sao feitos exclusivamente pela trigger SECURITY DEFINER, entao
-- nao precisamos de policy de INSERT/UPDATE/DELETE para usuarios.
DROP POLICY IF EXISTS "Admins read contract versions" ON public.project_contract_versions;
CREATE POLICY "Admins read contract versions" ON public.project_contract_versions
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team read contract versions" ON public.project_contract_versions;
CREATE POLICY "Team read contract versions" ON public.project_contract_versions
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

-- ────────────────────────────────────────────────────────────────────
-- 2) Trigger function (SECURITY DEFINER para bypass de RLS)
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_version_project_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_reason text;
BEGIN
  -- So gera versao nova quando algo CONTRATUAL muda.
  IF (OLD.total_amount   IS DISTINCT FROM NEW.total_amount)
     OR (OLD.scope_summary IS DISTINCT FROM NEW.scope_summary)
     OR (OLD.payment_model IS DISTINCT FROM NEW.payment_model)
     OR (OLD.signed_at     IS DISTINCT FROM NEW.signed_at)
     OR (OLD.starts_at     IS DISTINCT FROM NEW.starts_at)
     OR (OLD.ends_at       IS DISTINCT FROM NEW.ends_at)
     OR (OLD.status        IS DISTINCT FROM NEW.status)
  THEN
    -- Razao opcional via session setting:
    --   SELECT set_config('app.contract_change_reason', 'Aditivo - escopo', true);
    BEGIN
      v_reason := NULLIF(current_setting('app.contract_change_reason', true), '');
    EXCEPTION WHEN OTHERS THEN
      v_reason := NULL;
    END;

    INSERT INTO public.project_contract_versions (
      contract_id, version_no,
      total_amount, scope_summary, payment_model,
      signed_at, starts_at, ends_at, status,
      valid_from, valid_to, changed_by, change_reason
    ) VALUES (
      OLD.id, OLD.version_no,
      OLD.total_amount, OLD.scope_summary, OLD.payment_model,
      OLD.signed_at, OLD.starts_at, OLD.ends_at, OLD.status,
      COALESCE(OLD.updated_at, OLD.created_at, now()),
      now(),
      auth.uid(),
      v_reason
    );

    NEW.version_no := COALESCE(OLD.version_no, 1) + 1;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$func$;

COMMENT ON FUNCTION public.fn_version_project_contract() IS
  'Trigger BEFORE UPDATE em project_contracts: snapshot da versao anterior em project_contract_versions e incrementa version_no quando campos contratuais mudam. SECURITY DEFINER para bypass de RLS na escrita do historico.';

-- ────────────────────────────────────────────────────────────────────
-- 3) Trigger
-- ────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_version_project_contracts ON public.project_contracts;
CREATE TRIGGER trg_version_project_contracts
  BEFORE UPDATE ON public.project_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_version_project_contract();

-- ────────────────────────────────────────────────────────────────────
-- 4) View de leitura unificada (current + historico)
-- ────────────────────────────────────────────────────────────────────
-- Util para a UI futura listar todas as versoes de um contrato em
-- ordem cronologica. Marca is_current para distinguir a versao vigente.

CREATE OR REPLACE VIEW public.project_contract_history AS
SELECT
  pc.id              AS contract_id,
  pc.version_no,
  pc.total_amount,
  pc.scope_summary,
  pc.payment_model,
  pc.signed_at,
  pc.starts_at,
  pc.ends_at,
  pc.status,
  COALESCE(pc.updated_at, pc.created_at) AS valid_from,
  NULL::timestamptz  AS valid_to,
  NULL::uuid         AS changed_by,
  NULL::text         AS change_reason,
  true               AS is_current
FROM public.project_contracts pc
UNION ALL
SELECT
  v.contract_id,
  v.version_no,
  v.total_amount,
  v.scope_summary,
  v.payment_model,
  v.signed_at,
  v.starts_at,
  v.ends_at,
  v.status,
  v.valid_from,
  v.valid_to,
  v.changed_by,
  v.change_reason,
  false              AS is_current
FROM public.project_contract_versions v;

COMMENT ON VIEW public.project_contract_history IS
  'Linha do tempo unificada de versoes de project_contracts. Une o estado atual (is_current=true) com o historico (is_current=false). Ordene por (contract_id, version_no DESC) ao consultar.';
