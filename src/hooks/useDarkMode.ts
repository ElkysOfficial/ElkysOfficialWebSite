import { useEffect, useState } from "react";

/**
 * Substitui next-themes/useTheme. O site nao expoe toggle manual: o tema
 * e definido inline em index.html via matchMedia ANTES do React montar
 * (evita FOUC). next-themes repetia a mesma leitura, registrava listener
 * proprio e ainda forcava ciclo "mounted-flag -> re-render" em todo
 * componente que chamava useTheme. Esse hook faz o minimo necessario:
 * le o estado atual da classe `dark` no <html> (ja aplicada pelo inline
 * script) e atualiza quando o sistema muda de preferencia.
 *
 * API compativel com `useTheme()` do next-themes nos campos que o projeto
 * realmente consome: `theme` ("system"), `resolvedTheme` ("dark"|"light").
 */
type Resolved = "dark" | "light";

function detect(): Resolved {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  const [resolvedTheme, setResolvedTheme] = useState<Resolved>(detect);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const next: Resolved = mq.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.style.colorScheme = next;
      setResolvedTheme(next);
    };
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return { theme: "system" as const, resolvedTheme };
}
