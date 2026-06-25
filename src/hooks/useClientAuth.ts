import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const SESSION_KEY = "clientSession";

// 1. Login function jo aapke Node.js backend ko hit karega
export async function loginClient(username: string, password: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
    if (response.data && response.data.token) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(response.data));
      return response.data;
    }
    throw new Error("Invalid response from server");
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Login failed");
  }
}

// 2. setClientSession function jo Login.tsx demand kar rahi hai (Local Storage management)
export const setClientSession = (sessionData: any) => {
  if (sessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

// 3. Current session read karne ka hook function
export const getClientSession = () => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};
