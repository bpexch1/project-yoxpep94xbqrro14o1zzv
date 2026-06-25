import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const SESSION_KEY = "clientSession";

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
