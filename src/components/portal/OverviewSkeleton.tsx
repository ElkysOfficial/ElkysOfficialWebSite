import { Card, CardContent, cn } from "@/design-system";

/**
 * Bloco base animado com pulse sutil. Usado como placeholder enquanto
 * o Overview carrega as 8 queries do Supabase em paralelo, substituindo
 * o spinner genérico por um esqueleto que já revela a estrutura visual
 * da página e reduz a sensação de "tela em branco".
 */
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60 dark:bg-muted/40", className)}
      aria-hidden="true"
    />
  );
}

function MetricTileSkeleton() {
  return (
    <Card className="overflow-hidden border-border/70 bg-card/80">
      <CardContent className="flex items-center gap-3 p-4">
        <Shimmer className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-5 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <Card className="overflow-hidden border-border/70 bg-card/90">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Shimmer className="h-4 w-40" />
            <Shimmer className="h-3 w-56" />
          </div>
          <Shimmer className="h-8 w-24 rounded-full" />
        </div>
        <Shimmer className={cn("w-full", height)} />
      </CardContent>
    </Card>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden border-border/70 bg-card/90">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <Shimmer className="h-4 w-48" />
          <Shimmer className="h-3 w-64" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/60 p-3"
            >
              <Shimmer className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3 w-3/4" />
                <Shimmer className="h-3 w-1/2" />
              </div>
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Esqueleto completo da tela Overview, replicando sua estrutura
 * visual: card de resumo no topo, grid de métricas, dois gráficos
 * lado-a-lado e duas listas na base. Cada bloco tem dimensões
 * próximas às reais, evitando saltos de layout quando o conteúdo
 * real for renderizado após o loadDashboard concluir.
 */
export default function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      {/* Card de resumo */}
      <Card className="overflow-hidden rounded-2xl border-border/80 bg-gradient-subtle">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <Shimmer className="h-7 w-80" />
              <Shimmer className="h-4 w-60" />
            </div>
            <Shimmer className="h-10 w-44 rounded-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:max-w-[520px]">
            <Shimmer className="h-16 rounded-xl" />
            <Shimmer className="h-16 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricTileSkeleton key={i} />
        ))}
      </div>

      {/* Gráficos principais */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartSkeleton height="h-72" />
        <ChartSkeleton height="h-72" />
      </div>

      {/* Listas de operação */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ListSkeleton rows={4} />
        <ListSkeleton rows={4} />
      </div>
    </div>
  );
}
