import { serviceRequest } from "./client";

export type LedgerWallet = "cash" | "credit" | "pl" | "combined";
export interface WalletLedgerRow {
  id: string; type?: string; created_at: string; description: string; amount: number;
  before_balance: number | null; after_balance: number | null;
}
export interface WalletLedgerResult {
  rows: WalletLedgerRow[]; openingBalance: number | null; truncated: boolean;
}
export const walletLedger = (input: {
  username: string; wallet: LedgerWallet; from: string; to: string; limit?: number;
}) => serviceRequest<WalletLedgerResult>("walletLedger", input);

export const settleAccountPL = (input: {
  clientId: string; amount: number; reason: string; requestId: string;
}) => serviceRequest<{success: boolean; balance: number}>("settlePL", input);
