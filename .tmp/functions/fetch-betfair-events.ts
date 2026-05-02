const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BASE = 'https://betfair-orbitexch-data.p.rapidapi.com';

const parseTeams = (name: string) => {
  if (name.includes(' v ')) {
    const [t1, t2] = name.split(' v ');
    return { team1: t1.trim(), team2: t2.trim() };
  }
  if (name.includes(' vs ')) {
    const [t1, t2] = name.split(' vs ');
    return { team1: t1.trim(), team2: t2.trim() };
  }
  return { team1: name, team2: '' };
};

function normalizeSport(input: string | undefined): string {
  const s = (input || '').toLowerCase();
  if (s.includes('cricket')) return 'Cricket';
  if (s.includes('soccer') || s.includes('football')) return 'Soccer';
  if (s.includes('tennis')) return 'Tennis';
  if (s.includes('basket')) return 'Basketball';
  if (s.includes('hockey') || s.includes('ice')) return 'Ice Hockey';
  if (s.includes('horse')) return 'Horse Racing';
  if (s === '1') return 'Soccer';
  if (s === '2') return 'Tennis';
  if (s === '4') return 'Cricket';
  return input || 'Other';
}

function mapEvents(list: any[], defaultSport: string): any[] {
  return list.map((item: any) => {
    const name = item.event?.name || item.eventName || item.name
              || item.title || item.event_name || item.matchName
              || (item.home_team && item.away_team ? `${item.home_team} v ${item.away_team}` : '');
    
    const parsedName = name || (item.home_team && item.away_team 
      ? `${item.home_team} v ${item.away_team}` : '');
    
    const teams = parsedName.includes(' v ') 
      ? { team1: parsedName.split(' v ')[0].trim(), team2: parsedName.split(' v ')[1].trim() }
      : parsedName.includes(' vs ')
      ? { team1: parsedName.split(' vs ')[0].trim(), team2: parsedName.split(' vs ')[1].trim() }
      : { team1: item.home_team || parsedName, team2: item.away_team || '' };

    const eventId = item.event?.id || item.eventId || item.event_id
                  || item.id || item.event?.eventId || item.ev_id || '';
    
    const sport = item.eventType?.name || item.sport || item.sportName
               || item.category || defaultSport;

    const isLive = item.inPlay === true || item.inplay === true
                || item.in_play === true || item.status === 'live'
                || item.status === 'OPEN' || item.isInPlay === true
                || item.live === true;

    const marketId = item.marketId || item.market_id || `ev-${eventId}`;

    // Get back/lay odds if already in the response
    const backOdds = item.back?.[0]?.price || item.availableToBack?.[0]?.price 
                   || item.backOdds || item.backPrice || 1.9;
    const layOdds = item.lay?.[0]?.price || item.availableToLay?.[0]?.price 
                  || item.layOdds || item.layPrice || 2.0;

    return {
      id: `bf-${marketId || eventId}`,
      betfair_event_id: String(eventId),
      title: parsedName,
      team1: teams.team1,
      team2: teams.team2,
      sport: normalizeSport(sport),
      status: isLive ? 'live' : 'upcoming',
      match_time: item.marketStartTime || item.startTime
               || item.openDate || item.event?.openDate
               || item.matchTime || item.open_date || '',
      back_odds: typeof backOdds === 'number' ? backOdds : parseFloat(backOdds) || 1.9,
      lay_odds: typeof layOdds === 'number' ? layOdds : parseFloat(layOdds) || 2.0,
      back_odds2: 1.9,
      lay_odds2: 2.0,
      source: 'betfair',
    };
  }).filter((e: any) => 
    e.betfair_event_id && 
    e.betfair_event_id !== 'undefined' && 
    e.betfair_event_id !== '' &&
    e.title
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const rapidApiKey = Deno.env.get('BETFAIR_RAPIDAPI_KEY');
  if (!rapidApiKey) {
    console.error('[fetch-betfair-events] BETFAIR_RAPIDAPI_KEY not set!');
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const h: Record<string, string> = {
    'x-rapidapi-key': rapidApiKey,
    'x-rapidapi-host': 'betfair-orbitexch-data.p.rapidapi.com',
    'Content-Type': 'application/json',
  };

  // =============================================
  // STEP 1: Get available sports via get_sports
  // =============================================
  let sportIds: { id: string; name: string }[] = [];

  try {
    console.log('[fetch-betfair-events] Calling GET /betfair/get_sports');
    const sportsRes = await fetch(`${BASE}/betfair/get_sports`, { headers: h });
    console.log(`[fetch-betfair-events] get_sports status: ${sportsRes.status}`);

    if (sportsRes.ok) {
      const sportsRaw = await sportsRes.json();
      console.log('[fetch-betfair-events] get_sports raw:', JSON.stringify(sportsRaw).substring(0, 600));

      // Parse sports list - handle various response shapes
      const sportsList = Array.isArray(sportsRaw) ? sportsRaw
        : (sportsRaw?.sports || sportsRaw?.data || sportsRaw?.result || []);

      if (sportsList.length > 0) {
        sportIds = sportsList.map((s: any) => ({
          id: String(s.id || s.sport_id || s.eventTypeId || s.sportId || ''),
          name: s.name || s.sport_name || s.sportName || s.eventTypeName || String(s.id || ''),
        })).filter((s: any) => s.id);

        console.log('[fetch-betfair-events] Found sports:', JSON.stringify(sportIds));
      }
    }
  } catch (e: any) {
    console.log(`[fetch-betfair-events] get_sports error: ${e.message}`);
  }

  // If get_sports failed, use known sport IDs for this API
  // This API supports: soccer(1), tennis(2), basketball(7522), icehockey(7524), volleyball, baseball
  if (sportIds.length === 0) {
    sportIds = [
      { id: '1', name: 'Soccer' },
      { id: '2', name: 'Tennis' },
      { id: '7522', name: 'Basketball' },
      { id: '7524', name: 'Ice Hockey' },
    ];
    console.log('[fetch-betfair-events] Using fallback sport IDs');
  }

  // =============================================
  // STEP 2: Get events for each sport
  // =============================================
  
  // Try multiple param formats for get_sport_events
  // The RapidAPI page shows Params(1) - could be: sport_id, id, sport, eventTypeId, sportId
  const paramFormatsToTry = [
    (id: string, _name: string) => `${BASE}/betfair/get_sport_events?sport_id=${id}`,
    (id: string, _name: string) => `${BASE}/betfair/get_sport_events?id=${id}`,
    (_id: string, name: string) => `${BASE}/betfair/get_sport_events?sport=${name.toLowerCase()}`,
    (id: string, _name: string) => `${BASE}/betfair/get_sport_events?eventTypeId=${id}`,
    (id: string, _name: string) => `${BASE}/betfair/get_sport_events/${id}`,
    (_id: string, name: string) => `${BASE}/betfair/get_sport_events/${name.toLowerCase()}`,
    (id: string, _name: string) => `${BASE}/betfair/get_sport_events?sportId=${id}`,
  ];

  // Try with first sport (soccer, id=1) to find which format works
  const testSport = sportIds[0];
  let workingUrlFn: ((id: string, name: string) => string) | null = null;

  for (const urlFn of paramFormatsToTry) {
    const testUrl = urlFn(testSport.id, testSport.name);
    try {
      console.log(`[fetch-betfair-events] Testing: GET ${testUrl}`);
      const res = await fetch(testUrl, { headers: h });
      console.log(`[fetch-betfair-events] Status: ${res.status}`);

      if (res.ok) {
        const raw = await res.json();
        console.log(`[fetch-betfair-events] Raw: ${JSON.stringify(raw).substring(0, 500)}`);

        const list = Array.isArray(raw) ? raw
          : (raw?.events || raw?.data || raw?.result || raw?.markets 
             || raw?.competitions || raw?.eventList || []);

        if (list.length > 0) {
          workingUrlFn = urlFn;
          console.log(`[fetch-betfair-events] WORKING FORMAT: ${testUrl} → ${list.length} events`);
          break;
        } else if (Array.isArray(raw) && raw.length === 0) {
          // Empty array means format is correct but no live events for this sport right now
          workingUrlFn = urlFn;
          console.log(`[fetch-betfair-events] FORMAT OK but no events for ${testSport.name}: ${testUrl}`);
          break;
        }
      }
    } catch (e: any) {
      console.log(`[fetch-betfair-events] Error: ${e.message}`);
    }
  }

  if (!workingUrlFn) {
    console.log('[fetch-betfair-events] Could not find working URL format, trying no-param endpoint');
    // Last resort: try with no params (returns all inplay)
    try {
      const res = await fetch(`${BASE}/betfair/get_sport_events`, { headers: h });
      if (res.ok) {
        const raw = await res.json();
        console.log(`[fetch-betfair-events] No-param raw: ${JSON.stringify(raw).substring(0, 600)}`);
        
        const list = Array.isArray(raw) ? raw
          : (raw?.events || raw?.data || raw?.result || []);
        
        if (list.length > 0) {
          const mapped = mapEvents(list, 'Other');
          return new Response(JSON.stringify(mapped), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e: any) {
      console.log(`[fetch-betfair-events] No-param error: ${e.message}`);
    }
    
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch all sports in parallel
  const sportResults = await Promise.allSettled(
    sportIds.map(async (sport) => {
      const url = workingUrlFn!(sport.id, sport.name);
      try {
        const res = await fetch(url, { headers: h });
        if (!res.ok) return [];
        const raw = await res.json();
        const list = Array.isArray(raw) ? raw
          : (raw?.events || raw?.data || raw?.result || raw?.markets || raw?.eventList || []);
        const mapped = mapEvents(list, sport.name);
        console.log(`[fetch-betfair-events] ${sport.name} (${sport.id}): ${mapped.length} events`);
        return mapped;
      } catch {
        return [];
      }
    })
  );

  const allEvents = sportResults.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  console.log(`[fetch-betfair-events] Total events: ${allEvents.length}`);

  return new Response(JSON.stringify(allEvents), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
