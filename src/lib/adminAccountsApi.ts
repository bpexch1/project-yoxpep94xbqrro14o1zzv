import { supabase } from "@/integrations/supabase";

export interface AdminAccountRequest {
  operatorUsername: string;
  operatorPassword: string;
  username: string;
  password: string;
  role: string;
  downlineShare: number;
  isActive: boolean;
  phone: string;
  reference: string;
  notes: string;
}
export interface MarketRule {
  category: string;
  market: string;
  allowed: boolean;
}
async function callAdminService(action: string, params: Record<string, unknown>): Promise<any> {
  // All writes pass through reauthenticated, service-role-only RPCs.
  const { data, error } = await supabase.functions.invoke("admin-accounts", {
    body: { action, ...params },
  });
  if (error) {
    const context = (error as any).context;
    let message = error.message || "Admin service unavailable";
    try {
      if (context && typeof context.json === "function") {
        const body = await context.json();
        message = body.error || message;
      }
    } catch { /* Non-JSON transport error */ }
    throw new Error(message);
  }
  if (!data?.ok) throw new Error(data?.error || "Admin operation failed");
  return data.result;
}
export async function createDownlineAccount(input: AdminAccountRequest): Promise<void> {
  await callAdminService("create_user", input);
}
export async function readMarketRules(operatorUsername: string, operatorPassword: string): Promise<MarketRule[]> {
  const result = await callAdminService("get_market_permissions", { operatorUsername, operatorPassword });
  if (!Array.isArray(result)) throw new Error("Unexpected market permission response");
  return result;
}
export async function writeMarketRules(operatorUsername: string, operatorPassword: string, rules: MarketRule[]): Promise<void> {
  await callAdminService("set_market_permissions", { operatorUsername, operatorPassword, rules });
}
