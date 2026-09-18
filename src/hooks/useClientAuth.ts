import { supabase } from "@/integrations/supabase";

const SESSION_KEY = "clientSession";

export interface ClientSession {
  id: string;
  username: string;
  full_name: string;
  role: string;
  credit_received: number;
  credit_remaining: number;
  cash: number;
  pl_downline: number;
  balance_upline: number;
  status: string;
}

export const setClientSession = (session: ClientSession | null) => {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const getClientSession = (): ClientSession | null => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const clearClientSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export async function loginClient(username: string, password: string): Promise<ClientSession> {
  const cleanUsername = username.trim();
  const cleanPassword = password;

  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .ilike("username", cleanUsername)
      .eq("password", cleanPassword)
      .maybeSingle();

    if (!error && data) {
      if (data.status === "inactive" || data.status === "locked" || data.status === "suspended") {
        throw new Error("Account is inactive or disabled");
      }

      const session: ClientSession = {
        id: data.id,
        username: data.username,
        full_name: data.full_name || data.username,
        role: data.role || "client",
        credit_received: data.credit_received || 0,
        credit_remaining: data.credit_remaining || 0,
        cash: data.cash || 0,
        pl_downline: data.pl_downline || 0,
        balance_upline: data.balance_upline || 0,
        status: data.status || "active",
      };
      setClientSession(session);
      return session;
    }
  } catch (err: any) {
    if (err?.message === "Account is inactive or disabled") {
      throw err;
    }
    console.error("Backend auth query error:", err);
  }

  throw new Error("Invalid username or password");
}
