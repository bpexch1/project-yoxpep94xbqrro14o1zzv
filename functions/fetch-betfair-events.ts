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

const normalizeSport = (input: string | undefined): string => {
  const s = (input || '').toLowerCase();
  if (s.includes('cricket')) return 'Cricket';
  if (s.includes('soccer') || s.includes('football')) return 'Soccer';
  if (s.includes('tennis')) return 'Tennis';
  if (s.includes('horse')) return 'Horse Racing';
  if (s.includes('grey') || s.includes('greyhound')) return 'Greyhound Racing';
  return input || 'Other';
};

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

  const headers = {
    'x-rapidapi-key': rapidApiKey,
    'x-rapidapi-host': 'betfair-orbitexch-data.p.rapidapi.com',
  };

  // Sport IDs to fetch: Cricket=4, Soccer=1, Tennis=2
  const sportIds = ['4', '1', '2'];
  // Try multiple query param name formats
  const paramNames = ['sport_id', 'eventTypeId', 'sportId', 'id', 'type'];

  let allEvents: any[] = [];

  // ===== APPROACH 1: get_sport_events with various param formats =====
  let workingParam: string | null = null;

  // First, try to find which param name works
  for (const paramName of paramNames) {
    try {
      const url = `${BASE}/betfair/get_sport_events?${paramName}=4`;
      console.log(`[fetch-betfair-events] Trying: GET ${url}`);
      const res = await fetch(url, { headers });
      console.log(`[fetch-betfair-events] Status: ${res.status}`);
      
      if (res.ok) {
        const raw = await res.json();
        console.log(`[fetch-betfair-events] Raw (first 300): ${JSON.stringify(raw).substring(0, 300)}`);
        
        // Check if we got actual event data
        const list = Array.isArray(raw) ? raw 
          : (raw?.events || raw?.data || raw?.result || raw?.markets || raw?.competitions || []);
        
        if (list.length > 0) {
          workingParam = paramName;
          console.log(`[fetch-betfair-events] Found working param: ${paramName}, got ${list.length} events`);
          break;
        }
      }
    } catch (e: any) {
      console.log(`[fetch-betfair-events] Param ${paramName} error: ${e.message}`);
    }
  }

  // If no param works, try without params (might return all sports)
  if (!workingParam) {
    try {
      const url = `${BASE}/betfair/get_sport_events`;
      console.log(`[fetch-betfair-events] Trying without params: GET ${url}`);
      const res = await fetch(url, { headers });
      
      if (res.ok) {
        const raw = await res.json();
        console.log(`[fetch-betfair-events] No-params raw (first 500): ${JSON.stringify(raw).substring(0, 500)}`);
        const list = Array.isArray(raw) ? raw 
          : (raw?.events || raw?.data || raw?.result || raw?.markets || raw?.competitions || []);
        
        if (list.length > 0) {
          allEvents = list;
          console.log(`[fetch-betfair-events] No-params returned ${allEvents.length} total events`);
        }
      }
    } catch (e: any) {
      console.log(`[fetch-betfair-events] No-params error: ${e.message}`);
    }
  } else {
    // Fetch all 3 sports in parallel using the working param
    const results = await Promise.allSettled(
      sportIds.map(id =>
        fetch(`${BASE}/betfair/get_sport_events?${workingParam}=${id}`, { headers })
          .then(r => r.json())
          .then(raw => {
            const list = Array.isArray(raw) ? raw 
              : (raw?.events || raw?.data || raw?.result || raw?.markets || []);
            console.log(`[fetch-betfair-events] Sport ${id}: ${list.length} events`);
            return list;
          })
      )
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allEvents = allEvents.concat(result.value || []);
      }
    }
  }

  // ===== Map events to our standard format =====
  if (allEvents.length > 0) {
    const mapped = allEvents.map((item: any) => {
      // Extract event name from various possible fields
      const name = item.event?.name || item.eventName || item.name || item.title || item.event_name || '';
      const teams = parseTeams(name);
      
      // Extract event ID (used for get_event_with_markets)
      const eventId = item.event?.id || item.eventId || item.event_id || item.id || '';
      
      // Extract sport
      const sport = item.eventType?.name || item.sport || item.sportName || item.event_type || '';
      const sportId = item.eventType?.id || item.sportId || item.sport_id || '';
      const normalizedSport = normalizeSport(sport || sportId);
      
      // Extract status
      const isLive = item.inPlay === true || item.inplay === true || item.status === 'live' || item.status === 'OPEN';
      
      // Extract market ID
      const marketId = item.marketId || item.market_id || `event-${eventId}`;
      
      return {
        id: `bf-${marketId || eventId}`,
        betfair_event_id: String(eventId),
        title: name,
        team1: teams.team1,
        team2: teams.team2,
        sport: normalizedSport,
        status: isLive ? 'live' : 'upcoming',
        match_time: item.marketStartTime || item.startTime || item.openDate || item.event?.openDate || '',
        back_odds: 1.9,
        lay_odds: 2.0,
        back_odds2: 1.9,
        lay_odds2: 2.0,
        totalMatched: item.totalMatched || 0,
        source: 'betfair',
      };
    });

    console.log(`[fetch-betfair-events] Returning ${mapped.length} mapped events`);
    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('[fetch-betfair-events] No events found from any approach');
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
