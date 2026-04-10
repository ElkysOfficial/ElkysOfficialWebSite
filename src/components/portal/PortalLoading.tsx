import { useEffect, useRef, useState } from "react";

const PHRASES = [
  "Preparando seus dados...",
  "Organizando informacoes...",
  "Carregando painel...",
  "Quase pronto...",
];

/**
 * Branded loading with minimum 5-second display time.
 * Shows rotating hexagonal icon with pulsing rings and status text.
 *
 * Usage:
 *   if (loading) return <PortalLoading />;
 *
 * The component tracks its own mount time and stays visible for at least
 * MIN_DISPLAY_MS even if the parent tries to unmount it earlier. To use
 * the min-time guarantee, wrap content:
 *
 *   <PortalLoadingGuard loading={loading}>
 *     <YourContent />
 *   </PortalLoadingGuard>
 */
export default function PortalLoading() {
  const [phrase, setPhrase] = useState(PHRASES[0]);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % PHRASES.length;
      setPhrase(PHRASES[idx]);
    }, 1_600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-32 animate-[fade-in_0.4s_ease-out]">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-20 w-20 animate-portal-ring rounded-full border-2 border-primary/20" />
        <span
          className="absolute h-14 w-14 animate-portal-ring rounded-full border border-primary/10"
          style={{ animationDelay: "0.6s" }}
        />
        <img
          src="/imgs/icons/hexagonal.webp"
          alt=""
          className="h-10 w-10 animate-portal-spin drop-shadow-[0_2px_8px_rgba(71,38,128,0.3)]"
          draggable={false}
        />
      </div>
      <p
        key={phrase}
        className="animate-[fade-in_0.3s_ease-out] text-sm font-medium tracking-wide text-muted-foreground"
      >
        {phrase}
      </p>
    </div>
  );
}

/**
 * Wrapper that shows PortalLoading for at least `minMs` while `loading` is true.
 * Once data is ready AND min time has passed, renders children.
 */
export function PortalLoadingGuard({
  loading,
  minMs = 5_000,
  children,
}: {
  loading: boolean;
  minMs?: number;
  children: React.ReactNode;
}) {
  const mountTime = useRef(Date.now());
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), minMs);
    return () => clearTimeout(timer);
  }, [minMs]);

  useEffect(() => {
    if (!loading && !minElapsed) {
      const remaining = Math.max(0, minMs - (Date.now() - mountTime.current));
      if (remaining === 0) {
        setMinElapsed(true);
        return;
      }
      const timer = setTimeout(() => setMinElapsed(true), remaining);
      return () => clearTimeout(timer);
    }
  }, [loading, minElapsed, minMs]);

  if (loading || !minElapsed) return <PortalLoading />;
  return <>{children}</>;
}
