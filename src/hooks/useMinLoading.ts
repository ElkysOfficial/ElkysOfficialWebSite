/** Hook que garante duracao minima de loading para evitar flash de conteudo. */
import { useEffect, useRef, useState } from "react";

/**
 * Smart loading hook that avoids both unnecessary loading screens AND brief flashes.
 *
 * - If data loads in under `delayMs` (default 200ms): loading is never shown.
 * - If data takes longer: loading is shown and held for at least `minDisplayMs`
 *   (default 500ms) so it doesn't flash on screen.
 * - If data was already available on mount (cache hit): loading is skipped entirely.
 */
export default function useMinLoading(
  dataLoading: boolean,
  { delayMs = 200, minDisplayMs = 500 } = {}
): boolean {
  const wasLoadingOnMount = useRef(dataLoading);
  const [show, setShow] = useState(false);
  const showStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Cache hit: data was ready on mount — skip loading entirely
    if (!wasLoadingOnMount.current) return;

    if (dataLoading) {
      // Data is still loading — start delay timer before showing spinner
      const timer = setTimeout(() => {
        showStartTime.current = Date.now();
        setShow(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }

    // Data finished loading
    if (!show) {
      // Spinner was never shown (loaded within delayMs) — nothing to do
      return;
    }

    // Spinner is visible — ensure it stays for minDisplayMs to avoid flash
    const elapsed = Date.now() - (showStartTime.current ?? Date.now());
    const remaining = Math.max(0, minDisplayMs - elapsed);

    if (remaining === 0) {
      setShow(false);
      return;
    }

    const timer = setTimeout(() => setShow(false), remaining);
    return () => clearTimeout(timer);
  }, [dataLoading, delayMs, minDisplayMs, show]);

  return show;
}
