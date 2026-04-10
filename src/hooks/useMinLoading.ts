import { useEffect, useRef, useState } from "react";

/**
 * Ensures a loading state stays true for at least `minMs` milliseconds,
 * even if the actual data loads faster. Prevents loading flash.
 */
export default function useMinLoading(dataLoading: boolean, minMs = 5_000): boolean {
  const [show, setShow] = useState(true);
  const mountTime = useRef(Date.now());

  useEffect(() => {
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
