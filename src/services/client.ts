import { realClient } from "@/integrations/supabase";
const TOKEN_KEY = "exchangeSessionToken";
export function clearServiceSession() {
  sessionStorage.removeItem(TOKEN_KEY);
}
export async function serviceRequest<T>(
  action: string,
  input: unknown = {},
): Promise<T> {
  if (!realClient) throw new Error("Backend service is not configured");
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (action !== "login" && action !== "health" && !token)
    throw new Error("Please sign in again to use the secure backend");
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
