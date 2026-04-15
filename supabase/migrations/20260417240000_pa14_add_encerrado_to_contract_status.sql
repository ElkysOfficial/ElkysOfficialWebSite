-- PA14 (PROBLEMA 23) — preservar distincao entre 'encerrado' e
-- 'cancelado' em client_financial_summary. Hoje a view mapeia
-- encerrado -> cancelado (herdado do enum contract_status de
-- clients, que so tem ativo/inadimplente/cancelado).
--
-- Esta migration adiciona 'encerrado' ao enum contract_status
-- (dominio financeiro em clients). A proxima migration recria
-- a view emitindo encerrado corretamente.
--
-- 'encerrado' = contrato concluiu naturalmente (duracao acabou)
-- 'cancelado' = interrupcao forcada (rescisao ou cancelamento)
-- Sao semanticamente diferentes e precisam aparecer separados.

ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'encerrado';
