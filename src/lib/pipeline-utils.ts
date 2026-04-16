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
  /** Data ISO para ordenacao (expected_delivery_date, sent_at, etc.) */
  sortDate?: string | null;
  /** Fallback: data de criacao para desempate */
  createdAt?: string | null;
};

/**
 * Ordena items do pipeline por prioridade operacional:
 * 1. Overdue primeiro (urgencia maxima)
 * 2. Prazo mais proximo (sortDate menor = mais urgente)
 * 3. Items sem prazo vao para o final
 * 4. Desempate: mais antigo primeiro (createdAt)
 *
 * Ordenacao estavel: items iguais mantem posicao original.
 */
export function sortPipelineItems<T extends PipelineItemBase>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // 1. Overdue primeiro
    const aOverdue = a.isOverdue ? 1 : 0;
    const bOverdue = b.isOverdue ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    // 2. Prazo mais proximo primeiro
    const aDate = a.sortDate ?? null;
    const bDate = b.sortDate ?? null;
    if (aDate && bDate) return aDate.localeCompare(bDate);
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;

    // 3. Desempate: mais antigo primeiro
    const aCreated = a.createdAt ?? "";
    const bCreated = b.createdAt ?? "";
    if (aCreated && bCreated) return aCreated.localeCompare(bCreated);

    return 0;
  });
}

/**
 * Calcula quantos cards mostrar por coluna baseado no viewport.
 *
 * Considera largura E altura da tela para densidade visual adequada:
 *
 * | Viewport           | Cards |
 * |-------------------|-------|
 * | < 640px (mobile)  | 1     |
 * | < 768px (sm)      | 2     |
 * | < 1280px (md/lg)  | 3     |
 * | >= 1280px (xl+)   | 4     |
 *
 * Ajuste por altura: telas com < 700px de altura (notebook landscape)
 * reduzem 1 card para evitar scroll vertical desnecessario.
 *
 * Reaproveita breakpoints do Tailwind configurados no projeto.
 */
export function getVisibleCardLimit(): number {
  if (typeof window === "undefined") return 3;

  const w = window.innerWidth;
  const h = window.innerHeight;

  let limit: number;
  if (w < 640) limit = 1;
  else if (w < 768) limit = 2;
  else if (w < 1280) limit = 3;
  else limit = 4;

  // Telas baixas (notebook landscape, monitor pequeno): reduz 1
  if (h < 700 && limit > 1) limit -= 1;

  return limit;
}
