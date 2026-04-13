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

export function getClientSession(): ClientSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setClientSession(client: ClientSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(client));
}

export function clearClientSession() {
  localStorage.removeItem(SESSION_KEY);
}
