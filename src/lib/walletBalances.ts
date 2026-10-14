/** Financial display limits from the reference workflow.
 * Values are read-only previews. The backend must always recheck live balances.
 */
export interface WalletSummaryInput {
  role?: string | null;
  cash?: number | null;
  credit_remaining?: number | null;
  pl_downline?: number | null;
}
export function getWalletSummary(client: WalletSummaryInput) {
  const cash = Number(client.cash ?? 0);
  const credit = Number(client.credit_remaining ?? 0);
  const pl = Number(client.pl_downline ?? 0);
  const isBettor = ["client", "bettor", "user"].includes(String(client.role || "").toLowerCase());
  const combinedAvailable = cash + credit + pl;
  return {
    cash,
    credit,
    pl,
    isBettor,
    combinedAvailable,
    cashTabBalance: isBettor ? combinedAvailable : pl,
    maxCashWithdraw: Math.max(0, isBettor ? combinedAvailable : cash),
    // Bettors cannot revoke more credit than their combined unreserved funds permit.
    maxCreditWithdraw: Math.max(0, isBettor ? Math.min(credit, combinedAvailable) : credit),
  };
}
