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
