/** Only recorded settlement profit is authoritative, including Lay liability and fees. */
export function settledProfit(bet: { status?: string; profit?: number | null }): number | null {
  if (!["won", "lost", "void"].includes(bet.status || "")) return 0;
  return bet.profit == null ? null : Number(bet.profit);
}
