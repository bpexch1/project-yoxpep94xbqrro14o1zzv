const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BASE = 'https://betfair-orbitexch-data.p.rapidapi.com';
const FALLBACK_BASE = 'https://betfair-exchange.p.rapidapi.com';

const mapSportId = (id: string) => {
  switch (id) {
    case '1': return 'Soccer';
    case '2': return 'Tennis';
    case '4': return 'Cricket';
    case '7': return 'Horse Racing';
    case '4339': return 'Greyhound Racing';
    default: return 'Other';
  }
};

const parseTeams = (name: string) => {
  if (name.includes(' v ')) {
    const parts = name.split(' v ');
    return { team1: parts[0].trim(), team2: parts[1].trim() };
  }
  return { team1: name, team2: '' };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const rapidApiKey = Deno.env.get('BETFAIR_RAPIDAPI_KEY');
  if (!rapidApiKey) {
    console.error('[fetch-betfair-events] BETFAIR_RAPIDAPI_KEY not set!');
    return new Response(JSON.stringify({ error: 'API key not set', events: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('[fetch-betfair-events] Starting event fetch...');

  // =============================================
  // APPROACH 1: OrbitExch API - try multiple list endpoints
  // =============================================
  const orbitEndpoints = [
    '/betfair/list_events',
    '/betfair/get_events',
    '/betfair/inplay_events',
    '/betfair/events',
    '/betfair/live',
    '/betfair/inplay',
  ];

  const orbitHeaders = {
    'x-rapidapi-key': rapidApiKey,
    'x-rapidapi-host': 'betfair-orbitexch-data.p.rapidapi.com',
  };

  for (const endpoint of orbitEndpoints) {
    try {
      console.log(`[fetch-betfair-events] Trying OrbitExch: ${endpoint}`);
      const res = await fetch(`${BASE}${endpoint}`, { method: 'GET', headers: orbitHeaders });
      console.log(`[fetch-betfair-events] Response status for ${endpoint}: ${res.status}`);
      
      if (res.ok) {
        const raw = await res.json();
        console.log(`[fetch-betfair-events] Got data from ${endpoint}:`, JSON.stringify(raw).substring(0, 500));
        
        // Try to parse as array of events or as object containing events array
        const events = Array.isArray(raw) ? raw 
          : (raw?.events || raw?.data || raw?.result || raw?.markets || []);
        
        if (events.length > 0) {
          console.log(`[fetch-betfair-events] Found ${events.length} events via OrbitExch ${endpoint}`);
          
          const mapped = events.map((item: any) => {
            const name = item.event?.name || item.name || item.title || item.eventName || '';
            const teams = parseTeams(name);
            const sportId = item.eventType?.id || item.sport_id || item.sportId || '0';
            const eventId = item.event?.id || item.id || item.eventId || '';
            
            return {
              id: `bf-${item.marketId || item.id || item.event?.id || Math.random()}`,
              betfair_event_id: String(eventId),
              title: name,
              team1: teams.team1,
              team2: teams.team2,
              sport: typeof sportId === 'string' && sportId.length <= 5 ? mapSportId(sportId) : (item.sport || item.eventTypeName || 'Cricket'),
              status: item.inPlay || item.status === 'live' || item.inplay ? 'live' : 'upcoming',
              match_time: item.marketStartTime || item.startTime || item.openDate || '',
              back_odds: item.backOdds || 1.9,
              lay_odds: item.layOdds || 2.0,
              back_odds2: item.backOdds2 || 1.9,
              lay_odds2: item.layOdds2 || 2.0,
              source: 'betfair',
            };
          });
          
          return new Response(JSON.stringify(mapped), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (err: any) {
      console.log(`[fetch-betfair-events] Error on ${endpoint}: ${err.message}`);
    }
  }

  // =============================================
  // APPROACH 2: Betfair Exchange JSON-RPC (fallback)
  // =============================================
  console.log('[fetch-betfair-events] OrbitExch endpoints failed, trying Betfair Exchange JSON-RPC...');
  
  try {
    const rpcResponse = await fetch('https://betfair-exchange.p.rapidapi.com/json/rpc/public/json-rpc/latest/', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'betfair-exchange.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'SportsAPING/v1.0/listMarketCatalogue',
        params: {
          filter: {
            eventTypeIds: ['1', '2', '4', '7', '4339'],
            inPlayOnly: true,
          },
          marketProjection: ['EVENT', 'EVENT_TYPE', 'MARKET_START_TIME'],
          maxResults: '100',
        },
        id: 1,
      }),
    });

    console.log(`[fetch-betfair-events] Betfair Exchange RPC status: ${rpcResponse.status}`);
    const rpcData = await rpcResponse.json();
    let markets = rpcData.result || [];

    if (!markets.length) {
      // Try without inPlayOnly
      const r2 = await fetch('https://betfair-exchange.p.rapidapi.com/json/rpc/public/json-rpc/latest/', {
        method: 'POST',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'betfair-exchange.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'SportsAPING/v1.0/listMarketCatalogue',
          params: {
            filter: { eventTypeIds: ['1', '2', '4'] },
            marketProjection: ['EVENT', 'EVENT_TYPE', 'MARKET_START_TIME'],
            maxResults: '100',
          },
          id: 1,
        }),
      });
      const d2 = await r2.json();
      markets = d2.result || [];
    }

    console.log(`[fetch-betfair-events] Betfair Exchange returned ${markets.length} markets`);

    if (markets.length) {
      const mapped = markets.map((market: any) => {
        const eventName = market.event?.name || '';
        const teams = parseTeams(eventName);
        return {
          id: `bf-${market.marketId}`,
          betfair_event_id: market.event?.id || '',
          title: eventName,
          team1: teams.team1,
          team2: teams.team2,
          sport: mapSportId(market.eventType?.id || '0'),
          status: market.inPlay ? 'live' : 'upcoming',
          match_time: market.marketStartTime || '',
          back_odds: 1.9,
          lay_odds: 2.0,
          back_odds2: 1.9,
          lay_odds2: 2.0,
          totalMatched: Math.floor(market.totalMatched || 0),
          source: 'betfair',
        };
      });
      
      return new Response(JSON.stringify(mapped), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (err: any) {
    console.error('[fetch-betfair-events] Betfair Exchange RPC also failed:', err.message);
  }

  // =============================================
  // APPROACH 3: listEvents fallback
  // =============================================
  try {
    const evRes = await fetch('https://betfair-exchange.p.rapidapi.com/json/rpc/public/json-rpc/latest/', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'betfair-exchange.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'SportsAPING/v1.0/listEvents',
        params: { filter: { eventTypeIds: ['1', '2', '4'] } },
        id: 1,
      }),
    });
    const evData = await evRes.json();
    const events = evData.result || [];
    console.log(`[fetch-betfair-events] listEvents returned ${events.length} events`);
    
    if (events.length) {
      const mapped = events.map((item: any) => {
        const name = item.event?.name || '';
        const teams = parseTeams(name);
        return {
          id: `bf-${item.event?.id}`,
          betfair_event_id: item.event?.id || '',
          title: name,
          team1: teams.team1,
          team2: teams.team2,
          sport: mapSportId(item.eventType?.id || '0'),
          status: 'upcoming',
          match_time: item.event?.openDate || '',
          back_odds: 1.9,
          lay_odds: 2.0,
          source: 'betfair',
        };
      });
      return new Response(JSON.stringify(mapped), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err: any) {
    console.error('[fetch-betfair-events] listEvents also failed:', err.message);
  }

  console.log('[fetch-betfair-events] All approaches failed, returning empty array');
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
