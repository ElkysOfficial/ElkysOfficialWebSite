import { useEffect, useRef, useState } from "react";

interface UseFormDraftAutoSaveOptions<T> {
  /** Chave única no localStorage, p.ex. "elkys:notifications:draft" */
  storageKey: string;
  /** Valores atuais do formulário (idealmente de watch() do react-hook-form) */
  values: T;
  /** Callback opcional ao restaurar um rascunho encontrado no storage */
  onRestore?: (restored: T) => void;
  /** Debounce em ms para gravar no storage (default 800ms) */
  debounceMs?: number;
  /** Quando true, pula a restauração inicial (ex: submissão concluída) */
  disabled?: boolean;
}

interface UseFormDraftAutoSaveResult {
  /** Timestamp da última gravação bem-sucedida (null se nunca gravou) */
  savedAt: Date | null;
  /** Remove o rascunho do storage — chamar após submit com sucesso */
  clearDraft: () => void;
  /** True enquanto há mudanças aguardando o debounce */
  isPending: boolean;
}

/**
 * Auto-save reutilizável de rascunho de formulário em localStorage.
 *
 * Restaura o rascunho na primeira montagem se a chave existir, e
 * começa a gravar automaticamente sempre que os valores mudam — com
 * debounce para evitar escrever a cada tecla. Útil em composers longos
 * (notificações, propostas, projetos) onde perder o conteúdo por um
 * refresh acidental é frustrante.
 *
 * O hook é agnóstico ao formato do formulário: entrega/recebe o tipo
 * completo T. Combina bem com watch() do react-hook-form.
 */
export function useFormDraftAutoSave<T>({
  storageKey,
  values,
  onRestore,
  debounceMs = 800,
  disabled = false,
}: UseFormDraftAutoSaveOptions<T>): UseFormDraftAutoSaveResult {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isPending, setIsPending] = useState(false);
  const hasRestoredRef = useRef(false);

  // Restaurar rascunho na primeira montagem
  useEffect(() => {
    if (hasRestoredRef.current || disabled || typeof window === "undefined") return;
    hasRestoredRef.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { values: T; savedAt: string };
      if (parsed?.values && onRestore) {
        onRestore(parsed.values);
        setSavedAt(new Date(parsed.savedAt));
      }
    } catch {
      // storage corrompido ou indisponível — silencioso
    }
  }, [storageKey, onRestore, disabled]);

  // Gravar com debounce sempre que values mudar
  useEffect(() => {
    if (disabled || !hasRestoredRef.current || typeof window === "undefined") return;
    setIsPending(true);
    const timeout = window.setTimeout(() => {
      try {
        const payload = { values, savedAt: new Date().toISOString() };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
        setSavedAt(new Date());
      } catch {
        // quota excedida ou storage bloqueado — silencioso
      } finally {
        setIsPending(false);
      }
    }, debounceMs);
    return () => {
      window.clearTimeout(timeout);
      setIsPending(false);
    };
  }, [values, storageKey, debounceMs, disabled]);

  const clearDraft = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
      setSavedAt(null);
    } catch {
      // silencioso
    }
  };

  return { savedAt, clearDraft, isPending };
}
