import { useState, useEffect } from "react";

interface User {
  username: string;
  role: string;
  token: string;
}

export const useClientSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return { user, isLoading, logout };
};

// Export getClientSession for Index.tsx
export const getClientSession = async (): Promise<User | null> => {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");
  
  if (token && userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  return null;
};
