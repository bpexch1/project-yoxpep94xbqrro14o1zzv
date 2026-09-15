import axios from "axios";
import {
  MOCK_BETFAIR_EVENTS,
  MOCK_ATD_MATCHES,
  getMockLiveOdds,
  getMockCricketScore,
  getMockOddsEngineResponse,
} from "./mockSportsData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const ATD_API_KEY = (import.meta.env.ATD_API_KEY || import.meta.env.VITE_ATD_API_KEY || "") as string;

export const fetchBetfairEvents = async (_params?: any) => {
  if (!API_BASE_URL) return MOCK_BETFAIR_EVENTS;
  try {
    const res = await axios.get(`${API_BASE_URL}/api/betfair/events`);
    if (Array.isArray(res.data) && res.data.length > 0) return res.data;
    if (Array.isArray(res.data?.events) && res.data.events.length > 0) return res.data.events;
    if (Array.isArray(res.data?.data) && res.data.data.length > 0) return res.data.data;
    return MOCK_BETFAIR_EVENTS;
  } catch (error) {
    console.debug("fetchBetfairEvents fallback to mock:", error);
    return MOCK_BETFAIR_EVENTS;
  }
};

export const fetchAtdCricketHome = async (_params?: any) => {
  if (!API_BASE_URL || !ATD_API_KEY) return { matches: MOCK_ATD_MATCHES };
  try {
    const res = await axios.get(`${API_BASE_URL}/api/cricket/home`);
    if (res.data && typeof res.data === "object" && Array.isArray(res.data.matches) && res.data.matches.length > 0) {
      return res.data;
    }
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { matches: res.data };
    }
    return { matches: MOCK_ATD_MATCHES };
  } catch (error) {
    console.debug("fetchAtdCricketHome fallback to mock:", error);
    return { matches: MOCK_ATD_MATCHES };
  }
};

export const handleTransaction = async (data: any) => {
  if (!API_BASE_URL) return { success: true, data };
  try {
    const res = await axios.post(`${API_BASE_URL}/api/transactions`, data);
    return res.data;
  } catch (error) {
    console.debug("handleTransaction fallback:", error);
    return { success: true, data };
  }
};

export const settleBets = async (data: any) => {
  if (!API_BASE_URL) return { success: true, count: 1, message: "Bets settled (mock)" };
  try {
    const res = await axios.post(`${API_BASE_URL}/api/bets/settle`, data);
    return res.data;
  } catch (error) {
    console.debug("settleBets fallback:", error);
    return { success: true, count: 1, message: "Bets settled (mock)" };
  }
};

export const getLiveOdds = async (param: any) => {
  if (!API_BASE_URL) return getMockLiveOdds(param);
  try {
    const id = typeof param === "object" ? (param?.eventId || param?.matchId) : param;
    const res = await axios.get(`${API_BASE_URL}/api/odds/${id}`);
    if (res.data && typeof res.data === "object" && !Array.isArray(res.data) && Array.isArray(res.data.markets)) {
      return res.data;
    }
    return getMockLiveOdds(param);
  } catch (error) {
    console.debug("getLiveOdds fallback to mock:", error);
    return getMockLiveOdds(param);
  }
};

export const getCricketScore = async (param: any) => {
  if (!API_BASE_URL || !ATD_API_KEY) return getMockCricketScore(param);
  try {
    const id = typeof param === "object" ? (param?.atdMatchId || param?.matchId) : param;
    const res = await axios.get(`${API_BASE_URL}/api/score/${id}`);
    if (res.data && typeof res.data === "object" && res.data.score) {
      return res.data;
    }
    return getMockCricketScore(param);
  } catch (error) {
    console.debug("getCricketScore fallback to mock:", error);
    return getMockCricketScore(param);
  }
};

export const oddsEngine = async (data: any) => {
  if (!API_BASE_URL) return getMockOddsEngineResponse(data);
  try {
    const res = await axios.post(`${API_BASE_URL}/api/odds-engine`, data);
    if (res.data && typeof res.data === "object") {
      return res.data;
    }
    return getMockOddsEngineResponse(data);
  } catch (error) {
    console.debug("oddsEngine fallback to mock:", error);
    return getMockOddsEngineResponse(data);
  }
};