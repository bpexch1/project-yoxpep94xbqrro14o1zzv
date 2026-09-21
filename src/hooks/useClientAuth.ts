import { supabase } from "@/integrations/supabase";
import bcrypt from "bcryptjs";

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
    let clientData: any = null;

    // 1. Primary ilike query from clients table
    const res1 = await supabase
      .from("clients")
      .select("id, username, full_name, role, password, status, credit_received, credit_remaining, cash, pl_downline, balance_upline")
      .ilike("username", cleanUsername);

    if (res1.data && Array.isArray(res1.data) && res1.data.length > 0) {
      clientData = res1.data.find(
        (c: any) => (c.username || "").trim().toLowerCase() === cleanUsername.toLowerCase()
      ) || res1.data[0];
    } else if (res1.data && !Array.isArray(res1.data)) {
      clientData = res1.data;
    }

    // 2. Fallback eq query if ilike returned nothing
    if (!clientData) {
      const res2 = await supabase
        .from("clients")
        .select("id, username, full_name, role, password, status, credit_received, credit_remaining, cash, pl_downline, balance_upline")
        .eq("username", cleanUsername);

      if (res2.data && Array.isArray(res2.data) && res2.data.length > 0) {
        clientData = res2.data[0];
      } else if (res2.data && !Array.isArray(res2.data)) {
        clientData = res2.data;
      }
    }

    if (clientData) {
      const storedPw = String(clientData.password ?? "");
      const isBcrypt =
        storedPw.startsWith("$2a$") ||
        storedPw.startsWith("$2b$") ||
        storedPw.startsWith("$2y$");

      let isMatch = false;
      if (isBcrypt) {
        try {
          isMatch = bcrypt.compareSync(cleanPassword, storedPw);
        } catch {
          isMatch = false;
        }
      }

      // Plain text fallback if not matched or not bcrypt
      if (!isMatch) {
        isMatch = storedPw === cleanPassword || storedPw.trim() === cleanPassword.trim();
      }

      if (!isMatch) {
        throw new Error("Invalid username or password");
      }

      if (clientData.status === "inactive" || clientData.status === "locked" || clientData.status === "suspended") {
        throw new Error("Account is inactive or disabled");
      }

      const session: ClientSession = {
        id: clientData.id,
        username: clientData.username,
        full_name: clientData.full_name || clientData.username,
        role: clientData.role || "client",
        credit_received: clientData.credit_received || 0,
        credit_remaining: clientData.credit_remaining || 0,
        cash: clientData.cash || 0,
        pl_downline: clientData.pl_downline || 0,
        balance_upline: clientData.balance_upline || 0,
        status: clientData.status || "active",
      };
      setClientSession(session);
      return session;
    }
  } catch (err: any) {
    if (err?.message === "Account is inactive or disabled") {
      throw err;
    }
    // Never log raw passwords
  }

  throw new Error("Invalid username or password");
}
