import { supabase } from "@/integrations/supabase";

import {
  MOCK_FALLBACK_MATCHES,
  MOCK_BETFAIR_EVENTS,
  MOCK_ATD_MATCHES,
  getMockLiveOdds,
  getMockCricketScore,
  getMockOddsEngineResponse,
  getMockShotmap,
} from "./mockSportsData";

export {
  MOCK_FALLBACK_MATCHES,
  MOCK_BETFAIR_EVENTS,
  MOCK_ATD_MATCHES,
  getMockLiveOdds,
  getMockCricketScore,
  getMockOddsEngineResponse,
  getMockShotmap,
};

/**
 * Local Cricket Matches Provider (No external RapidAPI dependencies)
 */
export const fetchCricbuzzMatches = async () => {
  return [];
};

export const fetchCricbuzzHscard = async (_matchId: string | number) => {
  return null;
};

export const fetchSportApi7Matches = async (_sport = "football") => {
  return [];
};

export const fetchBetfairEvents = async (_params?: any) => {
  return [];
};

export const fetchAtdCricketHome = async (_params?: any) => {
  return { matches: [] };
};

// Never acknowledge financial mutations without an authoritative server transaction.
export const handleTransaction = async (_data: any): Promise<any> => {
  throw new Error("Transaction backend is not connected; balances were not changed.");
};

export const settleBets = async (_data: any): Promise<any> => {
  throw new Error("Verified settlement backend is unavailable; no bets were settled.");
};

// Read only recently ingested and provider-verified server snapshots.
const verifiedSnapshot = async (providerEventId: any): Promise<any | null> => {
  if (!providerEventId) return null;
  const { data, error } = await supabase.from("sports_market_snapshots")
    .select("markets, score, market_status, updated_at, source")
    .eq("provider_event_id", String(providerEventId)).maybeSingle();
  if (error) throw new Error("Live feed is unavailable.");
  const checkedAt = Date.parse(String(data?.updated_at || ""));
  if (!data || !Number.isFinite(checkedAt) || Date.now() - checkedAt > 15000 || checkedAt > Date.now() + 5000)
    return null;
  return data;
};

export const getLiveOdds = async (params: any) => {
  if (import.meta.env.DEV) return getMockLiveOdds(params?.eventId || params?.matchId);
  const current = await verifiedSnapshot(params?.eventId || params?.matchId);
  const markets = Array.isArray(current?.markets) ? current.markets : [];
  return {
    success: !!current,
    markets: current?.market_status === "OPEN" ? markets :
      markets.map((market: any) => ({ ...market, status: "SUSPENDED" })),
    score: current?.score ?? null,
    source: current?.source || "unavailable"
  };
};

export const getCricketScore = async (params: any) => {
  if (import.meta.env.DEV) return getMockCricketScore(params?.matchId || params?.atdMatchId);
  const current = await verifiedSnapshot(params?.matchId || params?.atdMatchId);
  return { success: !!current, score: current?.score ?? null, source: current?.source || "unavailable" };
};

export const oddsEngine = async (data: any): Promise<any> => {
  if (data?.action === "validateOdds") {
    return { valid: false, reason: "Server-side wager RPC validates live odds; local validation disabled." };
  }
  if (import.meta.env.DEV) return getMockOddsEngineResponse(data);
  if (data?.action === "syncFromBetfair") {
    return { success: false, synced: false, reason: "Market ingestion runs server-side." };
  }
  if (data?.action === "getOdds" && data?.matchId) {
    const { data: match, error } = await supabase.from("matches")
      .select("back_odds, lay_odds, back_odds2, lay_odds2, odds_verified_at, odds_status")
      .eq("id", data.matchId).maybeSingle();
    if (error) throw new Error("Verified market prices unavailable.");
    const verifiedAt = Date.parse(String(match?.odds_verified_at || ""));
    if (!Number.isFinite(verifiedAt) || Date.now() - verifiedAt > 15000 ||
        match?.odds_status !== "OPEN") {
      return { success: false, odds: null };
    }
    return { success: true, odds: {
      teamA_back: match.back_odds,
      teamA_lay: match.lay_odds,
      teamB_back: match.back_odds2,
      teamB_lay: match.lay_odds2,
      isSuspended: false
    } };
  }
  throw new Error("Unsupported market API action");
};

export const fetchFootballShotmap = async (eventId: string | number, teamId?: string | number) => {
  return import.meta.env.DEV ? getMockShotmap(eventId, teamId) : [];
};

export const fetchRapidApiBetfairMatchDetails = async (_eventId: string | number) => {
  return null;
};

export const fetchRapidApiTvAccess = async (_eventId: string | number) => {
  return null;
};

export const fetchEventShotmap = fetchFootballShotmap;
