var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// supabase/functions/exchange-api/feed.ts
var feed_exports = {};
__export(feed_exports, {
  fetchLicensedMarkets: () => fetchLicensedMarkets,
  normalizeMarket: () => normalizeMarket
});
module.exports = __toCommonJS(feed_exports);
function normalizeMarket(catalogue, book, observedAt) {
  if (!catalogue?.marketId || catalogue.marketId !== book?.marketId || !catalogue.event?.id || !Array.isArray(catalogue.runners) || !Array.isArray(book.runners) || !["OPEN", "SUSPENDED", "CLOSED"].includes(book.status))
    throw new Error("Invalid provider market");
  const runners = catalogue.runners.map((r) => ({
    id: String(r.selectionId),
    name: String(r.runnerName)
  }));
  const quotes = [];
  for (const r of book.runners) {
    const name = runners.find((n) => n.id === String(r.selectionId))?.name;
    if (!name || r.status !== "ACTIVE" || book.status !== "OPEN") continue;
    for (const side of ["back", "lay"]) {
      const offers = side === "back" ? r.ex?.availableToBack : r.ex?.availableToLay;
      if (!Array.isArray(offers)) continue;
      const valid = offers.filter(
        (p) => typeof p.price === "number" && Number.isFinite(p.price) && p.price > 1 && p.price <= 1e3 && typeof p.size === "number" && Number.isFinite(p.size) && p.size > 0
      );
      valid.sort(
        (a, b) => side === "back" ? b.price - a.price : a.price - b.price
      );
      if (valid[0])
        quotes.push({
          runnerId: String(r.selectionId),
          selection: name,
          side,
          odds: valid[0].price,
          size: valid[0].size
        });
    }
  }
  return {
    id: String(catalogue.marketId),
    eventId: String(catalogue.event.id),
    eventName: String(catalogue.event.name),
    sport: { "1": "football", "2": "tennis", "4": "cricket" }[String(catalogue.eventType?.id)] || "other",
    name: String(catalogue.marketName),
    startTime: catalogue.marketStartTime,
    status: book.status,
    delayed: book.isMarketDataDelayed !== false,
    observedAt,
    runners,
    quotes
  };
}
async function fetchLicensedMarkets(config, eventId, marketIds, cached = []) {
  async function rpc(method, params) {
    const response = await fetch(
      "https://api.betfair.com/exchange/betting/json-rpc/v1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Application": config.appKey,
          "X-Authentication": config.sessionToken
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: `SportsAPING/v1.0/${method}`,
          params
        }),
        signal: AbortSignal.timeout(1e4)
      }
    );
    if (!response.ok) throw new Error("Licensed feed unavailable");
    const data = await response.json();
    if (data.error || !Array.isArray(data.result))
      throw new Error(
        "Licensed feed rejected request; check provider credentials"
      );
    return data.result;
  }
  const catalogue = await rpc("listMarketCatalogue", {
    filter: marketIds?.length ? { marketIds } : {
      eventTypeIds: ["1", "2", "4"],
      ...eventId ? { eventIds: [eventId] } : {},
      marketTypeCodes: ["MATCH_ODDS"],
      marketStartTime: {
        from: new Date(Date.now() - 864e5).toISOString(),
        to: new Date(Date.now() + 7 * 864e5).toISOString()
      }
    },
    marketProjection: [
      "EVENT",
      "EVENT_TYPE",
      "RUNNER_DESCRIPTION",
      "MARKET_START_TIME"
    ],
    sort: "FIRST_TO_START",
    maxResults: "40"
  });
  for (const m of cached)
    if (!catalogue.some((c) => c.marketId === m.id))
      catalogue.push({
        marketId: m.id,
        marketName: m.name,
        event: { id: m.event_id, name: m.name },
        eventType: { id: "4" },
        marketStartTime: m.observed_at,
        runners: m.runners.map((r) => ({
          selectionId: r.id,
          runnerName: r.name
        }))
      });
  catalogue.splice(40);
  if (!catalogue.length) return [];
  const books = await rpc("listMarketBook", {
    marketIds: catalogue.map((m) => m.marketId),
    priceProjection: {
      priceData: ["EX_BEST_OFFERS"],
      exBestOffersOverrides: { bestPricesDepth: 1 }
    }
  });
  const observedAt = (/* @__PURE__ */ new Date()).toISOString();
  return catalogue.map(
    (m) => normalizeMarket(
      m,
      books.find((b) => b.marketId === m.marketId),
      observedAt
    )
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fetchLicensedMarkets,
  normalizeMarket
});
