

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BASE = 'https://betfair-orbitexch-data.p.rapidapi.com';

const parseTeams = (name: string) => {
  for (const sep of [' v ', ' vs ', ' - ']) {
    if (name.includes(sep)) {
      const [t1, t2] = name.split(sep);
      return { team1: t1.trim(), team2: t2.trim() };
    }
  }
  return { team1: name, team2: '' };
};

const mapSport = (s: string): string => {
  const l = (s || '').toLowerCase();
  if (l.includes('soccer') || l.includes('football')) return 'Soccer';
  if (l.includes('tennis')) return 'Tennis';
  if (l.includes('cricket')) return 'Cricket';
  if (l === '1') return 'Soccer';
  if (l === '2') return 'Tennis';
  if (l === '4') return 'Cricket';
  return '';
};

const extractList = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  return raw?.events || raw?.data || raw?.result || raw?.matches || raw?.eventList || [];
};

const fetchSport = async (url: string, headers: any, sportLabel: string): Promise<any[]> => {
  try {
    const res = await fetch(url, { headers });
    console.log(`[BFE] GET ${url} → ${res.status}`);
    if (!res.ok) return [];
    const raw = await res.json();
    console.log(`[BFE] ${url} raw: ${JSON.stringify(raw).substring(0, 300)}`);
    return extractList(raw).map((e: any) => ({ ...e, _sport: sportLabel }));
  } catch (err: any) {
    console.log(`[BFE] ${url} error: ${err.message}`);
    return [];
  }
};

function mapAll(events: any[]): any[] {
  return events
    .map((item: any) => {
      const name = item.event?.name || item.eventName || item.name 
                || item.title || item.matchName || item.event_name || '';
      if (!name) return null;

      const teams = parseTeams(name);
      const eventId = item.event?.id || item.eventId || item.event_id 
                    || item.id || item.marketId || '';
      const rawSport = item._sport || item.eventType?.name || item.sport || item.sportName || '';
      const isLive = item.inPlay === true || item.inplay === true 
                  || item.in_play === true || item.status === 'OPEN'
                  || item.status === 'live' || item.isInPlay === true;

      // Extract real odds if available
      const backOdds = item.back?.[0]?.price || item.availableToBack?.[0]?.price 
                     || item.backPrice || item.back_odds || 1.9;
      const layOdds = item.lay?.[0]?.price || item.availableToLay?.[0]?.price 
                    || item.layPrice || item.lay_odds || 2.0;

      return {
        id: `bf-${eventId || Math.random().toString(36).slice(2, 9)}`,
        betfair_event_id: String(eventId),
        title: name,
        team1: teams.team1,
        team2: teams.team2,
        sport: mapSport(rawSport),
        status: isLive ? 'live' : 'upcoming',
        match_time: item.marketStartTime || item.startTime
                 || item.openDate || item.event?.openDate
                 || item.matchTime || new Date().toISOString(),
        back_odds: Number(backOdds) || 1.9,
        lay_odds: Number(layOdds) || 2.0,
        back_odds2: 1.9,
        lay_odds2: 2.0,
        source: 'betfair',
      };
    })
    .filter((e): e is NonNullable<typeof e> => 
      !!e && !!e.title && !!e.betfair_event_id && e.betfair_event_id !== 'undefined' && !!e.sport
    );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const rapidApiKey = Deno.env.get('BETFAIR_RAPIDAPI_KEY');
  if (!rapidApiKey) {
    console.log('[BFE] No API key set');
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const h = {
    'x-rapidapi-key': rapidApiKey,
    'x-rapidapi-host': 'betfair-orbitexch-data.p.rapidapi.com',
  };

  // ============================================================
  // STRATEGY: Try path-based first (matches get_event_with_markets pattern)
  // then fall back to query param, then no-param (returns all sports)
  // Only 4 API calls total — stay within free tier limits
  // ============================================================

  // Try 1: Path-based with sport name → /betfair/get_sport_events/soccer
  const testPath = await fetchSport(`${BASE}/betfair/get_sport_events/soccer`, h, 'Soccer');
  
  if (testPath.length > 0) {
    console.log('[BFE] Path-based format works');
    // Fetch soccer + tennis + cricket in parallel (3 calls)
    const [soccerEvents, tennisEvents, cricketEvents] = await Promise.all([
      Promise.resolve(testPath), // already have soccer
      fetchSport(`${BASE}/betfair/get_sport_events/tennis`, h, 'Tennis'),
      fetchSport(`${BASE}/betfair/get_sport_events/cricket`, h, 'Cricket'),
    ]);
    
    const allEvents = [...soccerEvents, ...tennisEvents, ...cricketEvents];
    return new Response(JSON.stringify(mapAll(allEvents)), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Try 2: Path-based with sport ID → /betfair/get_sport_events/1 (Betfair: 1=soccer, 2=tennis, 4=cricket)
  const testPathId = await fetchSport(`${BASE}/betfair/get_sport_events/1`, h, 'Soccer');
  
  if (testPathId.length > 0) {
    console.log('[BFE] Path-based ID format works');
    const [soccerEvents, tennisEvents, cricketEvents] = await Promise.all([
      Promise.resolve(testPathId),
      fetchSport(`${BASE}/betfair/get_sport_events/2`, h, 'Tennis'),
      fetchSport(`${BASE}/betfair/get_sport_events/4`, h, 'Cricket'),
    ]);
    
    const allEvents = [...soccerEvents, ...tennisEvents, ...cricketEvents];
    return new Response(JSON.stringify(mapAll(allEvents)), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Try 3: Query param → /betfair/get_sport_events?sport=soccer
  const testQuery = await fetchSport(`${BASE}/betfair/get_sport_events?sport=soccer`, h, 'Soccer');
  
  if (testQuery.length > 0) {
    console.log('[BFE] Query param format works');
    const [soccerEvents, tennisEvents, cricketEvents] = await Promise.all([
      Promise.resolve(testQuery),
      fetchSport(`${BASE}/betfair/get_sport_events?sport=tennis`, h, 'Tennis'),
      fetchSport(`${BASE}/betfair/get_sport_events?sport=cricket`, h, 'Cricket'),
    ]);
    
    const allEvents = [...soccerEvents, ...tennisEvents, ...cricketEvents];
    return new Response(JSON.stringify(mapAll(allEvents)), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Try 4: No params (returns ALL inplay sports at once — 1 API call)
  console.log('[BFE] All format attempts failed, trying no-param');
  const noParamEvents = await fetchSport(`${BASE}/betfair/get_sport_events`, h, 'Soccer');
  
  if (noParamEvents.length > 0) {
    return new Response(JSON.stringify(mapAll(noParamEvents)), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Final fallback: empty (DB matches will still show on dashboard)
  console.log('[BFE] All attempts failed — returning empty array');
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
