import { PROJECT_STAGE_OPTIONS, getProjectStageIndex } from "@/lib/portal";
import { cn } from "@/design-system";

interface ProjectStageProgressDotsProps {
  currentStage?: string | null;
  /**
   * Quando true, exibe o nome da etapa atual ao lado direito dos dots.
   * Default é true; passe false se o container já mostra o nome separadamente.
   */
  showLabel?: boolean;
  className?: string;
}

/**
 * Versão compacta do ProjectStageJourney para uso em listagens e cards.
 * Renderiza 6 pontos representando as etapas do funil ELKYS (Imersão,
 * Acordo Formal, Arquitetura, Engenharia, Validação, Evolução):
 *
 * - Etapas anteriores à atual: ponto preenchido com primary (concluídas)
 * - Etapa atual: ponto destacado com anel (current)
 * - Etapas futuras: ponto vazio em tom muted (pendente)
 *
 * Se a etapa não for reconhecida (valor legado fora do enum), todos os
 * pontos ficam em tom muted e o label mostra o texto bruto, preservando
 * backwards-compatibility com projetos antigos cadastrados antes do
 * enum ser padronizado.
 */
export default function ProjectStageProgressDots({
  currentStage,
  showLabel = true,
  className,
}: ProjectStageProgressDotsProps) {
  const normalized = currentStage?.trim() ?? "";
  const currentIndex = normalized ? getProjectStageIndex(normalized) : -1;
  const totalStages = PROJECT_STAGE_OPTIONS.length;
  const isKnownStage = currentIndex >= 0;
  const completedCount = isKnownStage ? currentIndex : 0;

  const displayLabel = isKnownStage
    ? PROJECT_STAGE_OPTIONS[currentIndex].label
    : normalized || "Sem etapa definida";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className="flex items-center gap-1"
        role="progressbar"
        aria-label={`Etapa atual: ${displayLabel}`}
        aria-valuenow={isKnownStage ? currentIndex + 1 : 0}
        aria-valuemin={1}
        aria-valuemax={totalStages}
      >
        {PROJECT_STAGE_OPTIONS.map((stage, index) => {
          const isCompleted = index < completedCount;
          const isCurrent = isKnownStage && index === currentIndex;
          return (
            <span
              key={stage.value}
              title={`${index + 1}. ${stage.label}`}
              className={cn(
                "h-1.5 w-4 rounded-full transition-colors",
                isCompleted && "bg-primary",
                isCurrent && "bg-primary ring-2 ring-primary/30",
                !isCompleted && !isCurrent && "bg-muted"
              )}
            />
          );
        })}
      </div>
      {showLabel ? (
        <span className="truncate text-xs font-medium text-foreground" title={displayLabel}>
          {displayLabel}
        </span>
      ) : null}
    </div>
  );
}
