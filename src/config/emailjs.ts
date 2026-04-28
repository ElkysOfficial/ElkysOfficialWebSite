// EmailJS Configuration
//
// SDK do EmailJS roda no navegador, entao a Public Key sai no bundle por
// design. Para reduzir o impacto de uma key vazada (rotacao + dominio
// whitelist no painel do EmailJS), os IDs vivem em variaveis VITE_ e
// caem em fallback hardcoded apenas para nao quebrar deploys legados.
//
// Para rotacionar:
//   1. Crie nova service/template/key no painel EmailJS
//   2. Atualize as VITE_EMAILJS_* no .env de prod (ou GitHub Actions)
//   3. Remova as antigas no painel
const env = import.meta.env;

export const EMAILJS_CONFIG = {
  SERVICE_ID: env.VITE_EMAILJS_SERVICE_ID ?? "service_303qji7",
  TEMPLATE_ID: env.VITE_EMAILJS_TEMPLATE_ID ?? "template_6cjrpgd",
  AUTO_REPLY_TEMPLATE_ID: env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID ?? "template_qxs9nk6",
  PUBLIC_KEY: env.VITE_EMAILJS_PUBLIC_KEY ?? "hssG8OmBmAFOTelKA",

  // Google Calendar link publico (sent in auto-reply)
  CALENDAR_LINK: "https://calendar.app.google/PBxfwurV31hdDfiK7",
} as const;
