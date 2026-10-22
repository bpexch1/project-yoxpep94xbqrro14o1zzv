import { supabase } from "@/integrations/supabase";
import { loginService, logoutService } from "@/services/client";
import { readAccount } from "@/services/accounting";

const SESSION_KEY = "clientSession";

// Account snapshots are only needed for the current browser tab. Remove the
// older persistent copy when users return after this update.
const clearLegacySession = () => localStorage.removeItem(SESSION_KEY);

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
    clearLegacySession();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    clearLegacySession();
  }
};

export const getClientSession = (): ClientSession | null => {
  try {
    clearLegacySession();
    if (!sessionStorage.getItem("exchangeSessionToken")) return null;
    const data = sessionStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const clearClientSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
  clearLegacySession();
  void logoutService().catch(() => {});
};

export const updateClientSessionBalance = (cash: number) => {
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    if (data) {
      const session = JSON.parse(data);
      session.cash = Number(cash || 0);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      window.dispatchEvent(new CustomEvent("balance-updated"));
    }
  } catch (e) {
    console.error("Failed to update session cash balance:", e);
  }
};

export async function refreshClientSession(targetUsername?: string): Promise<ClientSession | null> {
  try {
    const current = getClientSession();
    const uname = targetUsername || current?.username;
    if (!uname) return null;

    const data: any = await readAccount(current?.id);
    if (!data || (targetUsername && data.username.toLowerCase()!==targetUsername.toLowerCase())) return null;

    const sanitized: ClientSession = {
      id: data.id,
      username: data.username,
      full_name: data.full_name || data.username,
      role: data.role || "client",
      credit_received: Number(data.credit_received || 0),
      credit_remaining: Number(data.credit_remaining || 0),
      cash: Number(data.cash || 0),
      pl_downline: Number(data.pl_downline || 0),
      balance_upline: Number(data.balance_upline || 0),
      status: data.status || "active",
    };

    if (current && current.username.toLowerCase() === data.username.toLowerCase()) {
      setClientSession(sanitized);
      window.dispatchEvent(new CustomEvent("balance-updated"));
    }

    return sanitized;
  } catch (e) {
    console.error("Failed to refresh client session:", e);
    return null;
  }
}

export async function loginClient(username: string, password: string): Promise<ClientSession> {
  const account = await loginService(username.trim(), password);
  const session: ClientSession = { ...account, full_name: account.full_name || account.username };
  setClientSession(session);
  return session;
}
