/** Hook para auto-save de rascunhos de formulario em localStorage. */
import { useCallback, useEffect, useRef, useState } from "react";

interface UseFormDraftAutoSaveOptions<T> {
  /** Chave única no localStorage, p.ex. "elkys:notifications:draft" */
  storageKey: string;
  /** Valores atuais do formulário (idealmente de watch() do react-hook-form) */
  values: T;
  /** Callback ao restaurar um rascunho (automatico ou via restore()) */
  onRestore?: (restored: T) => void;
  /** Debounce em ms para gravar no storage (default 800ms) */
  debounceMs?: number;
  /** Quando true, pula a restauração e a gravação (ex: submissão concluída) */
  disabled?: boolean;
  /**
   * Se `true` (default), restaura silenciosamente ao montar — chama onRestore
   * automaticamente com o conteudo do storage. Mantido default pra backcompat.
   *
   * Se `false`, nao restaura sozinho. Expoe `hasDraft` e `restore()` pra UI
   * decidir mostrar um banner "Temos um rascunho, restaurar?".
   */
  autoRestore?: boolean;
}

interface UseFormDraftAutoSaveResult {
  /** Timestamp da última gravação bem-sucedida (null se nunca gravou) */
  savedAt: Date | null;
  /** Remove o rascunho do storage — chamar após submit com sucesso */
  clearDraft: () => void;
  /** True enquanto há mudanças aguardando o debounce */
  isPending: boolean;
  /** True se ao montar havia um rascunho no storage e autoRestore=false */
  hasDraft: boolean;
  /** Quando o rascunho foi salvo (do storage). Util pra UI mostrar "ha X min" */
  draftSavedAt: Date | null;
  /** Aplica o rascunho via onRestore e limpa o flag hasDraft */
  restore: () => void;
  /** Descarta o rascunho sem aplicar */
  discard: () => void;
}

/**
 * Auto-save reutilizável de rascunho de formulário em localStorage.
 *
 * Dois modos, escolhidos via `autoRestore`:
 *
 * - `autoRestore: true` (default): restaura silenciosamente no mount chamando
 *   onRestore. Backcompat — usado por ProjectCreate e Notifications.
 *
 * - `autoRestore: false`: detecta rascunho salvo, expoe `hasDraft` + `restore()`
 *   + `discard()` pra UI mostrar um banner "Temos um rascunho, restaurar?".
 *   Mais seguro pra formulários onde um restore sem aviso pode confundir.
 *
 * Em ambos os modos, sempre grava com debounce as mudanças em `values`.
 */
export function useFormDraftAutoSave<T>({
  storageKey,
  values,
  onRestore,
  debounceMs = 800,
  disabled = false,
  autoRestore = true,
}: UseFormDraftAutoSaveOptions<T>): UseFormDraftAutoSaveResult {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const pendingRestoreRef = useRef<T | null>(null);
  const hasCheckedRef = useRef(false);

  // Na montagem, verifica se ha rascunho
  useEffect(() => {
    if (hasCheckedRef.current || disabled || typeof window === "undefined") return;
    hasCheckedRef.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { values: T; savedAt: string };
      if (!parsed?.values) return;

      const savedDate = new Date(parsed.savedAt);
      if (autoRestore) {
        if (onRestore) onRestore(parsed.values);
        setSavedAt(savedDate);
      } else {
        pendingRestoreRef.current = parsed.values;
        setDraftSavedAt(savedDate);
        setHasDraft(true);
      }
    } catch {
      // storage corrompido ou indisponivel — silencioso
    }
  }, [storageKey, onRestore, disabled, autoRestore]);

  // Gravar com debounce sempre que values mudar (apos check inicial)
  useEffect(() => {
    if (disabled || !hasCheckedRef.current || typeof window === "undefined") return;
    // Em modo banner, so comeca a gravar depois que user decidiu (restore/discard).
    if (hasDraft) return;

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
  }, [values, storageKey, debounceMs, disabled, hasDraft]);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
      setSavedAt(null);
      setHasDraft(false);
      setDraftSavedAt(null);
      pendingRestoreRef.current = null;
    } catch {
      // silencioso
    }
  }, [storageKey]);

  const restore = useCallback(() => {
    const pending = pendingRestoreRef.current;
    if (pending && onRestore) {
      onRestore(pending);
      setSavedAt(draftSavedAt);
    }
    setHasDraft(false);
    pendingRestoreRef.current = null;
  }, [onRestore, draftSavedAt]);

  const discard = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  return { savedAt, clearDraft, isPending, hasDraft, draftSavedAt, restore, discard };
}
