/**
 * Banner sticky que sinaliza ambientes nao-producao (development, staging,
 * preview). Em producao retorna null — zero overhead.
 *
 * Detecta ambiente via import.meta.env.MODE (Vite) + VITE_ENV (override
 * explicito para builds de staging com mode=production).
 */
export default function EnvironmentBanner() {
  const mode = import.meta.env.MODE;
  const override = import.meta.env.VITE_ENV as string | undefined;
  const env = (override ?? mode)?.toLowerCase();

  // Producao: nao renderiza
  if (!env || env === "production" || env === "prod") return null;

  const label =
    env === "development" || env === "dev"
      ? "Dev local"
      : env === "staging" || env === "stg"
        ? "Staging"
        : env === "preview"
          ? "Preview"
          : env.toUpperCase();

  return (
    <div
      role="status"
      aria-label={`Ambiente: ${label}`}
      className="sticky top-0 z-[60] flex h-6 items-center justify-center bg-warning px-3 text-[11px] font-semibold uppercase tracking-wider text-warning-foreground shadow-sm"
    >
      <span
        aria-hidden="true"
        className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current"
      />
      {label} — nao e ambiente de producao
    </div>
  );
}
