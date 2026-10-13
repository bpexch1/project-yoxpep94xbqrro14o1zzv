import { serviceRequest } from "./client";
export interface Quote {
  id: string;
  market_id: string;
  runner_id: string;
  selection: string;
  side: "back" | "lay";
  odds: number;
  size: number;
  consumed: number;
  observed_at: string;
}
export interface Market {
  id: string;
  event_id: string;
  match_id: string;
  name: string;
  status: string;
  delayed: boolean;
  betting_locked?: boolean;
  observed_at: string;
  runners: { id: string; name: string }[];
  quotes: Quote[];
}
export const getMarkets = (
  filter: { eventId?: string; matchId?: string } = {},
) => serviceRequest<Market[]>("markets", filter);
export const syncMarketFeed = (eventId?: string) =>
  serviceRequest<{ success: boolean; markets: number }>("syncFeed", {
    eventId,
  });
export const isFreshMarket = (market: Market) =>
  market.status === "OPEN" &&
  !market.betting_locked &&
  !market.delayed &&
  Date.now() - Date.parse(market.observed_at) < 15000;
export async function getLiveMarketOdds(eventId: string) {
  const markets = await getMarkets({ eventId });
  return {
    eventId,
    markets: markets.map((m) => ({
      marketId: m.id,
      marketName: m.name,
      status: m.status,
      stale: !isFreshMarket(m),
      runners: m.runners.map((r) => ({
        selectionId: r.id,
        runnerName: r.name,
        name: r.name,
        backPrice: isFreshMarket(m)
          ? Number(
              m.quotes.find((q) => q.runner_id === r.id && q.side === "back")
                ?.odds,
            ) || undefined
          : undefined,
        layPrice: isFreshMarket(m)
          ? Number(
              m.quotes.find((q) => q.runner_id === r.id && q.side === "lay")
                ?.odds,
            ) || undefined
          : undefined,
        ex: {
          availableToBack: m.quotes
            .filter(
              (q) =>
                q.runner_id === r.id && q.side === "back" && isFreshMarket(m),
            )
            .map((q) => ({
              price: Number(q.odds),
              size: Math.max(0, Number(q.size) - Number(q.consumed)),
            })),
          availableToLay: m.quotes
            .filter(
              (q) =>
                q.runner_id === r.id && q.side === "lay" && isFreshMarket(m),
            )
            .map((q) => ({
              price: Number(q.odds),
              size: Math.max(0, Number(q.size) - Number(q.consumed)),
            })),
        },
      })),
    })),
  };
}
