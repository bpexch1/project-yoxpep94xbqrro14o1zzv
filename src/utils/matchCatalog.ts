// Catalog of default / live inplay matches and robust match finder utility

export interface CatalogMatch {
  id: string;
  sport: "Cricket" | "Soccer" | "Tennis" | "Horse Race" | "Greyhound";
  title: string;
  team1: string;
  team2: string;
  status: "live" | "upcoming" | "completed";
  match_time: string;
  matched_amount?: string;
  odds?: number;
  back_odds?: number;
  lay_odds?: number;
  back_odds2?: number;
  lay_odds2?: number;
  betfair_event_id?: string;
  cricbuzz_match_id?: string;
}

export const CATALOG_MATCHES: CatalogMatch[] = [
  // SOCCER / FOOTBALL
  {
    id: "fb-1",
    sport: "Soccer",
    title: "Bogota V Barranquilla",
    team1: "Bogota",
    team2: "Barranquilla",
    status: "live",
    match_time: "21:00",
    matched_amount: "2,095,266",
    odds: 2.56,
    back_odds: 2.58,
    lay_odds: 2.62,
    back_odds2: 4.8,
    lay_odds2: 4.9,
  },
  {
    id: "fb-roma",
    sport: "Soccer",
    title: "Roma V Inter",
    team1: "Roma",
    team2: "Inter",
    status: "live",
    match_time: "21:00",
    matched_amount: "14,029,346",
    odds: 1.95,
    back_odds: 1.95,
    lay_odds: 1.97,
    back_odds2: 2.4,
    lay_odds2: 2.44,
  },
  {
    id: "fb-2",
    sport: "Soccer",
    title: "Nottm Forest V Coventry",
    team1: "Nottm Forest",
    team2: "Coventry",
    status: "live",
    match_time: "21:30",
    matched_amount: "14,040,110",
    odds: 2.1,
    back_odds: 2.1,
    lay_odds: 2.12,
    back_odds2: 3.4,
    lay_odds2: 3.45,
  },
  {
    id: "fb-3",
    sport: "Soccer",
    title: "Stuttgart V Dortmund",
    team1: "Stuttgart",
    team2: "Dortmund",
    status: "live",
    match_time: "21:30",
    matched_amount: "8,835,988",
    odds: 1.88,
    back_odds: 1.88,
    lay_odds: 1.9,
    back_odds2: 2.6,
    lay_odds2: 2.64,
  },
  {
    id: "fb-4",
    sport: "Soccer",
    title: "Trabzonspor V Galatasaray",
    team1: "Trabzonspor",
    team2: "Galatasaray",
    status: "live",
    match_time: "22:00",
    matched_amount: "822,308",
    odds: 2.25,
    back_odds: 2.25,
    lay_odds: 2.28,
    back_odds2: 2.1,
    lay_odds2: 2.14,
  },
  // CRICKET
  {
    id: "cr-1",
    sport: "Cricket",
    title: "Afghanistan v India",
    team1: "Afghanistan",
    team2: "India",
    status: "live",
    match_time: "19:30",
    matched_amount: "24,198,340",
    odds: 1.65,
    back_odds: 1.65,
    lay_odds: 1.67,
    back_odds2: 2.45,
    lay_odds2: 2.48,
  },
  {
    id: "cr-2",
    sport: "Cricket",
    title: "England v Sri Lanka",
    team1: "England",
    team2: "Sri Lanka",
    status: "live",
    match_time: "20:00",
    matched_amount: "1,425,522",
    odds: 1.72,
    back_odds: 1.72,
    lay_odds: 1.74,
    back_odds2: 2.3,
    lay_odds2: 2.34,
  },
  {
    id: "cr-3",
    sport: "Cricket",
    title: "South Africa v Australia",
    team1: "South Africa",
    team2: "Australia",
    status: "live",
    match_time: "21:00",
    matched_amount: "34,680",
    odds: 1.5,
    back_odds: 1.5,
    lay_odds: 1.52,
    back_odds2: 2.8,
    lay_odds2: 2.85,
  },
  {
    id: "cr-4",
    sport: "Cricket",
    title: "India v West Indies",
    team1: "India",
    team2: "West Indies",
    status: "live",
    match_time: "19:30",
    matched_amount: "18,340,120",
    odds: 1.45,
    back_odds: 1.45,
    lay_odds: 1.47,
    back_odds2: 3.1,
    lay_odds2: 3.15,
  },
  {
    id: "cr-5",
    sport: "Cricket",
    title: "Zimbabwe v Australia",
    team1: "Zimbabwe",
    team2: "Australia",
    status: "live",
    match_time: "21:00",
    matched_amount: "11,200,900",
    odds: 1.5,
    back_odds: 1.5,
    lay_odds: 1.52,
    back_odds2: 2.8,
    lay_odds2: 2.85,
  },
  // TENNIS
  {
    id: "tn-1",
    sport: "Tennis",
    title: "Bucsa v Bejlek",
    team1: "Bucsa",
    team2: "Bejlek",
    status: "live",
    match_time: "20:30",
    matched_amount: "3,420,100",
    odds: 1.9,
    back_odds: 1.9,
    lay_odds: 1.92,
    back_odds2: 2.05,
    lay_odds2: 2.08,
  },
  {
    id: "tn-2",
    sport: "Tennis",
    title: "Frech v I Jovic",
    team1: "Frech",
    team2: "I Jovic",
    status: "live",
    match_time: "21:15",
    matched_amount: "2,890,450",
    odds: 2.05,
    back_odds: 2.05,
    lay_odds: 2.08,
    back_odds2: 1.9,
    lay_odds2: 1.93,
  },
];

/**
 * Detect sport accurately from title or text keywords
 */
export function detectSportFromText(text: string): "Cricket" | "Soccer" | "Tennis" | "Horse Race" | "Greyhound" {
  if (!text) return "Soccer";
  const t = text.toLowerCase();

  if (
    t.includes("cricket") ||
    t.includes("india") ||
    t.includes("afghanistan") ||
    t.includes("pakistan") ||
    t.includes("england") ||
    t.includes("sri lanka") ||
    t.includes("australia") ||
    t.includes("zimbabwe") ||
    t.includes("south africa") ||
    t.includes("west indies") ||
    t.includes("bangladesh") ||
    t.includes("new zealand") ||
    t.includes("runs") ||
    t.includes("wicket") ||
    t.includes("over run") ||
    t.includes("fancy") ||
    t.includes("tied match")
  ) {
    return "Cricket";
  }

  if (
    t.includes("tennis") ||
    t.includes("bucsa") ||
    t.includes("bejlek") ||
    t.includes("frech") ||
    t.includes("jovic") ||
    t.includes("djokovic") ||
    t.includes("alcaraz") ||
    t.includes("sinner") ||
    t.includes("swiatek") ||
    t.includes("sabalenka") ||
    t.includes("set 1") ||
    t.includes("set 2")
  ) {
    return "Tennis";
  }

  if (t.includes("horse") || t.includes("presque") || t.includes("louisiana") || t.includes("downs")) {
    return "Horse Race";
  }

  if (t.includes("greyhound") || t.includes("angle park")) {
    return "Greyhound";
  }

  return "Soccer";
}

/**
 * Normalizes title for clean comparison
 */
function normalizeString(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/\bvs\b|\bv\b/g, "v")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Robustly find or synthesize a match object from any ID, Title, or partial query
 */
export function findMatchByIdOrTitle(idOrTitle: string, extraList: any[] = []): CatalogMatch {
  if (!idOrTitle) {
    return CATALOG_MATCHES[0];
  }

  const query = idOrTitle.trim();
  const queryNormalized = normalizeString(query);

  const combined = [...(Array.isArray(extraList) ? extraList : []), ...CATALOG_MATCHES];

  // 1. Direct ID / Betfair ID match
  let found = combined.find(
    (m: any) =>
      m.id === query ||
      m.betfair_event_id === query ||
      String(m.id).toLowerCase() === query.toLowerCase()
  );
  if (found) return normalizeFoundMatch(found);

  // 2. Normalized Title match
  found = combined.find((m: any) => {
    const title = m.title || `${m.team1 || ""} v ${m.team2 || ""}`;
    return normalizeString(title) === queryNormalized;
  });
  if (found) return normalizeFoundMatch(found);

  // 3. Substring match
  found = combined.find((m: any) => {
    const titleNorm = normalizeString(m.title || `${m.team1 || ""} v ${m.team2 || ""}`);
    return titleNorm.includes(queryNormalized) || queryNormalized.includes(titleNorm);
  });
  if (found) return normalizeFoundMatch(found);

  // 4. Team 1 or Team 2 match
  found = combined.find((m: any) => {
    const t1 = normalizeString(m.team1 || "");
    const t2 = normalizeString(m.team2 || "");
    return (t1 && queryNormalized.includes(t1)) || (t2 && queryNormalized.includes(t2));
  });
  if (found) return normalizeFoundMatch(found);

  // 5. Synthesize dynamically if not in catalog
  return synthesizeMatch(query);
}

function normalizeFoundMatch(m: any): CatalogMatch {
  const t1 = m.team1 || (m.title ? m.title.split(/ vs | v | V /i)[0] : "Team 1");
  const t2 = m.team2 || (m.title ? m.title.split(/ vs | v | V /i)[1] : "Team 2");
  const title = m.title || `${t1} v ${t2}`;
  const sport = (m.sport as any) || detectSportFromText(title);

  return {
    ...m,
    id: m.id || `m-${normalizeString(title).substring(0, 10)}`,
    title,
    team1: t1,
    team2: t2,
    sport,
    status: m.status || "live",
    match_time: m.match_time || "21:00",
    matched_amount: m.matched_amount || "2,095,266",
    back_odds: m.back_odds || m.odds || 2.1,
    lay_odds: m.lay_odds || 2.14,
    back_odds2: m.back_odds2 || 2.5,
    lay_odds2: m.lay_odds2 || 2.54,
  };
}

function synthesizeMatch(titleOrId: string): CatalogMatch {
  let cleanTitle = titleOrId;
  // If title has market attached, like "Bogota v Barranquilla / Match Odds"
  if (cleanTitle.includes("/")) {
    cleanTitle = cleanTitle.split("/")[0].trim();
  }

  const parts = cleanTitle.split(/ vs | v | V /i);
  const team1 = parts[0]?.trim() || "Team 1";
  const team2 = parts[1]?.trim() || "Team 2";
  const sport = detectSportFromText(cleanTitle);

  return {
    id: `dyn-${normalizeString(cleanTitle)}`,
    title: `${team1} v ${team2}`,
    team1,
    team2,
    sport,
    status: "live",
    match_time: "21:00",
    matched_amount: "2,095,266",
    odds: 2.1,
    back_odds: 2.1,
    lay_odds: 2.14,
    back_odds2: 2.5,
    lay_odds2: 2.54,
  };
}
