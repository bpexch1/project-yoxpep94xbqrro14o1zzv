// High-fidelity fallback sports dataset for offline testing and API failover
export interface MockSportMatch {
  id: string;
  betfair_event_id: string;
  cricbuzz_match_id?: string;
  atd_match_id?: string;
  title: string;
  eventName: string;
  team1: string;
  team2: string;
  sport: string;
  status: "live" | "upcoming" | "completed";
  match_time: string;
  back_odds: number;
  lay_odds: number;
  back_odds2: number;
  lay_odds2: number;
  back_odds_draw?: number;
  lay_odds_draw?: number;
  category: string;
  source: string;
  score?: any;
  rawEvent?: any;
}

const now = new Date();
const inOneHour = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
const inSixHours = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();

export const MOCK_FALLBACK_MATCHES: MockSportMatch[] = [
  // 1. CRICKET: Pakistan vs India (LIVE)
  {
    id: "cb-live-pak-ind",
    betfair_event_id: "pak-ind-live",
    cricbuzz_match_id: "pak-ind-live",
    atd_match_id: "pak-ind-live",
    title: "Pakistan vs India",
    eventName: "Pakistan vs India",
    team1: "Pakistan",
    team2: "India",
    sport: "Cricket",
    status: "live",
    match_time: now.toISOString(),
    back_odds: 2.12,
    lay_odds: 2.16,
    back_odds2: 1.86,
    lay_odds2: 1.88,
    category: "ICC Champions Trophy 2026",
    source: "fallback-mock",
    score: {
      battingTeam: "PAK",
      runs: 184,
      wickets: 4,
      overs: "18.2",
      crr: "10.03",
      status: "Pakistan elected to bat (18.2 Overs)",
      thisOver: ["1", "4", "0", "6", "1", "W"],
      lastBall: "1",
    },
  },

  // 2. CRICKET: Australia vs England (UPCOMING)
  {
    id: "cb-up-aus-eng",
    betfair_event_id: "aus-eng-up",
    cricbuzz_match_id: "aus-eng-up",
    atd_match_id: "aus-eng-up",
    title: "Australia vs England",
    eventName: "Australia vs England",
    team1: "Australia",
    team2: "England",
    sport: "Cricket",
    status: "upcoming",
    match_time: inThreeHours,
    back_odds: 1.90,
    lay_odds: 1.93,
    back_odds2: 2.04,
    lay_odds2: 2.08,
    category: "The Ashes Series 2026",
    source: "fallback-mock",
  },

  // 3. CRICKET: South Africa vs New Zealand (UPCOMING)
  {
    id: "cb-up-sa-nz",
    betfair_event_id: "sa-nz-up",
    cricbuzz_match_id: "sa-nz-up",
    atd_match_id: "sa-nz-up",
    title: "South Africa vs New Zealand",
    eventName: "South Africa vs New Zealand",
    team1: "South Africa",
    team2: "New Zealand",
    sport: "Cricket",
    status: "upcoming",
    match_time: inSixHours,
    back_odds: 1.88,
    lay_odds: 1.92,
    back_odds2: 2.06,
    lay_odds2: 2.10,
    category: "Tri-Nation Series 2026",
    source: "fallback-mock",
  },

  // 4. FOOTBALL: Real Madrid vs Barcelona (UPCOMING)
  {
    id: "sportapi-fb-rm-fcb",
    betfair_event_id: "rm-fcb-up",
    atd_match_id: "rm-fcb-up",
    title: "Real Madrid vs Barcelona",
    eventName: "Real Madrid vs Barcelona",
    team1: "Real Madrid",
    team2: "Barcelona",
    sport: "Soccer",
    status: "upcoming",
    match_time: inThreeHours,
    back_odds: 2.20,
    lay_odds: 2.24,
    back_odds2: 2.90,
    lay_odds2: 2.96,
    back_odds_draw: 3.45,
    lay_odds_draw: 3.55,
    category: "La Liga - El Clásico",
    source: "fallback-mock",
  },

  // 5. FOOTBALL: Manchester City vs Arsenal (LIVE)
  {
    id: "sportapi-fb-mci-ars",
    betfair_event_id: "mci-ars-live",
    atd_match_id: "mci-ars-live",
    title: "Manchester City vs Arsenal",
    eventName: "Manchester City vs Arsenal",
    team1: "Manchester City",
    team2: "Arsenal",
    sport: "Soccer",
    status: "live",
    match_time: now.toISOString(),
    back_odds: 1.35,
    lay_odds: 1.38,
    back_odds2: 7.50,
    lay_odds2: 8.20,
    back_odds_draw: 5.20,
    lay_odds_draw: 5.60,
    category: "Premier League - Matchday 28",
    source: "fallback-mock",
    score: {
      homeScore: 2,
      awayScore: 1,
      minute: "72'",
      status: "In Play (2nd Half)",
    },
  },

  // 6. FOOTBALL: Liverpool vs Chelsea (UPCOMING)
  {
    id: "sportapi-fb-liv-che",
    betfair_event_id: "liv-che-up",
    atd_match_id: "liv-che-up",
    title: "Liverpool vs Chelsea",
    eventName: "Liverpool vs Chelsea",
    team1: "Liverpool",
    team2: "Chelsea",
    sport: "Soccer",
    status: "upcoming",
    match_time: inSixHours,
    back_odds: 1.95,
    lay_odds: 2.00,
    back_odds2: 3.80,
    lay_odds2: 3.90,
    back_odds_draw: 3.60,
    lay_odds_draw: 3.70,
    category: "Premier League",
    source: "fallback-mock",
  },

  // 7. TENNIS: Alcaraz vs Sinner (LIVE)
  {
    id: "sportapi-tn-alc-sin",
    betfair_event_id: "alc-sin-live",
    atd_match_id: "alc-sin-live",
    title: "Carlos Alcaraz vs Jannik Sinner",
    eventName: "Carlos Alcaraz vs Jannik Sinner",
    team1: "Carlos Alcaraz",
    team2: "Jannik Sinner",
    sport: "Tennis",
    status: "live",
    match_time: now.toISOString(),
    back_odds: 1.75,
    lay_odds: 1.78,
    back_odds2: 2.25,
    lay_odds2: 2.30,
    category: "ATP Masters 1000 Final",
    source: "fallback-mock",
    score: {
      set1: "6-4",
      set2: "3-6",
      set3: "4-3",
      points: "30-15",
      server: "Carlos Alcaraz",
      status: "Set 3 (4-3, 30-15)",
    },
  },

  // 8. TENNIS: Djokovic vs Medvedev (UPCOMING)
  {
    id: "sportapi-tn-djo-med",
    betfair_event_id: "djo-med-up",
    atd_match_id: "djo-med-up",
    title: "Novak Djokovic vs Daniil Medvedev",
    eventName: "Novak Djokovic vs Daniil Medvedev",
    team1: "Novak Djokovic",
    team2: "Daniil Medvedev",
    sport: "Tennis",
    status: "upcoming",
    match_time: inOneHour,
    back_odds: 1.65,
    lay_odds: 1.68,
    back_odds2: 2.40,
    lay_odds2: 2.46,
    category: "Grand Slam Semi-Final",
    source: "fallback-mock",
  },

  // 9. TENNIS: Swiatek vs Sabalenka (LIVE)
  {
    id: "sportapi-tn-swi-sab",
    betfair_event_id: "swi-sab-live",
    atd_match_id: "swi-sab-live",
    title: "Iga Swiatek vs Aryna Sabalenka",
    eventName: "Iga Swiatek vs Aryna Sabalenka",
    team1: "Iga Swiatek",
    team2: "Aryna Sabalenka",
    sport: "Tennis",
    status: "live",
    match_time: now.toISOString(),
    back_odds: 1.82,
    lay_odds: 1.86,
    back_odds2: 2.14,
    lay_odds2: 2.18,
    category: "WTA Championship Final",
    source: "fallback-mock",
    score: {
      set1: "7-5",
      set2: "2-2",
      points: "40-40",
      server: "Aryna Sabalenka",
      status: "Set 2 (2-2, 40-40)",
    },
  },
];

export const MOCK_BETFAIR_EVENTS: any[] = MOCK_FALLBACK_MATCHES;
export const MOCK_ATD_MATCHES: any[] = MOCK_FALLBACK_MATCHES.filter(m => m.sport === "Cricket");

export function getMockLiveOdds(matchOrId?: any) {
  const identifier =
    typeof matchOrId === "object"
      ? matchOrId?.betfair_event_id || matchOrId?.eventId || matchOrId?.id || "default"
      : String(matchOrId || "default");

  const cleanId = String(identifier).toLowerCase();

  const found = MOCK_FALLBACK_MATCHES.find(
    (e) =>
      e.betfair_event_id.toLowerCase() === cleanId ||
      e.id.toLowerCase() === cleanId ||
      cleanId.includes(e.betfair_event_id.toLowerCase())
  );

  const team1 = found?.team1 || "Pakistan";
  const team2 = found?.team2 || "India";
  const isSoccer = found?.sport === "Soccer" || cleanId.includes("fb") || cleanId.includes("rm-fcb") || cleanId.includes("mci-ars");
  const isTennis = found?.sport === "Tennis" || cleanId.includes("tn") || cleanId.includes("alc-sin") || cleanId.includes("djo-med");

  const back1 = found?.back_odds || 1.86;
  const lay1 = found?.lay_odds || 1.88;
  const back2 = found?.back_odds2 || 2.12;
  const lay2 = found?.lay_odds2 || 2.16;
  const backDraw = found?.back_odds_draw || 3.45;
  const layDraw = found?.lay_odds_draw || 3.55;

  const matchOddsRunners = [
    { runnerName: team1, backPrice: back1, layPrice: lay1, backSize: 68500, laySize: 84000 },
    { runnerName: team2, backPrice: back2, layPrice: lay2, backSize: 45000, laySize: 52000 },
  ];

  if (isSoccer) {
    matchOddsRunners.push({ runnerName: "The Draw", backPrice: backDraw, layPrice: layDraw, backSize: 28000, laySize: 34000 });
  }

  const markets: any[] = [
    {
      marketId: `m-${identifier}-match-odds`,
      marketName: "Match Odds",
      status: "OPEN",
      runners: matchOddsRunners,
    },
  ];

  if (!isSoccer && !isTennis) {
    // Cricket fancy markets
    markets.push(
      {
        marketId: `m-${identifier}-fancy-runs`,
        marketName: `6 Over Runs (${team1})`,
        status: "OPEN",
        runners: [
          { runnerName: "Under 49.5", backPrice: 1.90, layPrice: 1.95, backSize: 25000, laySize: 31000 },
          { runnerName: "Over 49.5", backPrice: 1.90, layPrice: 1.95, backSize: 26000, laySize: 32000 },
        ],
      },
      {
        marketId: `m-${identifier}-fancy-wicket`,
        marketName: "Fall of 5th Wicket",
        status: "OPEN",
        runners: [
          { runnerName: "Under 195.5", backPrice: 1.88, layPrice: 1.94, backSize: 18500, laySize: 22000 },
          { runnerName: "Over 195.5", backPrice: 1.88, layPrice: 1.94, backSize: 19200, laySize: 24000 },
        ],
      },
      {
        marketId: `m-${identifier}-fancy-session`,
        marketName: `20 Over Total Runs (${team1})`,
        status: "OPEN",
        runners: [
          { runnerName: "Under 204.5", backPrice: 1.85, layPrice: 1.92, backSize: 42000, laySize: 50000 },
          { runnerName: "Over 204.5", backPrice: 1.85, layPrice: 1.92, backSize: 44000, laySize: 53000 },
        ],
      }
    );
  } else if (isSoccer) {
    markets.push(
      {
        marketId: `m-${identifier}-over-under-25`,
        marketName: "Over/Under 2.5 Goals",
        status: "OPEN",
        runners: [
          { runnerName: "Under 2.5", backPrice: 1.92, layPrice: 1.98, backSize: 18000, laySize: 22000 },
          { runnerName: "Over 2.5", backPrice: 1.94, layPrice: 2.02, backSize: 19500, laySize: 24000 },
        ],
      },
      {
        marketId: `m-${identifier}-btts`,
        marketName: "Both Teams to Score",
        status: "OPEN",
        runners: [
          { runnerName: "Yes", backPrice: 1.72, layPrice: 1.76, backSize: 31000, laySize: 38000 },
          { runnerName: "No", backPrice: 2.24, layPrice: 2.32, backSize: 21000, laySize: 26000 },
        ],
      }
    );
  } else if (isTennis) {
    markets.push(
      {
        marketId: `m-${identifier}-set-betting`,
        marketName: "Set Betting",
        status: "OPEN",
        runners: [
          { runnerName: `${team1} 2-0`, backPrice: 2.80, layPrice: 2.94, backSize: 12000, laySize: 15000 },
          { runnerName: `${team1} 2-1`, backPrice: 3.40, layPrice: 3.60, backSize: 14000, laySize: 18000 },
          { runnerName: `${team2} 2-0`, backPrice: 3.90, layPrice: 4.10, backSize: 11000, laySize: 13000 },
          { runnerName: `${team2} 2-1`, backPrice: 4.20, layPrice: 4.50, backSize: 10000, laySize: 12000 },
        ],
      }
    );
  }

  return {
    success: true,
    markets,
    score: found?.score || {
      battingTeam: team1.slice(0, 3).toUpperCase(),
      runs: 184,
      wickets: 4,
      overs: "18.2",
      crr: "10.03",
      thisOver: ["1", "4", "0", "6", "1", "W"],
      lastBall: "1",
    },
  };
}

export function getMockCricketScore(param?: any) {
  const identifier = typeof param === "object" ? (param?.atdMatchId || param?.matchId || "default") : String(param || "default");
  const found = MOCK_FALLBACK_MATCHES.find(e => e.betfair_event_id === identifier || e.id === identifier);
  const team1 = found?.team1 || "PAK";

  return {
    success: true,
    score: found?.score || {
      battingTeam: team1.slice(0, 3).toUpperCase(),
      runs: 184,
      wickets: 4,
      overs: "18.2",
      crr: "10.03",
      thisOver: ["1", "4", "0", "6", "1", "W"],
      lastBall: "1",
    },
  };
}

export function getMockOddsEngineResponse(data?: any) {
  if (data?.action === "getOdds") {
    return {
      success: true,
      odds: {
        teamA_back: 2.12,
        teamA_lay: 2.16,
        teamB_back: 1.86,
        teamB_lay: 1.88,
        isSuspended: false,
      },
    };
  }
  if (data?.action === "syncFromBetfair") {
    return { success: true, synced: true };
  }
  return { success: true };
}

export interface ShotmapItem {
  id: number | string;
  player: { name: string; slug?: string; id?: number; position?: string };
  isHome: boolean;
  shotType: 'goal' | 'save' | 'block' | 'miss' | 'post';
  situation: 'regular' | 'assisted' | 'free-kick' | 'corner' | 'penalty' | 'fast-break';
  bodyPart: 'right-foot' | 'left-foot' | 'head' | 'other';
  time: number;
  addedTime?: number;
  draw: {
    start: { x: number; y: number };
    end?: { x: number; y: number };
    goal?: { x: number; y: number };
  };
  xg: number;
  teamId?: number | string;
}

export const MOCK_SHOTMAP_ITEMS: ShotmapItem[] = [
  {
    id: 101,
    player: { name: "Erling Haaland", position: "FW" },
    isHome: true,
    shotType: "goal",
    situation: "assisted",
    bodyPart: "left-foot",
    time: 23,
    draw: { start: { x: 88, y: 46 }, end: { x: 100, y: 52 }, goal: { x: 98, y: 52 } },
    xg: 0.54,
    teamId: 1,
  },
  {
    id: 102,
    player: { name: "Kevin De Bruyne", position: "MF" },
    isHome: true,
    shotType: "goal",
    situation: "free-kick",
    bodyPart: "right-foot",
    time: 51,
    draw: { start: { x: 78, y: 42 }, end: { x: 100, y: 48 }, goal: { x: 100, y: 48 } },
    xg: 0.22,
    teamId: 1,
  },
  {
    id: 103,
    player: { name: "Bukayo Saka", position: "FW" },
    isHome: false,
    shotType: "goal",
    situation: "assisted",
    bodyPart: "left-foot",
    time: 64,
    draw: { start: { x: 86, y: 58 }, end: { x: 100, y: 54 }, goal: { x: 99, y: 54 } },
    xg: 0.38,
    teamId: 2,
  },
  {
    id: 104,
    player: { name: "Phil Foden", position: "MF" },
    isHome: true,
    shotType: "save",
    situation: "regular",
    bodyPart: "left-foot",
    time: 69,
    draw: { start: { x: 82, y: 39 }, end: { x: 98, y: 46 }, goal: { x: 98, y: 46 } },
    xg: 0.16,
    teamId: 1,
  },
];

export function getMockShotmap(eventId?: string | number, teamId?: string | number) {
  let shotmap = [...MOCK_SHOTMAP_ITEMS];
  if (teamId !== undefined && teamId !== null && teamId !== '') {
    const tid = String(teamId).toLowerCase();
    if (tid === '1' || tid === 'home') {
      shotmap = shotmap.filter(s => s.isHome);
    } else if (tid === '2' || tid === 'away') {
      shotmap = shotmap.filter(s => !s.isHome);
    }
  }

  const homeShots = shotmap.filter(s => s.isHome);
  const awayShots = shotmap.filter(s => !s.isHome);

  const homeXG = Number(homeShots.reduce((acc, s) => acc + s.xg, 0).toFixed(2));
  const awayXG = Number(awayShots.reduce((acc, s) => acc + s.xg, 0).toFixed(2));

  return {
    success: true,
    eventId: eventId || "demo-event-1",
    shotmap,
    stats: {
      home: {
        totalShots: homeShots.length,
        onTarget: homeShots.filter(s => s.shotType === 'goal' || s.shotType === 'save').length,
        goals: homeShots.filter(s => s.shotType === 'goal').length,
        blocked: homeShots.filter(s => s.shotType === 'block').length,
        missed: homeShots.filter(s => s.shotType === 'miss' || s.shotType === 'post').length,
        xg: homeXG,
      },
      away: {
        totalShots: awayShots.length,
        onTarget: awayShots.filter(s => s.shotType === 'goal' || s.shotType === 'save').length,
        goals: awayShots.filter(s => s.shotType === 'goal').length,
        blocked: awayShots.filter(s => s.shotType === 'block').length,
        missed: awayShots.filter(s => s.shotType === 'miss' || s.shotType === 'post').length,
        xg: awayXG,
      }
    }
  };
}
