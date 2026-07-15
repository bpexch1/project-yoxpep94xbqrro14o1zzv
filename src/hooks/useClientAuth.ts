import { useEffect, useState } from "react";

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

export const useClientSession = () => {
  const [user, setUser] = useState<ClientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const data = localStorage.getItem(SESSION_KEY);

      if (data) {
        setUser(JSON.parse(data));
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    window.location.href = "/login";
  };

  return {
    user,
    isLoading,
    logout,
  };
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
