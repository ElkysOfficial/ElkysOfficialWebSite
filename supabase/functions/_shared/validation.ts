/**
 * Shared input validation helpers for Edge Functions.
 */

/** Simplified RFC 5322 email validation. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/**
 * Password strength check: min 8 chars, at least one uppercase,
 * one lowercase, and one digit.
 */
export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}

/** Escape characters that are meaningful inside HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape HTML and convert line breaks to <br/> for rendering in email bodies. */
export function escapeAndFormat(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br/>");
}

/**
 * Format notification body with rich-text support:
 * - Escapes HTML for security
 * - Converts **bold** to <strong>
 * - Replaces {Portal}, {Financeiro}, {Projetos}, {Suporte}, {Documentos} with styled links
 * - Converts line breaks to <br/>
 */
export function formatNotificationBody(text: string, portalUrl: string): string {
  const linkStyle =
    "color:#472680;font-weight:700;text-decoration:underline;text-underline-offset:2px;";

  const VARIABLES: Record<string, { href: string; label: string }> = {
    "{Portal}": { href: portalUrl, label: "Portal" },
    "{Financeiro}": { href: `${portalUrl}/financeiro`, label: "Financeiro" },
    "{Projetos}": { href: `${portalUrl}/projetos`, label: "Projetos" },
    "{Suporte}": { href: `${portalUrl}/suporte`, label: "Suporte" },
    "{Documentos}": { href: `${portalUrl}/documentos`, label: "Documentos" },
  };

  // 1. Escape HTML
  let result = escapeHtml(text);

  // 2. Convert **bold** to <strong>
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 3. Replace variables with styled links
  for (const [token, { href, label }] of Object.entries(VARIABLES)) {
    const escaped = escapeHtml(token);
    result = result.replace(
      new RegExp(escaped.replace(/[{}]/g, "\\$&"), "g"),
      `<a href="${href}" target="_blank" style="${linkStyle}">${label}</a>`
    );
  }

  // 4. Convert line breaks
  result = result.replace(/\n/g, "<br/>");

  return result;
}
