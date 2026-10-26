import { useState, useEffect } from "react";

import { getClientSession, clearClientSession } from "./useClientAuth";
import type { ClientSession } from "./useClientAuth";
export { getClientSession, setClientSession, clearClientSession } from "./useClientAuth";
export type { ClientSession } from "./useClientAuth";

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
