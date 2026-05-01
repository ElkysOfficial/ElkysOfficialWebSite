/**
 * Validacao de path para redirect pos-login (intended route).
 *
 * Aceita apenas path interno comecando com "/" e que nao seja
 * protocol-relative ("//evil.com" - alguns parsers tratam como URL absoluta)
 * nem use backslash (alguns browsers normalizam "/\evil.com" para "//evil.com").
 *
 * Qualquer entrada suspeita cai no `fallback`.
 *
 * @example
 * safeRedirectPath("/portal/cliente/projetos", "/portal/cliente")
 *   // -> "/portal/cliente/projetos"
 *
 * safeRedirectPath("//evil.com/x", "/portal/cliente")
 *   // -> "/portal/cliente" (bloqueado)
 *
 * safeRedirectPath("https://evil.com", "/portal/cliente")
 *   // -> "/portal/cliente" (bloqueado: nao comeca com /)
 *
 * safeRedirectPath(null, "/portal/cliente")
 *   // -> "/portal/cliente"
 */
export function safeRedirectPath(input: string | null | undefined, fallback: string): string {
  if (!input) return fallback;

  // URL absoluta ou esquema (https:, mailto:, javascript:, data:)
  if (!input.startsWith("/")) return fallback;

  // Protocol-relative (browsers tratam "//host/path" como URL absoluta)
  if (input.startsWith("//")) return fallback;

  // Backslash trick: "/\evil.com" e normalizado para "//evil.com" em alguns
  // browsers/parsers. Bloquear qualquer presenca de "\" e mais conservador.
  if (input.includes("\\")) return fallback;

  // Bloquear control chars (codepoints < U+0020) — defesa contra header/log
  // injection se o valor algum dia for ecoado em log estruturado. Codepoints
  // abaixo de espaco nao tem uso legitimo em path/query.
  for (let i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) < 32) return fallback;
  }

  return input;
}
