import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft } from "@/assets/icons";
import { buttonVariants, cn } from "@/design-system";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Import via src/assets pra Vite aplicar fingerprint hash (cache-bust automatico).
import hexSrc from "@/assets/icons/hexagonal.webp";

/* ── Pixel grids (7 rows × 5 cols) ── */
const DIGIT: Record<string, number[][]> = {
  "4": [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
  ],
  "0": [
    [0, 1, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [0, 1, 1, 1, 0],
  ],
};

/* ── Hexágonos flutuantes decorativos ── */
const FLOATING_HEXES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 10 + Math.random() * 22,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 4,
  duration: 6 + Math.random() * 6,
  opacity: 0.04 + Math.random() * 0.06,
}));

function HexDigit({ grid, baseDelay }: { grid: number[][]; baseDelay: number }) {
  let idx = 0;
  const cols = grid[0].length;

  return (
    <div
      className="inline-grid gap-[2px] sm:gap-1"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {grid.flat().map((cell, i) => {
        const delay = cell ? baseDelay + idx++ * 0.035 : 0;
        return (
          <div
            key={i}
            className="flex items-center justify-center h-[18px] w-[18px] sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-10 lg:w-10"
          >
            {cell ? (
              <img
                src={hexSrc}
                alt=""
                className="h-full w-full animate-[hex-pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both] drop-shadow-[0_3px_8px_rgba(71,38,128,0.4)]"
                style={{ animationDelay: `${delay}s` }}
                draggable={false}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

const NotFound = () => {
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.error("404 Error:", location.pathname);
    setReady(true);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="relative flex flex-grow items-center justify-center overflow-hidden px-4 py-20 sm:py-28">
        {/* ── Background decorativo ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
          <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-accent/[0.04] blur-[120px]" />
          <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-secondary/[0.03] blur-[80px]" />

          {/* Hexágonos flutuantes */}
          {FLOATING_HEXES.map((hex) => (
            <img
              key={hex.id}
              src={hexSrc}
              alt=""
              className="absolute animate-[hex-float_ease-in-out_infinite]"
              style={{
                width: hex.size,
                height: hex.size,
                left: `${hex.left}%`,
                top: `${hex.top}%`,
                opacity: hex.opacity,
                animationDuration: `${hex.duration}s`,
                animationDelay: `${hex.delay}s`,
              }}
              draggable={false}
            />
          ))}
        </div>

        {ready && (
          <div className="relative z-10 w-full max-w-4xl text-center">
            {/* ── Hexágonos formando 404 ── */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-8 lg:gap-10">
              <HexDigit grid={DIGIT["4"]} baseDelay={0.15} />
              <HexDigit grid={DIGIT["0"]} baseDelay={0.6} />
              <HexDigit grid={DIGIT["4"]} baseDelay={1.05} />
            </div>

            {/* ── Linha decorativa ── */}
            <div className="mx-auto mt-8 flex items-center gap-3 sm:mt-10">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <img src={hexSrc} alt="" className="h-3 w-3 opacity-30" draggable={false} />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>

            {/* ── Mensagem ── */}
            <div className="mt-8 space-y-4 animate-[fade-up_0.7s_ease-out_1.5s_both] sm:mt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Pagina nao encontrada
              </h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                O endereco{" "}
                <code className="rounded-md border border-border/60 bg-muted/80 px-2 py-0.5 text-xs font-medium text-foreground">
                  {location.pathname}
                </code>{" "}
                nao existe ou foi movido para outro local.
              </p>
            </div>

            {/* ── Ações ── */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 animate-[fade-up_0.7s_ease-out_1.7s_both] sm:mt-10 sm:flex-row sm:gap-4">
              <Link
                to="/"
                className={cn(
                  buttonVariants({ size: "lg", variant: "gradient" }),
                  "w-full gap-2 shadow-primary sm:w-auto"
                )}
              >
                <Home className="h-4 w-4" />
                Voltar para Home
              </Link>
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.back();
                }}
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "w-full gap-2 sm:w-auto"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Pagina Anterior
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <style>{`
        @keyframes hex-pop {
          0% { opacity: 0; transform: scale(0) rotate(-180deg); }
          60% { opacity: 1; transform: scale(1.12) rotate(10deg); }
          80% { transform: scale(0.95) rotate(-3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hex-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(15deg); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
