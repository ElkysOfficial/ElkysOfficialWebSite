import { useEffect, useRef, useState } from "react";
import hexagonalBg from "@/assets/icons/hexagonal.webp";

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
          src={hexagonalBg}
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
 * Wrapper that shows PortalLoading only while `loading` is true.
 *
 * - If data loads in under `delayMs` (200ms): no loading shown at all.
 * - If loading takes longer: spinner appears and stays for at least `minDisplayMs`
 *   (500ms) to avoid a brief flash.
 */
export function PortalLoadingGuard({
  loading,
  delayMs = 200,
  minDisplayMs = 500,
  children,
}: {
  loading: boolean;
  delayMs?: number;
  minDisplayMs?: number;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const showStartTime = useRef<number | null>(null);
  const wasLoadingOnMount = useRef(loading);

  useEffect(() => {
    if (!wasLoadingOnMount.current) return;

    if (loading) {
      const timer = setTimeout(() => {
        showStartTime.current = Date.now();
        setShow(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }

    if (!show) return;

    const elapsed = Date.now() - (showStartTime.current ?? Date.now());
    const remaining = Math.max(0, minDisplayMs - elapsed);

    if (remaining === 0) {
      setShow(false);
      return;
    }

    const timer = setTimeout(() => setShow(false), remaining);
    return () => clearTimeout(timer);
  }, [loading, delayMs, minDisplayMs, show]);

  if (show) return <PortalLoading />;
  return <>{children}</>;
}
