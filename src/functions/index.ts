import axios from "axios";
import {
  MOCK_BETFAIR_EVENTS,
  MOCK_ATD_MATCHES,
  getMockLiveOdds,
  getMockCricketScore,
  getMockOddsEngineResponse,
  getMockShotmap,
} from "./mockSportsData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const ATD_API_KEY = (import.meta.env.ATD_API_KEY || import.meta.env.VITE_ATD_API_KEY || "") as string;
const RAPIDAPI_KEY = (import.meta.env.VITE_RAPIDAPI_KEY || import.meta.env.RAPIDAPI_KEY || "3f6e56db9amsh8bb661e1e33739bp1041cdjsn7f5a3f41abfa") as string;
const RAPIDAPI_HOST = (import.meta.env.VITE_RAPIDAPI_HOST || "sportapi7.p.rapidapi.com") as string;
const CRICBUZZ_HOST = (import.meta.env.VITE_CRICBUZZ_HOST || "cricbuzz-cricket.p.rapidapi.com") as string;
const BETFAIR_RAPIDAPI_HOST = "betfair-exchange-api2.p.rapidapi.com";

/**
 * Fetch Cricbuzz Live and Upcoming Cricket Matches
 * Endpoints:
 * - https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live
 * - https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming
 */
export const fetchCricbuzzMatches = async () => {
  if (!RAPIDAPI_KEY) return [];
  const endpoints = [
    `https://${CRICBUZZ_HOST}/matches/v1/live`,
    `https://${CRICBUZZ_HOST}/matches/v1/upcoming`,
  ];

  const matchesList: any[] = [];

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": CRICBUZZ_HOST,
          "Content-Type": "application/json",
        },
        timeout: 7000,
      });

      const typeMatches = Array.isArray(res.data?.typeMatches) ? res.data.typeMatches : [];

      for (const tm of typeMatches) {
        const seriesMatches = Array.isArray(tm?.seriesMatches) ? tm.seriesMatches : [];
        for (const sm of seriesMatches) {
          const wrapper = sm?.seriesAdWrapper || sm;
          const seriesName = wrapper?.seriesName || sm?.seriesName || "Cricket Series";
          const rawMatches = Array.isArray(wrapper?.matches)
            ? wrapper.matches
            : Array.isArray(sm?.matches)
            ? sm.matches
            : [];

          for (const m of rawMatches) {
            const info = m?.matchInfo || m;
            if (!info || !info.matchId) continue;

            const t1Name = info.team1?.teamName || info.team1?.name || info.team1?.teamSName || "Team 1";
            const t2Name = info.team2?.teamName || info.team2?.name || info.team2?.teamSName || "Team 2";
            const title = `${t1Name} vs ${t2Name}`;
            const state = String(info.state || "").toLowerCase();
            const isLive =
              state.includes("in progress") ||
              state.includes("live") ||
              state.includes("innings break") ||
              state.includes("toss");

            const matchTime = info.startDate
              ? /^\d+$/.test(String(info.startDate))
                ? new Date(parseInt(String(info.startDate))).toISOString()
                : new Date(info.startDate).toISOString()
              : new Date().toISOString();

            // Extract match score if present
            const scoreObj = m?.matchScore;
            let runs = null;
            let wickets = null;
            let overs = null;
            let battingTeam = null;

            if (scoreObj) {
              if (scoreObj.team1Score?.inngs1) {
                runs = scoreObj.team1Score.inngs1.runs;
                wickets = scoreObj.team1Score.inngs1.wickets ?? 0;
                overs = scoreObj.team1Score.inngs1.overs;
                battingTeam = info.team1?.teamSName || t1Name;
              }
              if (scoreObj.team2Score?.inngs1) {
                runs = scoreObj.team2Score.inngs1.runs;
                wickets = scoreObj.team2Score.inngs1.wickets ?? 0;
                overs = scoreObj.team2Score.inngs1.overs;
                battingTeam = info.team2?.teamSName || t2Name;
              }
            }

            matchesList.push({
              id: `cb-${info.matchId}`,
              betfair_event_id: String(info.matchId),
              cricbuzz_match_id: String(info.matchId),
              atd_match_id: String(info.matchId),
              title,
              eventName: title,
              team1: t1Name,
              team2: t2Name,
              sport: "Cricket",
              status: isLive ? "live" : "upcoming",
              match_time: matchTime,
              back_odds: 1.88,
              lay_odds: 1.92,
              back_odds2: 1.94,
              lay_odds2: 1.98,
              category: seriesName || info.matchDesc || "International Cricket",
              source: "cricbuzz",
              score:
                runs != null
                  ? {
                      runs,
                      wickets,
                      overs,
                      battingTeam,
                      status: info.status || (isLive ? "Live" : "Upcoming"),
                    }
                  : null,
              rawMatchInfo: info,
            });
          }
        }
      }
    } catch (err) {
      console.debug(`Cricbuzz ${url} error:`, err);
    }
  }

  // Deduplicate by match ID
  const map = new Map();
  for (const match of matchesList) {
    if (!map.has(match.cricbuzz_match_id)) {
      map.set(match.cricbuzz_match_id, match);
    }
  }
  return Array.from(map.values());
};

/**
 * Fetch detailed match scorecard & headers from Cricbuzz:
 * GET https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/{matchId}/hscard
 */
export const fetchCricbuzzHscard = async (matchId: string | number) => {
  if (!RAPIDAPI_KEY || !matchId) return null;
  const cleanId = String(matchId).replace(/^cb-|^bf-|^atd-|^sportapi-/, "");
  try {
    const res = await axios.get(`https://${CRICBUZZ_HOST}/mcenter/v1/${cleanId}/hscard`, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": CRICBUZZ_HOST,
        "Content-Type": "application/json",
      },
      timeout: 6000,
    });
    return res.data;
  } catch (err) {
    console.debug(`Cricbuzz hscard error for ${cleanId}:`, err);
    return null;
  }
};

export const fetchSportApi7Matches = async (sport = "football") => {
  if (!RAPIDAPI_KEY) return [];
  const today = new Date().toISOString().split("T")[0];
  const endpoints = [
    `https://${RAPIDAPI_HOST}/api/v1/sport/${sport}/events/live`,
    `https://${RAPIDAPI_HOST}/api/v1/sport/${sport}/scheduled-events/${today}`,
  ];

  const results: any[] = [];

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, {
        headers: {
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY,
          "Content-Type": "application/json",
        },
        timeout: 6000,
      });

      const rawEvents = Array.isArray(res.data?.events)
        ? res.data.events
        : Array.isArray(res.data)
        ? res.data
        : [];

      for (const ev of rawEvents) {
        if (!ev || !ev.id) continue;
        const homeTeam = ev.homeTeam?.name || ev.homeTeam?.slug || "Home Team";
        const awayTeam = ev.awayTeam?.name || ev.awayTeam?.slug || "Away Team";
        const isLive =
          ev.status?.type === "inprogress" ||
          (ev.status?.code && ev.status.code > 0 && ev.status.code < 100);
        const matchTime = ev.startTimestamp
          ? new Date(ev.startTimestamp * 1000).toISOString()
          : new Date().toISOString();

        const sportLabel =
          sport.toLowerCase() === "football"
            ? "Soccer"
            : sport.charAt(0).toUpperCase() + sport.slice(1);

        results.push({
          id: `sportapi-${ev.id}`,
          betfair_event_id: String(ev.id),
          atd_match_id: String(ev.id),
          title: ev.name || `${homeTeam} vs ${awayTeam}`,
          eventName: ev.name || `${homeTeam} vs ${awayTeam}`,
          team1: homeTeam,
          team2: awayTeam,
          sport: sportLabel,
          status: isLive ? "live" : "upcoming",
          match_time: matchTime,
          back_odds: 1.85,
          lay_odds: 1.88,
          back_odds2: 2.12,
          lay_odds2: 2.16,
          category:
            ev.tournament?.name ||
            ev.tournament?.category?.name ||
            `${sportLabel} League`,
          source: "sportapi7",
          rawEvent: ev,
        });
      }
    } catch (err) {
      console.debug(`SportAPI7 ${url} fetch error:`, err);
    }
  }

  const uniqueMap = new Map();
  for (const m of results) {
    if (!uniqueMap.has(m.betfair_event_id)) {
      uniqueMap.set(m.betfair_event_id, m);
    }
  }
  return Array.from(uniqueMap.values());
};

export const fetchBetfairEvents = async (_params?: any) => {
  if (API_BASE_URL) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/betfair/events`);
      if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      if (Array.isArray(res.data?.events) && res.data.events.length > 0) return res.data.events;
      if (Array.isArray(res.data?.data) && res.data.data.length > 0) return res.data.data;
    } catch (error) {
      console.debug("fetchBetfairEvents backend failed:", error);
    }
  }

  // Fetch live and upcoming sports from Cricbuzz (cricket) and SportAPI7 (football/soccer, cricket, tennis)
  try {
    const [cricbuzzMatches, footballEvents, tennisEvents, cricketEvents] =
      await Promise.allSettled([
        fetchCricbuzzMatches(),
        fetchSportApi7Matches("football"),
        fetchSportApi7Matches("tennis"),
        fetchSportApi7Matches("cricket"),
      ]);

    const allEvents: any[] = [];
    if (cricbuzzMatches.status === "fulfilled" && Array.isArray(cricbuzzMatches.value)) {
      allEvents.push(...cricbuzzMatches.value);
    }
    if (footballEvents.status === "fulfilled" && Array.isArray(footballEvents.value)) {
      allEvents.push(...footballEvents.value);
    }
    if (tennisEvents.status === "fulfilled" && Array.isArray(tennisEvents.value)) {
      allEvents.push(...tennisEvents.value);
    }
    if (cricketEvents.status === "fulfilled" && Array.isArray(cricketEvents.value)) {
      // Avoid duplicate cricket matches if Cricbuzz already returned them
      for (const cev of cricketEvents.value) {
        const exists = allEvents.some(
          (e) =>
            e.sport?.toLowerCase() === "cricket" &&
            (e.title?.toLowerCase() === cev.title?.toLowerCase() ||
              (e.team1?.toLowerCase() === cev.team1?.toLowerCase() &&
                e.team2?.toLowerCase() === cev.team2?.toLowerCase()))
        );
        if (!exists) {
          allEvents.push(cev);
        }
      }
    }

    if (allEvents.length > 0) {
      return allEvents;
    }
  } catch (err) {
    console.debug("Error fetching live sports events:", err);
  }

  // Attempt RapidAPI Betfair Matches if key is available
  if (RAPIDAPI_KEY) {
    try {
      const res = await axios.get(`https://${BETFAIR_RAPIDAPI_HOST}/getBetfairMatches`, {
        headers: {
          'x-rapidapi-host': BETFAIR_RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
      if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      if (Array.isArray(res.data?.result) && res.data.result.length > 0) return res.data.result;
    } catch (err) {
      console.debug("RapidAPI getBetfairMatches fallback:", err);
    }
  }

  return [];
};

export const fetchAtdCricketHome = async (_params?: any) => {
  if (API_BASE_URL && ATD_API_KEY) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cricket/home`);
      if (res.data && typeof res.data === "object" && Array.isArray(res.data.matches)) {
        return res.data;
      }
      if (Array.isArray(res.data)) {
        return { matches: res.data };
      }
    } catch (error) {
      console.debug("fetchAtdCricketHome error:", error);
    }
  }

  // Fallback to direct Cricbuzz cricket matches
  try {
    const cbMatches = await fetchCricbuzzMatches();
    if (cbMatches.length > 0) {
      return { matches: cbMatches };
    }
  } catch (err) {
    console.debug("fetchAtdCricketHome cricbuzz fallback error:", err);
  }

  return { matches: [] };
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
  const rawId = typeof param === "object" ? (param?.cricbuzzMatchId || param?.matchId || param?.atdMatchId) : param;
  const cleanId = String(rawId || "").replace(/^cb-|^bf-|^atd-|^sportapi-/, "");

  // 1. First attempt Cricbuzz hscard directly via RapidAPI
  if (cleanId && RAPIDAPI_KEY) {
    try {
      const hscard = await fetchCricbuzzHscard(cleanId);
      if (hscard && typeof hscard === "object") {
        const header = hscard.matchHeader || {};
        const mini = hscard.miniscore || {};
        const scoreDetails = mini.matchScoreDetails || {};
        const inningsList = Array.isArray(scoreDetails.inningsScoreList) ? scoreDetails.inningsScoreList : [];
        
        const lastInnings = inningsList[inningsList.length - 1] || {};
        const runs = lastInnings.runs ?? (mini.runs ?? null);
        const wickets = lastInnings.wickets ?? (mini.wickets ?? null);
        const overs = lastInnings.overs ?? (mini.overs ?? null);
        const batTeamName = lastInnings.batTeamName || header.team1?.shortName || header.team1?.name || "BAT";

        return {
          score: {
            battingTeam: batTeamName,
            runs: runs ?? 0,
            wickets: wickets ?? 0,
            overs: overs ?? "0.0",
            crr: mini.currentRunRate ? String(mini.currentRunRate) : "--",
            rrr: mini.requiredRunRate ? String(mini.requiredRunRate) : undefined,
            status: mini.customStatus || header.status || "In Progress",
            lastBall: mini.recentOvsStats ? mini.recentOvsStats.split(" ").pop() : null,
            thisOver: mini.recentOvsStats ? mini.recentOvsStats.trim().split(" ") : [],
          },
          miniscore: mini,
          matchHeader: header,
          scoreCard: hscard.scoreCard || [],
        };
      }
    } catch (err) {
      console.debug("Cricbuzz hscard score fetch error:", err);
    }
  }

  // 2. Fallback to API_BASE_URL if configured
  if (API_BASE_URL && ATD_API_KEY) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/score/${cleanId}`);
      if (res.data && typeof res.data === "object" && res.data.score) {
        return res.data;
      }
    } catch (error) {
      console.debug("getCricketScore backend fallback:", error);
    }
  }

  return getMockCricketScore(param);
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

/**
 * Fetch football shotmap and live analytics from SportAPI7 (Sofascore) on RapidAPI:
 * GET https://sportapi7.p.rapidapi.com/api/v1/event/{id}/shotmap/{teamId}
 */
export const fetchEventShotmap = async (eventId: string | number, teamId?: string | number) => {
  if (!eventId) return getMockShotmap(eventId, teamId);
  try {
    const id = String(eventId).replace(/^bf-|^atd-/, '');
    const url = (teamId !== undefined && teamId !== null && teamId !== '')
      ? `https://${RAPIDAPI_HOST}/api/v1/event/${id}/shotmap/${teamId}`
      : `https://${RAPIDAPI_HOST}/api/v1/event/${id}/shotmap`;

    const res = await axios.get(url, {
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 6000
    });

    if (res.data && (Array.isArray(res.data.shotmap) || Array.isArray(res.data))) {
      const items = Array.isArray(res.data.shotmap) ? res.data.shotmap : res.data;
      return {
        success: true,
        eventId: id,
        shotmap: items,
        stats: res.data.stats || getMockShotmap(eventId, teamId).stats
      };
    }
    return getMockShotmap(eventId, teamId);
  } catch (error) {
    console.debug("fetchEventShotmap fallback to mock:", error);
    return getMockShotmap(eventId, teamId);
  }
};

/**
 * Fetch Betfair match details from RapidAPI Betfair Exchange API
 */
export const fetchRapidApiBetfairMatchDetails = async (eventId: string | number) => {
  try {
    const id = String(eventId).replace(/^bf-/, '');
    const res = await axios.get(`https://${BETFAIR_RAPIDAPI_HOST}/getMatchDetails`, {
      params: { eventId: id },
      headers: {
        'x-rapidapi-host': BETFAIR_RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 6000
    });
    return res.data;
  } catch (error) {
    console.debug("fetchRapidApiBetfairMatchDetails fallback:", error);
    return null;
  }
};

/**
 * Fetch Betfair TV / Stream Access from RapidAPI Betfair Exchange API
 */
export const fetchRapidApiTvAccess = async (eventId: string | number) => {
  try {
    const id = String(eventId).replace(/^bf-/, '');
    const res = await axios.get(`https://${BETFAIR_RAPIDAPI_HOST}/getTvAccess`, {
      params: { eventId: id },
      headers: {
        'x-rapidapi-host': BETFAIR_RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 6000
    });
    return res.data;
  } catch (error) {
    console.debug("fetchRapidApiTvAccess fallback:", error);
    return null;
  }
};