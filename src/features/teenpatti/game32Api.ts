import { realClient } from "@/integrations/supabase";
import type { StudioBet, StudioState, StudioHistoryRow } from "./api";

async function invoke<T>(
  endpoint: string,
  method: "GET" | "POST",
  body?: unknown,
  requestId?: string,
): Promise<T> {
  const token = sessionStorage.getItem("exchangeSessionToken");
  if (!token || !realClient) throw new Error("Please sign in again to use 32 Cards");
  const { data, error } = await realClient.functions.invoke(`game32/${endpoint}`, {
    method,
    ...(body === undefined ? {} : { body }),
    headers: {
      "x-exchange-session": token,
      ...(requestId ? { "x-idempotency-key": requestId } : {}),
    },
  });
  if (error) {
    const failure = error.context instanceof Response
      ? await error.context.json().catch(() => null)
      : null;
    throw new Error(failure?.error || "32 Cards connection interrupted. Retry with the same request ID.");
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export async function game32StudioRequest<T>(action: string, input: unknown): Promise<T> {
  if (action === "state") return invoke<StudioState>("active", "GET") as Promise<T>;
  if (action === "history") {
    return invoke<{ history: StudioHistoryRow[] }>("last-results", "GET") as Promise<T>;
  }
  const bet = input as StudioBet;
  return invoke("place-bet", "POST", bet, bet.requestId) as Promise<T>;
}

export const getGame32Config = () => invoke("config", "GET");
export const getGame32ActiveBets = () => invoke("my-active-bets", "GET");
export const getGame32Exposure = () => invoke("my-exposure", "GET");
export const getGame32Settlements = () => invoke("recent-settlements", "GET");
