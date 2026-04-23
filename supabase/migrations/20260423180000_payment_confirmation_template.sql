-- v2.90.0: atualiza template "Agradecimento por pagamento" em billing_templates.
--
-- Antes: 'Ola {{client_name}}, confirmamos o recebimento do pagamento de
--         {{amount}} referente a "{{description}}". Obrigado!'
--
-- Problema: duplicava a saudacao porque process-billing-rules ja injeta um
-- greeting via buildEmail. Email renderizava "Olá, José Pedro. Ola José Pedro,
-- confirmamos...". Redundante e pouco profissional.
--
-- Agora: texto sem saudacao (greeting fica por conta de buildEmail com
-- getTimeGreeting dinamico), 2 paragrafos separados por \n\n. O helper
-- escapeAndFormat converte \n para <br/> no render final.

UPDATE public.billing_templates
SET
  body = E'Confirmamos o recebimento do pagamento no valor de {{amount}}, referente ao serviço de {{description}}.\n\nAgradecemos pela regularização e permanecemos à disposição para qualquer necessidade adicional.',
  updated_at = now()
WHERE name = 'Agradecimento por pagamento';
