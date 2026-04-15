/**
 * Métricas financeiras centralizadas.
 *
 * Toda tela financeira (Overview, Finance, FinanceGoals, etc.) DEVE importar
 * daqui em vez de reimplementar cálculos. Isso garante que "burn rate",
 * "runway" e "margem operacional" tenham uma única definição em todo o app.
 *
 * Auditoria 2026-04-15: antes deste módulo, Overview e Finance computavam
 * burn rate com denominadores diferentes (janela inteira vs meses-com-despesa)
 * e margem operacional em regimes diferentes (caixa vs híbrido), produzindo
 * números divergentes para o mesmo indicador na mesma sessão de uso.
 */

export const BURN_RATE_WINDOW_MONTHS = 6;

export type MonthlyCashPoint = {
  /** YYYY-MM */
  key: string;
  /** Caixa que entrou no mês (charges pagas, em reais) */
  cashIn: number;
  /** Caixa que saiu no mês (despesas, em reais) */
  cashOut: number;
};

/**
 * Burn rate médio mensal: média das saídas dos últimos N meses, dividindo
 * SEMPRE pela janela inteira (não apenas meses com despesa).
 *
 * Decisão: dividir pela janela inteira evita inflar o burn quando há meses
 * vazios (start de operação, gap entre contratações). Um mês sem despesa é
 * informação real — não deve ser excluído do denominador.
 */
export function computeBurnRate(
  monthlySeries: MonthlyCashPoint[],
  windowMonths: number = BURN_RATE_WINDOW_MONTHS
): number {
  if (monthlySeries.length === 0 || windowMonths <= 0) return 0;
  const window = monthlySeries.slice(-windowMonths);
  if (window.length === 0) return 0;
  const totalOut = window.reduce((sum, point) => sum + point.cashOut, 0);
  return totalOut / window.length;
}

/**
 * Runway em meses: quantos meses o caixa atual sustenta no ritmo de burn.
 *
 * Retorno:
 * - `null` quando burn ≤ 0 (operação não está queimando caixa — runway infinito)
 * - `0` quando saldo ≤ 0 (sem caixa para queimar)
 * - número positivo de meses caso contrário
 *
 * Não retornamos Infinity para não poluir UI com formatação especial.
 */
export function computeRunway(cashBalance: number, burnRate: number): number | null {
  if (burnRate <= 0) return null;
  if (cashBalance <= 0) return 0;
  return cashBalance / burnRate;
}

/**
 * Margem operacional por COMPETÊNCIA.
 *
 * `revenue` deve ser receita reconhecida no período (recorrente + projeto por due_date).
 * `expenses` deve ser despesas do período por expense_date.
 *
 * Retorna `null` quando revenue ≤ 0 (margem indefinida sem base).
 * Retorna percentual (-100 a +100, podendo estourar para baixo se despesas > receita).
 */
export function computeOperationalMargin(revenue: number, expenses: number): number | null {
  if (revenue <= 0) return null;
  return ((revenue - expenses) / revenue) * 100;
}
