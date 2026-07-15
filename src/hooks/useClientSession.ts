import { useState, useEffect } from "react";

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

export const useClientSession = () => {
  const [user, setUser] = useState<ClientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getClientSession());
    setIsLoading(false);
  }, []);

  const logout = () => {
    clearClientSession();
    setUser(null);
    window.location.href = "/login";
  };

  return { user, isLoading, logout };
};
