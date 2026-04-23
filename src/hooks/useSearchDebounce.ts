import { useEffect, useState } from "react";

/**
 * Retorna uma versao debounced do valor — aguarda `delayMs` sem novas mudancas
 * antes de atualizar. Padrao 400ms (adequado para filtros de listagem).
 *
 * Use em inputs de busca para evitar disparar fetch/API a cada tecla digitada.
 *
 * @example
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useSearchDebounce(query);
 * useEffect(() => { void fetch(debouncedQuery); }, [debouncedQuery]);
 */
export function useSearchDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
