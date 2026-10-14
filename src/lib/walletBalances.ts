/** Financial display limits from the reference workflow.
 * Values are read-only previews. The backend must always recheck live balances.
 */
export interface WalletSummaryInput {
  role?: string | null;
  cash?: number | null;
  credit_remaining?: number | null;
  pl_downline?: number | null;
}

function money(value: number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function getWalletSummary(client: WalletSummaryInput) {
  const cash = money(client.cash);
  const credit = money(client.credit_remaining);
  const pl = money(client.pl_downline);
  const isBettor = ["client", "bettor", "user"].includes(String(client.role || "").toLowerCase());
  const combinedAvailable = cash + credit + pl;
  const spendable = Math.max(0, combinedAvailable);
  return {
    cash,
    credit,
    pl,
    isBettor,
    combinedAvailable,
    cashTabBalance: isBettor ? combinedAvailable : pl,
    maxCashWithdraw: spendable,
    // Credit already backing a negative cash balance cannot be withdrawn again.
    maxCreditWithdraw: Math.min(Math.max(0, credit), spendable),
  };
}
