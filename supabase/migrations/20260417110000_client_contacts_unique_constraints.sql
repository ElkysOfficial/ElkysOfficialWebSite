-- PROBLEMA 17 — integridade de client_contacts.
-- (1) UNIQUE parcial (client_id, lower(email)) evita duplicatas
--     case-insensitive sem bloquear contatos sem e-mail.
-- (2) UNIQUE parcial (client_id) WHERE is_primary garante 1 primario.
-- Pre-limpeza deterministica: mais antigo vence.

BEGIN;

-- Limpeza 1: desmarca primarios duplicados (mantem o mais antigo).
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY client_id
           ORDER BY created_at ASC, id ASC
         ) AS rn
    FROM public.client_contacts
   WHERE is_primary = true
)
UPDATE public.client_contacts c
   SET is_primary = false
  FROM ranked r
 WHERE c.id = r.id AND r.rn > 1;

-- Limpeza 2: renomeia e-mails duplicados (mantem o mais antigo).
WITH ranked AS (
  SELECT id, email,
         row_number() OVER (
           PARTITION BY client_id, lower(email)
           ORDER BY created_at ASC, id ASC
         ) AS rn
    FROM public.client_contacts
   WHERE email IS NOT NULL AND length(trim(email)) > 0
)
UPDATE public.client_contacts c
   SET email = c.email || '.dup-' || c.id::text
  FROM ranked r
 WHERE c.id = r.id AND r.rn > 1;

-- Constraint 1: unicidade case-insensitive de e-mail por cliente.
CREATE UNIQUE INDEX IF NOT EXISTS ux_client_contacts_client_email
  ON public.client_contacts (client_id, lower(email))
  WHERE email IS NOT NULL;

-- Constraint 2: no maximo 1 contato primario por cliente.
CREATE UNIQUE INDEX IF NOT EXISTS ux_client_contacts_one_primary
  ON public.client_contacts (client_id)
  WHERE is_primary = true;

COMMENT ON INDEX public.ux_client_contacts_client_email IS
  'PROBLEMA 17: impede duplicata de e-mail (case-insensitive) dentro do mesmo cliente. Parcial para permitir contatos so com telefone.';

COMMENT ON INDEX public.ux_client_contacts_one_primary IS
  'PROBLEMA 17: garante no maximo 1 contato primario por cliente. Parcial sobre is_primary=true.';

COMMIT;
