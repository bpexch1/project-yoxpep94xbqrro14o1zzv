import { realClient } from "@/integrations/supabase";
const TOKEN_KEY = "exchangeSessionToken";
// Set only on an isolated preview until the AWS API passes production parity checks.
const AWS_API_URL = (import.meta.env.VITE_EXCHANGE_AWS_URL || "").replace(/\/+$/, "");
export function clearServiceSession() {
  sessionStorage.removeItem(TOKEN_KEY);
}
export async function serviceRequest<T>(
  action: string,
  input: unknown = {},
): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (action !== "login" && action !== "health" && !token)
    throw new Error("Please sign in again to use the secure backend");
  if (AWS_API_URL) {
    if (!/^https:\/\/[a-z0-9.-]+(?:\/exchange)?$/i.test(AWS_API_URL))
      throw new Error("AWS backend URL is invalid");
    const url = AWS_API_URL.endsWith("/exchange") ? AWS_API_URL : `${AWS_API_URL}/exchange`;
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", ...(token ? { "x-exchange-session": token } : {}) },
      body: JSON.stringify({ action, input }),
    });
    const data = await response.json().catch(() => null);
    if (response.status === 401) clearServiceSession();
    if (!response.ok || data?.error)
      throw new Error(data?.error || "AWS backend request failed. Retry a pending bet with the same request ID.");
    return data as T;
  }
  if (!realClient) throw new Error("Backend service is not configured");
  const { data, error } = await realClient.functions.invoke("exchange-api", {
    body: { action, input },
    headers: token ? { "x-exchange-session": token } : {},
  });
  if (error) {
    const failure =
      error.context instanceof Response
        ? await error.context.json().catch(() => null)
        : null;
    if (error.context?.status === 401) clearServiceSession();
    throw new Error(
      failure?.error ||
        "Backend request failed. For a pending bet, retry with the same request ID.",
    );
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export async function loginService(username: string, password: string) {
  const result = await serviceRequest<{ token: string; account: any }>(
    "login",
    { username, password },
  );
  sessionStorage.setItem(TOKEN_KEY, result.token);
  return result.account;
}
export async function logoutService() {
  try {
    if (sessionStorage.getItem(TOKEN_KEY)) await serviceRequest("logout");
  } finally {
    clearServiceSession();
  }
}
