/**
 * Resolves the effective date range for a report. Defaults to the current
 * calendar month when from/to aren't provided — same default used across
 * Dashboard and Budgets, so "no range given" behaves consistently everywhere.
 */
export function resolveDateRange(from?: string, to?: string): { from: string; to: string } {
  if (from && to) return { from, to };

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  return {
    from: from ?? monthStart.toISOString().slice(0, 10),
    to: to ?? monthEnd.toISOString().slice(0, 10),
  };
}