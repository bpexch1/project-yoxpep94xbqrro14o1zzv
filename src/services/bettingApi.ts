import { serviceRequest } from "./client";
import { getMarkets, isFreshMarket } from "./marketFeed";
export interface PlaceBetInput {
  requestId: string;
  marketId: string;
  runnerId: string;
  side: "back" | "lay";
  stake: number;
  odds: number;
}
export interface BetRecord {
  id: string;
  request_id: string;
  status: string;
  stake: number;
  odds: number;
  reserved: number;
  profit: number | null;
}
export const placeBet = (input: PlaceBetInput) =>
  serviceRequest<BetRecord>("placeBet", input);
export const getBetStatus = (betId: string) =>
  serviceRequest<BetRecord>("betStatus", { betId });
// Retain the exact request across retries and reloads until a receipt is returned.
export async function placeSelectionBet(input: {
  matchId: string;
  eventId?: string;
  selection: string;
  side: "back" | "lay";
  stake: number;
  odds: number;
}) {
  const key = "pendingExchangeBet";
  const previous = sessionStorage.getItem(key);
  let request: PlaceBetInput;
  const fingerprint = JSON.stringify(input);
  if (previous) {
    const pending = JSON.parse(previous);
    if (pending.fingerprint !== fingerprint)
      throw new Error(
        "An earlier bet has an unconfirmed response. Retry that bet before submitting a different one.",
      );
    request = pending.request;
  } else {
    const markets = await getMarkets(
      input.eventId ? { eventId: input.eventId } : { matchId: input.matchId },
    );
    const candidates = markets
      .filter(isFreshMarket)
      .flatMap((m) =>
        m.quotes
          .filter(
            (q) =>
              q.selection === input.selection &&
              q.side === input.side &&
              Number(q.odds) === input.odds,
          )
          .map((q) => ({ market: m, quote: q })),
      );
    if (candidates.length !== 1)
      throw new Error(
        "A unique live quote is unavailable. Refresh the market and try again.",
      );
    request = {
      requestId: crypto.randomUUID(),
      marketId: candidates[0].market.id,
      runnerId: candidates[0].quote.runner_id,
      side: input.side,
      stake: input.stake,
      odds: input.odds,
    };
    sessionStorage.setItem(key, JSON.stringify({ fingerprint, request }));
  }
  try {
    const result = await placeBet(request);
    sessionStorage.removeItem(key);
    return result;
  } catch (error) {
    // Explicit server rejection is definitive; transport errors leave the request for safe replay.
    if (
      error instanceof Error &&
      /^(Invalid bet parameters|Betting is disabled|Market unavailable or stale|Odds changed|Insufficient quoted liquidity|Insufficient balance)/.test(
        error.message,
      )
    )
      sessionStorage.removeItem(key);
    throw error;
  }
}
