import { realClient } from "@/integrations/supabase";

const WALLET_TOKEN_KEY = "bpexch-wallet-session";
const WALLET_EXPIRES_KEY = "bpexch-wallet-expires";

export function clearWalletSession(): void {
  sessionStorage.removeItem(WALLET_TOKEN_KEY);
  sessionStorage.removeItem(WALLET_EXPIRES_KEY);
}
export function getWalletSessionToken(): string | null {
  const token = sessionStorage.getItem(WALLET_TOKEN_KEY);
  const expiresAt = Number(sessionStorage.getItem(WALLET_EXPIRES_KEY) || 0);
  if (!token || !/^[a-zA-Z0-9_-]{43}$/.test(token) || !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    clearWalletSession();
    return null;
  }
  return token;
}
export async function authenticatedLogin(username: string, password: string) {
  if (!realClient) throw new Error("Authentication service is not configured.");
  clearWalletSession();
  const { data, error } = await realClient.functions.invoke("bpexch-auth-session", {
    body: { action: "login", username, password },
  });
  if (error || !data?.success || typeof data.sessionToken !== "string" || !data.client?.id) {
    throw new Error(data?.error || "Unable to authenticate. Check credentials or try later.");
  }
  if (!/^[a-zA-Z0-9_-]{43}$/.test(data.sessionToken)) throw new Error("Authentication token was invalid.");
  sessionStorage.setItem(WALLET_TOKEN_KEY, data.sessionToken);
  sessionStorage.setItem(WALLET_EXPIRES_KEY, String(Date.now() + Math.min(2700, Number(data.expiresInSeconds || 0)) * 1000));
  return data.client;
}
export function logoutWalletSession(): void {
  const token = getWalletSessionToken();
  clearWalletSession();
  if (!token || !realClient) return;
  // Server-side revocation is best-effort; token is already discarded locally.
  void realClient.functions.invoke("bpexch-auth-session", {
    body: { action: "logout" }, headers: { Authorization: `Bearer ${token}` },
  }).catch(() => undefined);
}
