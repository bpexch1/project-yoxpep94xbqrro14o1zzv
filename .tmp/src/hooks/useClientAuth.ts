const SESSION_KEY = "clientSession";

export interface ClientSession {
  id: string;
  username: string;
  full_name: string;
  role: string;
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
