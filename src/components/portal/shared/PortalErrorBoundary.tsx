import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

/**
 * Detecta se o erro é uma falha de carregamento de chunk dinâmico.
 * Isso acontece quando:
 * 1. O usuário tem uma aba antiga aberta e um novo deploy rolou, renomeando
 *    os hashes dos chunks — o index.html antigo em cache tenta buscar chunks
 *    que não existem mais no servidor.
 * 2. Um deploy parcial subiu o index.html novo mas não todos os chunks.
 *
 * Em qualquer um dos casos, a única solução é recarregar a página pra
 * buscar o index.html mais recente.
 */
function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
  const name = error instanceof Error ? error.name : "";

  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message) ||
    /Failed to import/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    name === "ChunkLoadError"
  );
}

const RELOAD_ATTEMPT_KEY = "elkys:chunk-reload-attempt";

export default class PortalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PortalErrorBoundary]", error, info.componentStack);

    if (isChunkLoadError(error) && typeof window !== "undefined") {
      // Evitar loop infinito: se já tentamos recarregar recentemente e
      // a página ainda falha com chunk error, paramos e mostramos UI
      // para que o usuário tome a ação manualmente.
      try {
        const lastAttempt = Number(window.sessionStorage.getItem(RELOAD_ATTEMPT_KEY) ?? "0");
        const now = Date.now();
        if (now - lastAttempt > 10_000) {
          window.sessionStorage.setItem(RELOAD_ATTEMPT_KEY, String(now));
          // Forçar bypass de cache ao recarregar — com query cache-buster
          const url = new URL(window.location.href);
          url.searchParams.set("_reload", String(now));
          window.location.replace(url.toString());
        }
      } catch {
        // sessionStorage indisponível, só recarregar direto
        window.location.reload();
      }
    }
  }

  private handleRetry = () => {
    if (this.state.isChunkError && typeof window !== "undefined") {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, isChunkError: false });
  };

  render() {
    if (this.state.hasError) {
      const { isChunkError } = this.state;
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {isChunkError ? "Nova versão disponível" : "Algo deu errado"}
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {isChunkError
                ? "Uma atualização do portal foi publicada. Recarregue a página para carregar a versão mais recente — seus dados continuam salvos."
                : "Ocorreu um erro inesperado ao carregar esta página."}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isChunkError ? "Recarregar página" : "Tentar novamente"}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
