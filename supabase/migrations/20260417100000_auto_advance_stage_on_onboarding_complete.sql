-- PROBLEMA 16 — avanco automatico de stage Hexa quando onboarding conclui.
-- Trigger BEFORE UPDATE que detecta transicao onboarding_completed_at
-- NULL -> NOT NULL e avanca current_stage de 'Acordo Formal' para
-- 'Imersao e Diagnostico' no mesmo UPDATE. Sem round-trip adicional,
-- sem janela de inconsistencia, idempotente por construcao.

CREATE OR REPLACE FUNCTION public.fn_auto_advance_stage_on_onboarding()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  IF OLD.onboarding_completed_at IS NULL
     AND NEW.onboarding_completed_at IS NOT NULL
     AND NEW.current_stage = 'Acordo Formal' THEN
    NEW.current_stage := 'Imersao e Diagnostico';
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_auto_advance_stage_on_onboarding ON public.projects;
CREATE TRIGGER trg_auto_advance_stage_on_onboarding
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_advance_stage_on_onboarding();

CREATE OR REPLACE FUNCTION public.fn_timeline_onboarding_stage_advance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF OLD.onboarding_completed_at IS NULL
     AND NEW.onboarding_completed_at IS NOT NULL
     AND OLD.current_stage = 'Acordo Formal'
     AND NEW.current_stage = 'Imersao e Diagnostico' THEN
    INSERT INTO public.timeline_events (
      client_id, project_id, event_type, title, summary, visibility,
      source_table, source_id, actor_user_id, metadata
    ) VALUES (
      NEW.client_id, NEW.id, 'project_stage_advanced',
      'Onboarding concluido — avancou para Imersao e Diagnostico',
      'Avanco automatico de stage apos conclusao do onboarding.',
      'interno', 'projects', NEW.id, auth.uid(),
      jsonb_build_object(
        'from_stage', 'Acordo Formal',
        'to_stage', 'Imersao e Diagnostico',
        'trigger', 'onboarding_completed_at'
      )
    );
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_timeline_onboarding_stage_advance ON public.projects;
CREATE TRIGGER trg_timeline_onboarding_stage_advance
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_timeline_onboarding_stage_advance();

COMMENT ON FUNCTION public.fn_auto_advance_stage_on_onboarding() IS
  'PROBLEMA 16: avanca current_stage de Acordo Formal para Imersao e Diagnostico quando onboarding_completed_at e preenchido. Idempotente (so dispara na transicao NULL->NOT NULL). Respeita stages customizados: nao regride se admin ja avancou manualmente.';

COMMENT ON FUNCTION public.fn_timeline_onboarding_stage_advance() IS
  'PROBLEMA 16: registra timeline event quando o trigger fn_auto_advance_stage_on_onboarding avanca o stage automaticamente. AFTER UPDATE para garantir que NEW ja reflete o estado persistido.';
