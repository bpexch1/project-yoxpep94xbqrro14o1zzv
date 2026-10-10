import { realClient } from "@/integrations/supabase";
import { clearWalletSession, getWalletSessionToken } from "@/lib/walletSession";
export interface ManualTransfer {
  clientId: string;
  wallet: "cash" | "credit";
  direction: "deposit" | "withdraw";
  amount: string;
  description: string;
  requestId: string;
}
export async function manualWalletTransfer(input: ManualTransfer) {
  if (!realClient) throw new Error("Wallet service is not configured. No balance was changed.");
  if (!/^\d+(\.\d{1,2})?$/.test(input.amount) || !Number.isFinite(Number(input.amount)) || Number(input.amount) <= 0) {
    throw new Error("Enter a positive amount with no more than two decimal places.");
  }
  const token = getWalletSessionToken();
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  const { data, error } = await realClient.functions.invoke("manual-wallet-session", {
    body: input, headers: { Authorization: `Bearer ${token}` },
  });
  if (error || !data?.success) {
    let detail: any = null;
    if (error?.context instanceof Response) detail = await error.context.json().catch(() => null);
    const message = detail?.error || data?.error || "Transfer could not be confirmed. Retry using the same request.";
    if (/session expired/i.test(message)) clearWalletSession();
    throw new Error(message);
  }
  return data;
}
