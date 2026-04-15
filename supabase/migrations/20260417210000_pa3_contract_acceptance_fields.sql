-- PA3 (PROBLEMA 20) — Aceite formal de contrato pelo cliente.
--
-- Lacuna detectada na auditoria geral: a tabela project_contracts
-- nao tinha campos para registrar QUANDO e QUEM (cliente) aceitou
-- formalmente o contrato antes da execucao. signed_at e ATO interno
-- (assinatura na Elkys), nao aceite do cliente.
--
-- Adiciona tres colunas:
--   accepted_at              timestamptz  — marco temporal do aceite
--   accepted_by_user_id      uuid FK auth — quem aceitou (cliente)
--   acceptance_ip            text         — IP no momento do aceite
--
-- Todas nullable — contratos legados ficam sem aceite, novos precisam.

BEGIN;

ALTER TABLE public.project_contracts
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acceptance_ip text;

COMMENT ON COLUMN public.project_contracts.accepted_at IS
  'Timestamp do aceite formal do contrato pelo cliente. NULL = nao aceito. Setado exclusivamente pela RPC register_contract_acceptance.';

COMMENT ON COLUMN public.project_contracts.accepted_by_user_id IS
  'auth.users.id do usuario cliente que aceitou o contrato. Verificado contra clients.user_id na RPC.';

COMMENT ON COLUMN public.project_contracts.acceptance_ip IS
  'IP capturado no momento do aceite para fins de auditoria juridica. Pode ser NULL em contratos aceitos antes desta coluna existir.';

CREATE INDEX IF NOT EXISTS idx_project_contracts_accepted_at
  ON public.project_contracts (accepted_at)
  WHERE accepted_at IS NOT NULL;

COMMIT;
