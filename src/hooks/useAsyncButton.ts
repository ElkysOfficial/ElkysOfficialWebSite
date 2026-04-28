import { useCallback, useEffect, useRef, useState } from "react";

type State = "idle" | "loading" | "success";

interface Options {
  /** Duracao do estado de sucesso antes de voltar a idle (ms). Default: 1600. */
  successDurationMs?: number;
}

/**
 * Orquestra o ciclo idle -> loading -> success de um botao assincrono.
 *
 * Uso tipico:
 *
 *   const { run, loading, success } = useAsyncButton();
 *   const onSubmit = () => run(async () => {
 *     await api.save(data);
 *   });
 *
 *   <Button
 *     loading={loading}
 *     loadingText="Salvando..."
 *     success={success}
 *     successLabel="Salvo!"
 *     onClick={onSubmit}
 *   >
 *     Salvar
 *   </Button>
 *
 * Se a promise rejeitar, o estado volta direto pra idle (sem mostrar
 * success) e o erro e re-lancado pra que o caller possa exibir toast.
 */
export function useAsyncButton(options: Options = {}) {
  const { successDurationMs = 1600 } = options;
  const [state, setState] = useState<State>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setState("loading");
      try {
        const result = await fn();
        if (!mountedRef.current) return result;
        setState("success");
        timerRef.current = setTimeout(() => {
          if (mountedRef.current) setState("idle");
          timerRef.current = null;
        }, successDurationMs);
        return result;
      } catch (err) {
        if (mountedRef.current) setState("idle");
        throw err;
      }
    },
    [successDurationMs]
  );

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState("idle");
  }, []);

  return {
    run,
    reset,
    state,
    loading: state === "loading",
    success: state === "success",
    idle: state === "idle",
  };
}
