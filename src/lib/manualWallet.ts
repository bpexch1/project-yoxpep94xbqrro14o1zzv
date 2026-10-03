import { realClient } from "@/integrations/supabase";

export interface ManualTransfer {
  operatorUsername: string;
  operatorPassword: string;
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
  if (!input.operatorPassword) throw new Error("Enter your administrator password.");
  // Use the real client directly: never fall back to browser/demo writes.
  const { data, error } = await realClient.functions.invoke("manual-wallet", { body: input });
  if (error || !data?.success) {
    const failure = error?.context instanceof Response
      ? await error.context.json().catch(() => null)
      : null;
    throw new Error(failure?.error || data?.error || "Transfer could not be confirmed. Retry with the same details.");
  }
  return data;
}
