import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.scss";

/**
 * Guard idempotente: o entry.js existe em DUAS formas no deploy, porque
 * (1) inline no HTML (pra eliminar round-trip HTML -> entry.js do PSI)
 * e (2) arquivo em /assets/index-*.js (importado por chunks lazy que
 * pegam shared deps extraidas pelo Rollup). Sem esse guard, quando um
 * lazy chunk executa o file module, o top-level createRoot().render()
 * roda uma 2a vez, criando 2 roots no mesmo elemento — DOM corrompido.
 * O flag window.__ELKYS_BOOTED__ garante execucao unica independente
 * de quantas vezes o modulo e avaliado.
 */
declare global {
  interface Window {
    __ELKYS_BOOTED__?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__ELKYS_BOOTED__) {
  window.__ELKYS_BOOTED__ = true;
  boot();
}

function boot() {
  /**
   * Captura falhas de carregamento de chunks dinâmicos (lazy routes) que
   * acontecem fora do React tree — tipicamente durante navegação via
   * <Link> quando o hash do chunk na memória não existe mais no servidor
   * (deploy recente). Em vez de deixar o usuário numa tela em branco com
   * erro no console, forçamos um reload pra baixar o index.html atualizado.
   *
   * Protegido contra loop: só recarrega se não recarregou nos últimos 10s.
   */
  const CHUNK_RELOAD_KEY = "elkys:chunk-reload-attempt";

  function looksLikeChunkError(reason: unknown): boolean {
    if (!reason) return false;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : String(reason);
    const name = reason instanceof Error ? reason.name : "";
    return (
      /Failed to fetch dynamically imported module/i.test(message) ||
      /Loading chunk \d+ failed/i.test(message) ||
      /Importing a module script failed/i.test(message) ||
      name === "ChunkLoadError"
    );
  }

  function handleChunkReload() {
    if (typeof window === "undefined") return;
    try {
      const lastAttempt = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? "0");
      const now = Date.now();
      if (now - lastAttempt < 10_000) return;
      window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
      const url = new URL(window.location.href);
      url.searchParams.set("_reload", String(now));
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      if (looksLikeChunkError(event.reason)) {
        event.preventDefault();
        handleChunkReload();
      }
    });
    window.addEventListener("error", (event) => {
      if (looksLikeChunkError(event.error ?? event.message)) {
        event.preventDefault();
        handleChunkReload();
      }
    });
  }

  // ThemeProvider (next-themes) removido: o tema ja e aplicado inline em
  // index.html via matchMedia antes do React montar e o hook useDarkMode
  // (src/hooks/useDarkMode.ts) cobre o restante da API consumida.
  createRoot(document.getElementById("root")!).render(<App />);

  // Remove o #lcp-shim (Hero estatico injetado em index.html pra servir como
  // alvo do LCP). Dois rAFs garantem: (1) React commit, (2) browser paint do
  // Hero real — so entao o shim some. Index e sync em App.tsx, entao o Hero
  // existe no DOM ja na primeira commit. Se trocar Index pra lazy, o shim
  // ficaria visivel ate o chunk de Index baixar (ou seja, sai como fallback
  // seguro, nao brigao branco). A spec de LCP mantem o paint reportado mesmo
  // quando o elemento e removido do DOM depois.
  if (typeof window !== "undefined" && typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const shim = document.getElementById("lcp-shim");
        if (shim) shim.remove();
      });
    });
  }
} // end of boot()
