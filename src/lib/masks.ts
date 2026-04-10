/**
 * Masks & formatters for Brazilian documents and currency
 */

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\s/g, "\u00A0");
}

export function maskDate(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
}

export function formatDateInput(value?: string | null): string {
  if (!value) return "";

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function parseFormDate(value?: string | null): string | null {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  const isoDate = `${year}-${month}-${day}`;
  const parsed = new Date(`${isoDate}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getFullYear() !== Number(year)) return null;
  if (parsed.getMonth() + 1 !== Number(month)) return null;
  if (parsed.getDate() !== Number(day)) return null;

  return isoDate;
}

export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function unmaskDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Validates CPF using the Receita Federal check-digit algorithm. Expects 11 digits (unmasked). */
export function isValidCPF(digits: string): boolean {
  if (digits.length !== 11) return false;
  // Reject known-invalid sequences (all same digit)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const nums = digits.split("").map(Number);

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += nums[i] * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== nums[9]) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) sum += nums[i] * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === nums[10];
}

/** Validates CNPJ using the Receita Federal check-digit algorithm. Expects 14 digits (unmasked). */
export function isValidCNPJ(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const nums = digits.split("").map(Number);
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // First check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += nums[i] * weights1[i];
  let remainder = sum % 11;
  const check1 = remainder < 2 ? 0 : 11 - remainder;
  if (check1 !== nums[12]) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 13; i++) sum += nums[i] * weights2[i];
  remainder = sum % 11;
  const check2 = remainder < 2 ? 0 : 11 - remainder;
  return check2 === nums[13];
}

export function sanitizeInteger(value: string, maxLength = 3) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function unmaskCurrency(value: string): number {
  const digits = value.replace(/\D/g, "");
  return parseInt(digits || "0", 10) / 100;
}

export function formatBRL(value: number): string {
  return value
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\s/g, "\u00A0");
}

/**
 * Converts a database numeric value (string or number) to integer centavos.
 * Use inside reduce/accumulation to avoid floating-point errors.
 * Divide the final sum by 100 to get back to reais.
 *
 * Example: toCents("1234.56") → 123456
 */
export function toCents(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  return Math.round(Number(value) * 100);
}
