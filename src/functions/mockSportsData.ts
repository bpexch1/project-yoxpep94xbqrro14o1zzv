// Mock sports dataset - Hardcoded dummy matches removed.
export const MOCK_BETFAIR_EVENTS: any[] = [];

export const MOCK_ATD_MATCHES: any[] = [];

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
    start: { x: number; y: number }; // 0 to 100 on pitch
    end?: { x: number; y: number };
    goal?: { x: number; y: number };
  };
  xg: number;
  teamId?: number | string;
}

export const MOCK_SHOTMAP_ITEMS: ShotmapItem[] = [
  // Home Team Shots (e.g. Real Madrid / Man City)
  {
    id: 101,
    player: { name: "Vinícius Júnior", position: "FW" },
    isHome: true,
    shotType: "goal",
    situation: "assisted",
    bodyPart: "right-foot",
    time: 23,
    draw: { start: { x: 88, y: 46 }, end: { x: 100, y: 52 }, goal: { x: 98, y: 52 } },
    xg: 0.42,
    teamId: 1,
  },
  {
    id: 102,
    player: { name: "Jude Bellingham", position: "MF" },
    isHome: true,
    shotType: "save",
    situation: "regular",
    bodyPart: "left-foot",
    time: 31,
    draw: { start: { x: 81, y: 38 }, end: { x: 99, y: 48 }, goal: { x: 99, y: 48 } },
    xg: 0.18,
    teamId: 1,
  },
  {
    id: 103,
    player: { name: "Rodrygo", position: "FW" },
    isHome: true,
    shotType: "goal",
    situation: "fast-break",
    bodyPart: "right-foot",
    time: 57,
    draw: { start: { x: 91, y: 54 }, end: { x: 100, y: 46 }, goal: { x: 100, y: 46 } },
    xg: 0.58,
    teamId: 1,
  },
  {
    id: 104,
    player: { name: "Federico Valverde", position: "MF" },
    isHome: true,
    shotType: "miss",
    situation: "regular",
    bodyPart: "right-foot",
    time: 68,
    draw: { start: { x: 72, y: 62 }, end: { x: 100, y: 70 }, goal: { x: 100, y: 70 } },
    xg: 0.06,
    teamId: 1,
  },
  {
    id: 105,
    player: { name: "Kylian Mbappé", position: "FW" },
    isHome: true,
    shotType: "block",
    situation: "regular",
    bodyPart: "right-foot",
    time: 74,
    draw: { start: { x: 84, y: 48 }, end: { x: 89, y: 50 }, goal: { x: 90, y: 50 } },
    xg: 0.24,
    teamId: 1,
  },
  {
    id: 106,
    player: { name: "Vinícius Júnior", position: "FW" },
    isHome: true,
    shotType: "post",
    situation: "corner",
    bodyPart: "head",
    time: 82,
    draw: { start: { x: 94, y: 42 }, end: { x: 100, y: 44 }, goal: { x: 100, y: 44 } },
    xg: 0.35,
    teamId: 1,
  },

  // Away Team Shots (e.g. Barcelona / Arsenal)
  {
    id: 201,
    player: { name: "Robert Lewandowski", position: "FW" },
    isHome: false,
    shotType: "goal",
    situation: "assisted",
    bodyPart: "head",
    time: 14,
    draw: { start: { x: 92, y: 51 }, end: { x: 100, y: 48 }, goal: { x: 100, y: 48 } },
    xg: 0.49,
    teamId: 2,
  },
  {
    id: 202,
    player: { name: "Lamine Yamal", position: "FW" },
    isHome: false,
    shotType: "save",
    situation: "regular",
    bodyPart: "left-foot",
    time: 39,
    draw: { start: { x: 79, y: 65 }, end: { x: 99, y: 53 }, goal: { x: 99, y: 53 } },
    xg: 0.12,
    teamId: 2,
  },
  {
    id: 203,
    player: { name: "Raphinha", position: "FW" },
    isHome: false,
    shotType: "block",
    situation: "free-kick",
    bodyPart: "left-foot",
    time: 62,
    draw: { start: { x: 76, y: 35 }, end: { x: 82, y: 40 }, goal: { x: 83, y: 40 } },
    xg: 0.08,
    teamId: 2,
  },
  {
    id: 204,
    player: { name: "Pedri", position: "MF" },
    isHome: false,
    shotType: "miss",
    situation: "regular",
    bodyPart: "right-foot",
    time: 77,
    draw: { start: { x: 80, y: 50 }, end: { x: 100, y: 30 }, goal: { x: 100, y: 30 } },
    xg: 0.15,
    teamId: 2,
  },
  {
    id: 205,
    player: { name: "Robert Lewandowski", position: "FW" },
    isHome: false,
    shotType: "save",
    situation: "fast-break",
    bodyPart: "right-foot",
    time: 89,
    draw: { start: { x: 87, y: 45 }, end: { x: 99, y: 49 }, goal: { x: 99, y: 49 } },
    xg: 0.31,
    teamId: 2,
  }
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

