-- R6 / P-012 — remover coluna clients.address redundante.
--
-- Antes: clients.address era uma string concatenada (logradouro+numero+
-- complemento) duplicando os campos individuais. Sem trigger de sincronia.
-- Risco: divergencia silenciosa entre address e os componentes.
--
-- Decisao: componentes (logradouro, numero, complemento, bairro, city,
-- state, cep, country) sao a fonte unica. UI ja foi atualizada para nao
-- escrever address. Esta migration dropa a coluna.

ALTER TABLE public.clients
  DROP COLUMN IF EXISTS address;
