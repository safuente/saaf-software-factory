/** Figures of the metrics panel (F06 Behavior), from the month's summary only. Integer
 * arithmetic, rounding half up. */

/** round(collected ÷ (collected + pending) × 100); undefined when there are no amounts. */
export function paidPercent(collected: number, pending: number): number | undefined {
  const sum = collected + pending;
  if (sum === 0) return undefined;
  return Math.floor((200 * collected + sum) / (2 * sum));
}

/** total ÷ count in cents, rounded half up to the cent; undefined when there are no lessons.
 * Lessons priced $0 count. */
export function averagePerLesson(total: number, count: number): number | undefined {
  if (count === 0) return undefined;
  return Math.floor((2 * total + count) / (2 * count));
}
