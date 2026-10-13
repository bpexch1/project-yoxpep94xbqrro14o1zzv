export interface ProviderMarket {
  id: string;
  eventId: string;
  eventName: string;
  sport: string;
  name: string;
  startTime: string;
  status: string;
  delayed: boolean;
  observedAt: string;
  runners: { id: string; name: string }[];
  quotes: {
    runnerId: string;
    selection: string;
    side: "back" | "lay";
    odds: number;
    size: number;
  }[];
}
/** Provider numbers are decimal odds; IDs remain strings (never lossy numeric conversion). */
export function normalizeMarket(
  catalogue: any,
  book: any,
  observedAt: string,
): ProviderMarket {
  if (
    !catalogue?.marketId ||
    catalogue.marketId !== book?.marketId ||
    !catalogue.event?.id ||
    !Array.isArray(catalogue.runners) ||
    !Array.isArray(book.runners) ||
    !["OPEN", "SUSPENDED", "CLOSED"].includes(book.status)
  )
    throw new Error("Invalid provider market");
  const runners = catalogue.runners.map((r: any) => ({
    id: String(r.selectionId),
    name: String(r.runnerName),
  }));
  const quotes: ProviderMarket["quotes"] = [];
  for (const r of book.runners) {
    const name = runners.find((n: any) => n.id === String(r.selectionId))?.name;
    if (!name || r.status !== "ACTIVE" || book.status !== "OPEN") continue;
    for (const side of ["back", "lay"] as const) {
      const offers =
        side === "back" ? r.ex?.availableToBack : r.ex?.availableToLay;
      if (!Array.isArray(offers)) continue;
      const valid = offers.filter(
        (p: any) =>
          typeof p.price === "number" &&
          Number.isFinite(p.price) &&
          p.price > 1 &&
          p.price <= 1000 &&
          typeof p.size === "number" &&
          Number.isFinite(p.size) &&
          p.size > 0,
      );
      valid.sort((a: any, b: any) =>
        side === "back" ? b.price - a.price : a.price - b.price,
      );
      if (valid[0])
        quotes.push({
          runnerId: String(r.selectionId),
          selection: name,
          side,
          odds: valid[0].price,
          size: valid[0].size,
        });
    }
  }
  return {
    id: String(catalogue.marketId),
    eventId: String(catalogue.event.id),
    eventName: String(catalogue.event.name),
    sport:
      (
        { "1": "football", "2": "tennis", "4": "cricket" } as Record<
          string,
          string
        >
      )[String(catalogue.eventType?.id)] || "other",
    name: String(catalogue.marketName),
    startTime: catalogue.marketStartTime,
    status: book.status,
    delayed: book.isMarketDataDelayed !== false,
    observedAt,
    runners,
    quotes,
  };
}
export async function fetchLicensedMarkets(
  config: { appKey: string; sessionToken: string },
  eventId?: string,
  marketIds?: string[],
  cached: any[] = [],
): Promise<ProviderMarket[]> {
  async function rpc(method: string, params: unknown) {
    const response = await fetch(
      "https://api.betfair.com/exchange/betting/json-rpc/v1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Application": config.appKey,
          "X-Authentication": config.sessionToken,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: `SportsAPING/v1.0/${method}`,
          params,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw new Error("Licensed feed unavailable");
    const data = await response.json();
    if (data.error || !Array.isArray(data.result))
      throw new Error(
        "Licensed feed rejected request; check provider credentials",
      );
    return data.result;
  }
  const catalogue = await rpc("listMarketCatalogue", {
    filter: marketIds?.length
      ? { marketIds }
      : {
          eventTypeIds: ["1", "2", "4"],
          ...(eventId ? { eventIds: [eventId] } : {}),
          marketTypeCodes: ["MATCH_ODDS"],
          marketStartTime: {
            from: new Date(Date.now() - 86400000).toISOString(),
            to: new Date(Date.now() + 7 * 86400000).toISOString(),
          },
        },
    marketProjection: [
      "EVENT",
      "EVENT_TYPE",
      "RUNNER_DESCRIPTION",
      "MARKET_START_TIME",
    ],
    sort: "FIRST_TO_START",
    maxResults: "40",
  });
  // Closed markets disappear from the catalogue; preserve metadata while requesting their final book.
  for (const m of cached)
    if (!catalogue.some((c: any) => c.marketId === m.id))
      catalogue.push({
        marketId: m.id,
        marketName: m.name,
        event: { id: m.event_id, name: m.name },
        eventType: { id: "4" },
        marketStartTime: m.observed_at,
        runners: m.runners.map((r: any) => ({
          selectionId: r.id,
          runnerName: r.name,
        })),
      });
  catalogue.splice(40);
  if (!catalogue.length) return [];
  const books = await rpc("listMarketBook", {
    marketIds: catalogue.map((m: any) => m.marketId),
    priceProjection: {
      priceData: ["EX_BEST_OFFERS"],
      exBestOffersOverrides: { bestPricesDepth: 1 },
    },
  });
  const observedAt = new Date().toISOString();
  return catalogue.map((m: any) =>
    normalizeMarket(
      m,
      books.find((b: any) => b.marketId === m.marketId),
      observedAt,
    ),
  );
}
