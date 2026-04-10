import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "@/assets/icons";
import { Button, buttonVariants, cn } from "@/design-system";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import hexSrc from "../../public/imgs/icons/hexagonal.webp";

/*
 * Grid positions for each digit.
 * Each digit is drawn on a 5-row × 3-col grid of hexagons.
 * 1 = hex visible, 0 = empty.
 */
const DIGIT_GRIDS: Record<string, number[][]> = {
  "4": [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  "0": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
};

function HexDigit({ grid, baseDelay }: { grid: number[][]; baseDelay: number }) {
  const hexes: { row: number; col: number; delay: number }[] = [];
  grid.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell) hexes.push({ row: r, col: c, delay: baseDelay + (r * 3 + c) * 0.07 });
    })
  );

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {grid.flat().map((cell, i) => (
        <div
          key={i}
          className="flex items-center justify-center h-8 w-8 sm:h-11 sm:w-11 md:h-14 md:w-14"
        >
          {cell ? (
            <img
              src={hexSrc}
              alt=""
              className="h-full w-full animate-[hex404-pop_0.5s_ease-out_both]"
              style={{
                animationDelay: `${hexes.find((h) => h.row * 3 + h.col === i)?.delay ?? 0}s`,
              }}
              draggable={false}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main id="main-content" className="flex flex-grow items-center justify-center px-4 py-20">
        <div className="w-full max-w-2xl space-y-10 text-center">
          {/* 404 com hexágonos */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8">
            <HexDigit grid={DIGIT_GRIDS["4"]} baseDelay={0.1} />
            <HexDigit grid={DIGIT_GRIDS["0"]} baseDelay={0.4} />
            <HexDigit grid={DIGIT_GRIDS["4"]} baseDelay={0.7} />
          </div>

          {/* Mensagem */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Pagina nao encontrada
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              A pagina que voce esta procurando nao existe ou foi movida para outro endereco.
            </p>
          </div>

          {/* Ações */}
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
            <Link
              to="/"
              className={cn(
                buttonVariants({ size: "lg", variant: "gradient" }),
                "w-full sm:w-auto"
              )}
            >
              <Home className="mr-2 h-5 w-5" />
              Voltar para Home
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Pagina Anterior
            </Button>
          </div>

          {/* Links rápidos */}
          <div className="border-t border-border pt-6">
            <p className="mb-3 text-xs text-muted-foreground">Navegue pelo site:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                to="/#services"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Servicos
              </Link>
              <Link to="/cases" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Cases
              </Link>
              <Link to="/#contact" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Contato
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Keyframe inline para a animação de pop dos hexágonos */}
      <style>{`
        @keyframes hex404-pop {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-90deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.15) rotate(8deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
