/** Hook que ajusta tamanho de pagina (itens por pagina) baseado na largura da tela. */
import { useEffect, useState } from "react";

/**
 * Returns a page size based on the current viewport width.
 * Avoids scroll by showing fewer items on smaller screens.
 *
 * Breakpoints (matching Tailwind):
 *   < 768px  (sm)  → small
 *   < 1280px (lg)  → medium
 *   ≥ 1280px (xl)  → large
 */
export default function useResponsivePageSize(small = 3, medium = 5, large = 8): number {
  const [size, setSize] = useState(() => {
    if (typeof window === "undefined") return medium;
    const w = window.innerWidth;
    return w < 768 ? small : w < 1280 ? medium : large;
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setSize(w < 768 ? small : w < 1280 ? medium : large);
    };

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [small, medium, large]);

  return size;
}
