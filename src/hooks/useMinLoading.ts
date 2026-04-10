import { useEffect, useRef, useState } from "react";

/**
 * Ensures a loading state stays true for at least `minMs` milliseconds,
 * even if the actual data loads faster. Prevents loading flash.
 *
 * If data is already available on mount (e.g. from cache), skips loading entirely.
 */
export default function useMinLoading(dataLoading: boolean, minMs = 5_000): boolean {
  // If data is already loaded on first render (cache hit), never show loading
  const wasLoadingOnMount = useRef(dataLoading);
  const [show, setShow] = useState(dataLoading);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    // Cache hit: data was ready on mount — skip loading entirely
    if (!wasLoadingOnMount.current) {
      setShow(false);
      return;
    }

    if (dataLoading) return;

    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, minMs - elapsed);

    if (remaining === 0) {
      setShow(false);
      return;
    }

    const timer = setTimeout(() => setShow(false), remaining);
    return () => clearTimeout(timer);
  }, [dataLoading, minMs]);

  return show;
}
