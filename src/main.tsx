import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.scss";

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
    reason instanceof Error ? reason.message : typeof reason === "string" ? reason : String(reason);
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
