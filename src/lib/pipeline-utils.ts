/**
 * Utilitarios do Pipeline — priorizacao de items e limite responsivo.
 *
 * Extraidos do Pipeline.tsx para reutilizacao e testabilidade.
 * A priorizacao garante que itens mais urgentes aparecem primeiro
 * quando a coluna esta recolhida (exibicao progressiva).
 *
 * @module pipeline-utils
 */

type PipelineItemBase = {
  kind: "project" | "proposal";
  id: string;
  isOverdue?: boolean;
  dateLabel: string | null;
};

/**
 * Ordena items do pipeline por prioridade operacional:
 * 1. Overdue primeiro (urgencia maxima)
 * 2. Prazo mais proximo (data menor = mais urgente)
 * 3. Mais antigo (desempate por posicao no array original)
 *
 * Items sem data vao para o final (sem prazo = menor urgencia).
 */
export function sortPipelineItems<T extends PipelineItemBase>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // 1. Overdue primeiro
    const aOverdue = "isOverdue" in a && a.isOverdue ? 1 : 0;
    const bOverdue = "isOverdue" in b && b.isOverdue ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    // 2. Data mais proxima primeiro (null = sem prazo = vai pro final)
    const aDate = a.dateLabel;
    const bDate = b.dateLabel;
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;

    // 3. Manter ordem original (estavel)
    return 0;
  });
}

/**
 * Calcula quantos cards mostrar por coluna baseado no viewport.
 *
 * Usa os breakpoints do Tailwind do projeto:
 *   < 768px  (mobile)   → 2 cards
 *   < 1280px (tablet)   → 3 cards
 *   >= 1280px (desktop)  → 4 cards
 *
 * A altura do viewport tambem influencia: se for muito baixo
 * (< 700px, ex: notebook em modo paisagem), reduz em 1.
 */
export function getVisibleCardLimit(): number {
  if (typeof window === "undefined") return 3;

  const w = window.innerWidth;
  const h = window.innerHeight;

  let limit = w < 768 ? 2 : w < 1280 ? 3 : 4;

  // Telas baixas (notebook landscape): reduz 1 para evitar scroll
  if (h < 700 && limit > 2) limit -= 1;

  return limit;
}
