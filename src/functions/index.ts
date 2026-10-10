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

// Development fixtures are never treated as live licensed data in production.
export const getLiveOdds = async (params: any) => {
  if (import.meta.env.DEV) return getMockLiveOdds(params?.eventId || params?.matchId);
  return { success: false, markets: [], score: null, source: "unavailable" };
};

export const getCricketScore = async (params: any) => {
  if (import.meta.env.DEV) return getMockCricketScore(params?.matchId || params?.atdMatchId);
  return { success: false, score: null, source: "unavailable" };
};

export const oddsEngine = async (data: any): Promise<any> => {
  if (data?.action === "validateOdds") {
    return { valid: false, reason: "Server-side odds verification is not configured." };
  }
  if (import.meta.env.DEV) return getMockOddsEngineResponse(data);
  throw new Error("Authoritative odds and market sync service is not configured.");
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
