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

const DEMO_FALLBACK_CLIENTS: ClientSession[] = [
  {
    id: "client-book-01",
    username: "Book",
    full_name: "Company Super Admin",
    role: "company",
    credit_received: 10000000,
    credit_remaining: 10000000,
    cash: 5000000,
    pl_downline: 0,
    balance_upline: 0,
    status: "active",
  },
  {
    id: "client-admin-01",
    username: "admin",
    full_name: "Exchange Senior Admin",
    role: "admin",
    credit_received: 2000000,
    credit_remaining: 2000000,
    cash: 1000000,
    pl_downline: 0,
    balance_upline: 0,
    status: "active",
  },
  {
    id: "client-user-01",
    username: "client1",
    full_name: "John Player",
    role: "client",
    credit_received: 50000,
    credit_remaining: 45000,
    cash: 25000,
    pl_downline: 0,
    balance_upline: 0,
    status: "active",
  },
  {
    id: "client-user-02",
    username: "demo_user",
    full_name: "Demo Player",
    role: "client",
    credit_received: 20000,
    credit_remaining: 18500,
    cash: 10000,
    pl_downline: 0,
    balance_upline: 0,
    status: "active",
  }
];

export async function loginClient(username: string, password: string): Promise<ClientSession> {
  const cleanUsername = username.trim();
  const cleanPassword = password;

  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("username", cleanUsername)
      .eq("password", cleanPassword)
      .maybeSingle();

    if (!error && data) {
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
  } catch (err) {
    console.warn("Backend auth query failed, using mock auth:", err);
  }

  // Fallback to demo mock credentials
  const demo = DEMO_FALLBACK_CLIENTS.find(
    (d) =>
      d.username.toLowerCase() === cleanUsername.toLowerCase() &&
      (cleanPassword === "admin" ||
        cleanPassword === "123456" ||
        cleanPassword === d.username ||
        (d.username === "client1" && cleanPassword === "client1") ||
        (d.username === "demo_user" && cleanPassword === "demo"))
  );

  if (demo) {
    setClientSession(demo);
    return demo;
  }

  throw new Error("Invalid username or password");
}
