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

export const handleTransaction = async (data: any) => {
  return { success: true, data };
};

export const settleBets = async (data: any) => {
  return { success: true, count: 1, message: "Bets settled" };
};

export const getLiveOdds = async (params: any) => {
  const eventId = params?.eventId || params?.matchId;
  return getMockLiveOdds(eventId);
};

export const getCricketScore = async (params: any) => {
  const matchId = params?.matchId || params?.atdMatchId;
  return getMockCricketScore(matchId);
};

export const oddsEngine = async (data: any) => {
  return getMockOddsEngineResponse(data);
};

export const fetchFootballShotmap = async (eventId: string | number, teamId?: string | number) => {
  return getMockShotmap(eventId, teamId);
};

export const fetchRapidApiBetfairMatchDetails = async (_eventId: string | number) => {
  return null;
};

export const fetchRapidApiTvAccess = async (_eventId: string | number) => {
  return null;
};

export const fetchEventShotmap = fetchFootballShotmap;
