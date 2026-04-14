import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Mantém um pedaço de estado sincronizado com a query string da URL.
 * Valores iguais ao default são removidos da URL para mantê-la limpa.
 * Atualizações usam replace para não poluir o histórico do navegador.
 */
export function useUrlState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(key);
  const value = (raw ?? defaultValue) as T;

  const setValue = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next == null || next === "" || next === defaultValue) {
            params.delete(key);
          } else {
            params.set(key, next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [key, defaultValue, setSearchParams],
  );

  return [value, setValue];
}

/**
 * Variante nullable: o valor pode ser null (sem filtro).
 * Útil para filtros opcionais como tagFilter.
 */
export function useUrlStateNullable<T extends string>(
  key: string,
): [T | null, (next: T | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(key);
  const value = (raw as T | null) ?? null;

  const setValue = useCallback(
    (next: T | null) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next == null || next === "") {
            params.delete(key);
          } else {
            params.set(key, next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [key, setSearchParams],
  );

  return [value, setValue];
}
