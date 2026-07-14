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

export async function loginClient(username: string, password: string): Promise<ClientSession> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Invalid username or password");

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

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export const setClientSession = (sessionData: ClientSession | null) => {
  if (sessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const getClientSession = (): ClientSession | null => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearClientSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
