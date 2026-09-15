// Mock sports dataset used when VITE_API_BASE_URL or ATD_API_KEY are not configured.

export const MOCK_BETFAIR_EVENTS = [
  {
    id: "bf-331001",
    betfair_event_id: "331001",
    eventName: "India vs Australia",
    title: "India vs Australia",
    team1: "India",
    team2: "Australia",
    sport: "Cricket",
    status: "live",
    match_time: new Date(Date.now() - 3600000).toISOString(),
    back_odds: 1.85,
    lay_odds: 1.88,
    back_odds2: 2.12,
    lay_odds2: 2.16,
    category: "ICC T20 World Cup",
    source: "betfair",
  },
  {
    id: "bf-331002",
    betfair_event_id: "331002",
    eventName: "England vs South Africa",
    title: "England vs South Africa",
    team1: "England",
    team2: "South Africa",
    sport: "Cricket",
    status: "upcoming",
    match_time: new Date(Date.now() + 7200000).toISOString(),
    back_odds: 1.92,
    lay_odds: 1.95,
    back_odds2: 1.98,
    lay_odds2: 2.02,
    category: "ODI World Series",
    source: "betfair",
  },
  {
    id: "bf-331010",
    betfair_event_id: "331010",
    eventName: "Pakistan vs New Zealand",
    title: "Pakistan vs New Zealand",
    team1: "Pakistan",
    team2: "New Zealand",
    sport: "Cricket",
    status: "live",
    match_time: new Date(Date.now() - 1800000).toISOString(),
    back_odds: 1.96,
    lay_odds: 2.00,
    back_odds2: 1.90,
    lay_odds2: 1.94,
    category: "T20 International",
    source: "betfair",
  },
  {
    id: "bf-331003",
    betfair_event_id: "331003",
    eventName: "Real Madrid vs Barcelona",
    title: "Real Madrid vs Barcelona",
    team1: "Real Madrid",
    team2: "Barcelona",
    sport: "Soccer",
    status: "live",
    match_time: new Date(Date.now() - 2700000).toISOString(),
    back_odds: 2.20,
    lay_odds: 2.25,
    back_odds2: 3.10,
    lay_odds2: 3.20,
    category: "La Liga",
    source: "betfair",
  },
  {
    id: "bf-331005",
    betfair_event_id: "331005",
    eventName: "Manchester City vs Arsenal",
    title: "Manchester City vs Arsenal",
    team1: "Manchester City",
    team2: "Arsenal",
    sport: "Soccer",
    status: "upcoming",
    match_time: new Date(Date.now() + 14400000).toISOString(),
    back_odds: 2.05,
    lay_odds: 2.10,
    back_odds2: 3.40,
    lay_odds2: 3.50,
    category: "Premier League",
    source: "betfair",
  },
  {
    id: "bf-331011",
    betfair_event_id: "331011",
    eventName: "Bayern Munich vs Borussia Dortmund",
    title: "Bayern Munich vs Borussia Dortmund",
    team1: "Bayern Munich",
    team2: "Borussia Dortmund",
    sport: "Soccer",
    status: "upcoming",
    match_time: new Date(Date.now() + 28800000).toISOString(),
    back_odds: 1.62,
    lay_odds: 1.66,
    back_odds2: 4.80,
    lay_odds2: 5.10,
    category: "Bundesliga",
    source: "betfair",
  },
  {
    id: "bf-331004",
    betfair_event_id: "331004",
    eventName: "Novak Djokovic vs Carlos Alcaraz",
    title: "Novak Djokovic vs Carlos Alcaraz",
    team1: "Novak Djokovic",
    team2: "Carlos Alcaraz",
    sport: "Tennis",
    status: "live",
    match_time: new Date(Date.now() - 1200000).toISOString(),
    back_odds: 1.75,
    lay_odds: 1.80,
    back_odds2: 2.20,
    lay_odds2: 2.26,
    category: "Wimbledon Championship",
    source: "betfair",
  },
  {
    id: "bf-331006",
    betfair_event_id: "331006",
    eventName: "Jannik Sinner vs Daniil Medvedev",
    title: "Jannik Sinner vs Daniil Medvedev",
    team1: "Jannik Sinner",
    team2: "Daniil Medvedev",
    sport: "Tennis",
    status: "upcoming",
    match_time: new Date(Date.now() + 21600000).toISOString(),
    back_odds: 1.65,
    lay_odds: 1.70,
    back_odds2: 2.35,
    lay_odds2: 2.45,
    category: "US Open",
    source: "betfair",
  },
  {
    id: "bf-331012",
    betfair_event_id: "331012",
    eventName: "Aryna Sabalenka vs Iga Swiatek",
    title: "Aryna Sabalenka vs Iga Swiatek",
    team1: "Aryna Sabalenka",
    team2: "Iga Swiatek",
    sport: "Tennis",
    status: "live",
    match_time: new Date(Date.now() - 3000000).toISOString(),
    back_odds: 2.05,
    lay_odds: 2.10,
    back_odds2: 1.82,
    lay_odds2: 1.86,
    category: "Roland Garros",
    source: "betfair",
  },
];

export const MOCK_ATD_MATCHES = [
  {
    id: "atd-201",
    atd_match_id: "atd-cricket-1",
    betfair_event_id: "331007",
    eventName: "Chennai Super Kings vs Mumbai Indians",
    title: "Chennai Super Kings vs Mumbai Indians",
    team1: "Chennai Super Kings",
    team2: "Mumbai Indians",
    sport: "Cricket",
    status: "live",
    match_time: new Date(Date.now() - 2400000).toISOString(),
    back_odds: 1.90,
    lay_odds: 1.94,
    back_odds2: 1.96,
    lay_odds2: 2.00,
    category: "Indian Premier League",
    source: "atd",
  },
  {
    id: "atd-202",
    atd_match_id: "atd-cricket-2",
    betfair_event_id: "331008",
    eventName: "Royal Challengers Bengaluru vs Kolkata Knight Riders",
    title: "Royal Challengers Bengaluru vs Kolkata Knight Riders",
    team1: "Royal Challengers Bengaluru",
    team2: "Kolkata Knight Riders",
    sport: "Cricket",
    status: "upcoming",
    match_time: new Date(Date.now() + 43200000).toISOString(),
    back_odds: 1.88,
    lay_odds: 1.92,
    back_odds2: 2.02,
    lay_odds2: 2.06,
    category: "Indian Premier League",
    source: "atd",
  },
  {
    id: "atd-203",
    atd_match_id: "atd-cricket-3",
    betfair_event_id: "331009",
    eventName: "Gujarat Titans vs Rajasthan Royals",
    title: "Gujarat Titans vs Rajasthan Royals",
    team1: "Gujarat Titans",
    team2: "Rajasthan Royals",
    sport: "Cricket",
    status: "upcoming",
    match_time: new Date(Date.now() + 86400000).toISOString(),
    back_odds: 1.94,
    lay_odds: 1.98,
    back_odds2: 1.92,
    lay_odds2: 1.96,
    category: "Indian Premier League",
    source: "atd",
  },
];

export function getMockLiveOdds(matchOrId?: any) {
  const identifier = typeof matchOrId === "object" ? (matchOrId?.eventId || matchOrId?.matchId || "default") : String(matchOrId || "default");
  
  // Find matching mock event if possible
  const found = MOCK_BETFAIR_EVENTS.find(e => e.betfair_event_id === identifier || e.id === identifier) ||
                MOCK_ATD_MATCHES.find(e => e.atd_match_id === identifier || e.id === identifier || e.betfair_event_id === identifier);

  const team1 = found?.team1 || "India";
  const team2 = found?.team2 || "Australia";
  const back1 = found?.back_odds || 1.86;
  const lay1 = found?.lay_odds || 1.88;
  const back2 = found?.back_odds2 || 2.12;
  const lay2 = found?.lay_odds2 || 2.16;

  return {
    success: true,
    markets: [
      {
        marketId: `m-${identifier}-match-odds`,
        marketName: "Match Odds",
        status: "OPEN",
        runners: [
          { runnerName: team1, backPrice: back1, layPrice: lay1, backSize: 52000, laySize: 64000 },
          { runnerName: team2, backPrice: back2, layPrice: lay2, backSize: 38000, laySize: 45000 },
        ],
      },
      {
        marketId: `m-${identifier}-fancy-runs`,
        marketName: `6 Over Runs (${team1})`,
        status: "OPEN",
        runners: [
          { runnerName: "Under 49.5", backPrice: 1.90, layPrice: 1.95, backSize: 15000, laySize: 18000 },
          { runnerName: "Over 49.5", backPrice: 1.90, layPrice: 1.95, backSize: 16000, laySize: 19000 },
        ],
      },
      {
        marketId: `m-${identifier}-fancy-wicket`,
        marketName: "Fall of 4th Wicket",
        status: "OPEN",
        runners: [
          { runnerName: "Under 176.5", backPrice: 1.88, layPrice: 1.94, backSize: 8500, laySize: 11000 },
          { runnerName: "Over 176.5", backPrice: 1.88, layPrice: 1.94, backSize: 9200, laySize: 12000 },
        ],
      },
    ],
    score: {
      battingTeam: team1.slice(0, 3).toUpperCase(),
      runs: 168,
      wickets: 3,
      overs: "17.4",
      crr: "9.51",
      thisOver: ["1", "4", "0", "6", "1", "W"],
      lastBall: "W",
    },
  };
}

export function getMockCricketScore(param?: any) {
  const identifier = typeof param === "object" ? (param?.atdMatchId || param?.matchId || "default") : String(param || "default");
  const found = MOCK_ATD_MATCHES.find(e => e.atd_match_id === identifier || e.id === identifier) ||
                MOCK_BETFAIR_EVENTS.find(e => e.betfair_event_id === identifier || e.id === identifier);
  
  const team1 = found?.team1 || "IND";

  return {
    success: true,
    score: {
      battingTeam: team1.slice(0, 3).toUpperCase(),
      runs: 168,
      wickets: 3,
      overs: "17.4",
      crr: "9.51",
      thisOver: ["1", "4", "0", "6", "1", "W"],
      lastBall: "W",
    },
  };
}

export function getMockOddsEngineResponse(data?: any) {
  if (data?.action === "getOdds") {
    return {
      success: true,
      odds: {
        teamA_back: 1.85,
        teamA_lay: 1.88,
        teamB_back: 2.12,
        teamB_lay: 2.16,
        isSuspended: false,
      },
    };
  }
  if (data?.action === "syncFromBetfair") {
    return { success: true, synced: true };
  }
  return { success: true };
}
