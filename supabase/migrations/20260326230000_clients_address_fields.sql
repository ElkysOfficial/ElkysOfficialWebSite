-- Add detailed address fields to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS logradouro  TEXT,
  ADD COLUMN IF NOT EXISTS numero      TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS bairro      TEXT;
