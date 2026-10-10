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
export async function createDownlineAccount(input: AdminAccountRequest): Promise<void> {
  // A browser anon key must never insert privileged roles directly.
  const { data, error } = await supabase.functions.invoke("admin-accounts", {
    body: { action: "create_user", ...input },
  });
  if (error) {
    const context = (error as any).context;
    let message = error.message || "Account service unavailable";
    try {
      if (context && typeof context.json === "function") {
        const body = await context.json();
        message = body.error || message;
      }
    } catch { /* Non-JSON transport error */ }
    throw new Error(message);
  }
  if (!data?.ok) throw new Error(data?.error || "Account was not created");
}
