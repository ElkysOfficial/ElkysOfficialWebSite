/**
 * Jornada do projeto por etapas — visualizacao das 6 fases do ciclo de vida.
 *
 * Renderiza steps visuais (Imersao → Acordo → Arquitetura → Engenharia →
 * Validacao → Evolucao) destacando a etapa atual com icone e cor.
 * Usado no detalhe do projeto para dar visao clara do progresso.
 */

import { CheckCircle, Code2, FileText, Hexagon, Search, Shield, Target } from "@/assets/icons";
import { cn } from "@/design-system";
import { PROJECT_STAGE_OPTIONS, getProjectStageIndex } from "@/lib/portal";

const STAGE_ICONS = [Search, FileText, Target, Code2, CheckCircle, Shield] as const;

export default function ProjectStageJourney({
  currentStage,
  className,
}: {
  currentStage?: string | null;
  className?: string;
}) {
  const currentIndex = getProjectStageIndex(currentStage);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-hero p-6 text-white shadow-card",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      <div className="relative">
        <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
          <Hexagon size={14} className="text-primary-light" />
          Jornada do projeto
        </div>

        <div className="mt-5 text-center">
          <p className="text-sm text-white/70">Etapa atual</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {currentIndex >= 0
              ? PROJECT_STAGE_OPTIONS[currentIndex].label
              : currentStage || "Sem etapa definida"}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {currentIndex >= 0
              ? PROJECT_STAGE_OPTIONS[currentIndex].summary
              : "Defina uma etapa para orientar cliente e time com o mesmo marco operacional."}
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PROJECT_STAGE_OPTIONS.map((stage, index) => {
            const Icon = STAGE_ICONS[index];
            const isCurrent = index === currentIndex;
            const isCompleted = currentIndex > index;

            return (
              <article
                key={stage.value}
                className={cn(
                  "rounded-2xl border p-4 backdrop-blur-sm transition-all",
                  isCurrent
                    ? "border-primary-light/60 bg-primary/20 shadow-[0_0_0_1px_hsl(var(--elk-primary-light)/0.18)]"
                    : isCompleted
                      ? "border-success/20 bg-success/10"
                      : "border-white/10 bg-white/5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl border",
                      isCurrent
                        ? "border-primary-light/40 bg-primary/25 text-white"
                        : isCompleted
                          ? "border-success/20 bg-success/10 text-success-foreground"
                          : "border-white/10 bg-black/10 text-white/75"
                    )}
                  >
                    <Icon size={18} />
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                      isCurrent
                        ? "bg-white text-foreground"
                        : isCompleted
                          ? "bg-success/15 text-success-foreground"
                          : "bg-white/10 text-white/70"
                    )}
                  >
                    {isCurrent ? "Atual" : isCompleted ? "Concluida" : "Proxima"}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">
                    {stage.order}a etapa
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-tight text-white">
                    {stage.label}
                  </p>
                  <p className="mt-2 text-sm text-white/65">{stage.duration}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
