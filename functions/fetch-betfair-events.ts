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
  if (s === '4') return 'Cricket';
  if (s === '1') return 'Soccer';
  if (s === '2') return 'Tennis';
  return input || 'Other';
};

const mapEventsFromResponse = (raw: any, defaultSport: string): any[] => {
  const list = Array.isArray(raw) ? raw
    : (raw?.events || raw?.data || raw?.result || raw?.markets || raw?.competitions
       || raw?.eventList || raw?.event_list || raw?.eventData || []);
  
  return list.map((item: any) => {
    const name = item.event?.name || item.eventName || item.name 
              || item.title || item.event_name || item.matchName || '';
    const teams = parseTeams(name);
    const eventId = item.event?.id || item.eventId || item.event_id 
                  || item.id || item.event?.eventId || '';
    const sport = item.eventType?.name || item.sport || item.sportName 
               || item.eventTypeName || defaultSport;
    const isLive = item.inPlay === true || item.inplay === true 
                || item.in_play === true || item.status === 'live' 
                || item.status === 'OPEN' || item.isInPlay === true;
    const marketId = item.marketId || item.market_id || `ev-${eventId}`;

    return {
      id: `bf-${marketId || eventId}`,
      betfair_event_id: String(eventId),
      title: name,
      team1: teams.team1,
      team2: teams.team2,
      sport: normalizeSport(sport),
      status: isLive ? 'live' : 'upcoming',
      match_time: item.marketStartTime || item.startTime 
               || item.openDate || item.event?.openDate 
               || item.matchTime || '',
      back_odds: 1.9,
      lay_odds: 2.0,
      back_odds2: 1.9,
      lay_odds2: 2.0,
      totalMatched: item.totalMatched || 0,
      source: 'betfair',
    };
  }).filter((e: any) => e.betfair_event_id && e.betfair_event_id !== 'undefined' && e.betfair_event_id !== '');
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

  const h = {
    'x-rapidapi-key': rapidApiKey,
    'x-rapidapi-host': 'betfair-orbitexch-data.p.rapidapi.com',
  };

  // Sport configs: [id, name]
  const sports = [['4', 'Cricket'], ['1', 'Soccer'], ['2', 'Tennis']];
  
  // ===================================================
  // STRATEGY 1: Path-based → /betfair/get_sport_events/{id}
  // e.g. GET /betfair/get_sport_events/4
  // ===================================================
  console.log('[fetch-betfair-events] Trying STRATEGY 1: path-based /betfair/get_sport_events/{id}');
  try {
    const testUrl = `${BASE}/betfair/get_sport_events/4`;
    console.log(`[fetch-betfair-events] Test: GET ${testUrl}`);
    const testRes = await fetch(testUrl, { headers: h });
    console.log(`[fetch-betfair-events] S1 status: ${testRes.status}`);
    
    if (testRes.ok) {
      const testRaw = await testRes.json();
      console.log(`[fetch-betfair-events] S1 raw: ${JSON.stringify(testRaw).substring(0, 400)}`);
      const testList = mapEventsFromResponse(testRaw, 'Cricket');
      
      if (testList.length > 0) {
        // Works! Fetch all sports in parallel
        const results = await Promise.allSettled(
          sports.map(([id, name]) =>
            fetch(`${BASE}/betfair/get_sport_events/${id}`, { headers: h })
              .then(r => r.ok ? r.json() : [])
              .then(raw => {
                const list = mapEventsFromResponse(raw, name);
                console.log(`[fetch-betfair-events] S1 sport ${id} (${name}): ${list.length} events`);
                return list;
              })
              .catch(() => [])
          )
        );
        
        const allEvents = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
        console.log(`[fetch-betfair-events] S1 total: ${allEvents.length} events`);
        
        if (allEvents.length > 0) {
          return new Response(JSON.stringify(allEvents), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }
  } catch (e: any) {
    console.log(`[fetch-betfair-events] S1 error: ${e.message}`);
  }

  // ===================================================
  // STRATEGY 2: Query param → ?sport_id=4 / ?eventTypeId=4 / ?id=4
  // ===================================================
  console.log('[fetch-betfair-events] Trying STRATEGY 2: query params');
  const queryParams = ['sport_id', 'eventTypeId', 'sportId', 'id', 'event_type_id', 'typeId'];
  
  for (const param of queryParams) {
    try {
      const testUrl = `${BASE}/betfair/get_sport_events?${param}=4`;
      console.log(`[fetch-betfair-events] S2 test: GET ${testUrl}`);
      const res = await fetch(testUrl, { headers: h });
      console.log(`[fetch-betfair-events] S2 status: ${res.status}`);
      
      if (res.ok) {
        const raw = await res.json();
        console.log(`[fetch-betfair-events] S2 raw: ${JSON.stringify(raw).substring(0, 400)}`);
        const list = mapEventsFromResponse(raw, 'Cricket');
        
        if (list.length > 0) {
          // Working param found, fetch all sports
          const results = await Promise.allSettled(
            sports.map(([id, name]) =>
              fetch(`${BASE}/betfair/get_sport_events?${param}=${id}`, { headers: h })
                .then(r => r.ok ? r.json() : [])
                .then(raw => mapEventsFromResponse(raw, name))
                .catch(() => [])
            )
          );
          const allEvents = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
          console.log(`[fetch-betfair-events] S2 working param=${param}, total=${allEvents.length}`);
          
          if (allEvents.length > 0) {
            return new Response(JSON.stringify(allEvents), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } catch (e: any) {
      console.log(`[fetch-betfair-events] S2 ${param} error: ${e.message}`);
    }
  }

  // ===================================================
  // STRATEGY 3: No params → returns all sports
  // ===================================================
  console.log('[fetch-betfair-events] Trying STRATEGY 3: no params');
  try {
    const url = `${BASE}/betfair/get_sport_events`;
    const res = await fetch(url, { headers: h });
    console.log(`[fetch-betfair-events] S3 status: ${res.status}`);
    
    if (res.ok) {
      const raw = await res.json();
      console.log(`[fetch-betfair-events] S3 raw: ${JSON.stringify(raw).substring(0, 600)}`);
      const list = mapEventsFromResponse(raw, 'Other');
      
      if (list.length > 0) {
        console.log(`[fetch-betfair-events] S3 got ${list.length} events`);
        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (e: any) {
    console.log(`[fetch-betfair-events] S3 error: ${e.message}`);
  }

  // ===================================================
  // STRATEGY 4: Try alternate endpoint names
  // ===================================================
  const altEndpoints = [
    { url: `${BASE}/betfair/events?sport_id=4`, sport: 'Cricket' },
    { url: `${BASE}/betfair/list_events?sport_id=4`, sport: 'Cricket' },
    { url: `${BASE}/betfair/get_events?sport_id=4`, sport: 'Cricket' },
    { url: `${BASE}/betfair/sport_events/4`, sport: 'Cricket' },
  ];

  for (const ep of altEndpoints) {
    try {
      console.log(`[fetch-betfair-events] S4: GET ${ep.url}`);
      const res = await fetch(ep.url, { headers: h });
      console.log(`[fetch-betfair-events] S4 status: ${res.status}`);
      
      if (res.ok) {
        const raw = await res.json();
        console.log(`[fetch-betfair-events] S4 raw: ${JSON.stringify(raw).substring(0, 400)}`);
        const list = mapEventsFromResponse(raw, ep.sport);
        if (list.length > 0) {
          console.log(`[fetch-betfair-events] S4 working: ${ep.url}, got ${list.length} events`);
          return new Response(JSON.stringify(list), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e: any) {
      console.log(`[fetch-betfair-events] S4 error: ${e.message}`);
    }
  }

  console.log('[fetch-betfair-events] ALL STRATEGIES FAILED — returning empty');
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
