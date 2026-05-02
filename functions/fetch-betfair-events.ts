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
  if (name.includes(' - ')) {
    const [t1, t2] = name.split(' - ');
    return { team1: t1.trim(), team2: t2.trim() };
  }
  return { team1: name, team2: '' };
};

const mapSportLabel = (sport: string): string => {
  const s = sport.toLowerCase();
  if (s.includes('soccer') || s.includes('football')) return 'Soccer';
  if (s.includes('tennis')) return 'Tennis';
  if (s.includes('cricket')) return 'Cricket';
  if (s.includes('basket')) return 'Basketball';
  if (s.includes('ice') || s.includes('hockey')) return 'Ice Hockey';
  if (s.includes('volleyball')) return 'Volleyball';
  if (s.includes('baseball')) return 'Baseball';
  return sport.charAt(0).toUpperCase() + sport.slice(1);
};

const extractEvents = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  return raw?.events || raw?.data || raw?.result || 
         raw?.matches || raw?.eventList || raw?.items || [];
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const rapidApiKey = Deno.env.get('BETFAIR_RAPIDAPI_KEY');
  if (!rapidApiKey) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const h = {
    'x-rapidapi-key': rapidApiKey,
    'x-rapidapi-host': 'betfair-orbitexch-data.p.rapidapi.com',
    'Content-Type': 'application/json',
  };

  // ============================================================
  // STEP 1: Call GET /betfair/get_sports to discover sport names
  // ============================================================
  let availableSports: string[] = [];
  
  try {
    const sportsRes = await fetch(`${BASE}/betfair/get_sports`, { headers: h });
    console.log(`[fetch-betfair-events] get_sports status: ${sportsRes.status}`);
    
    if (sportsRes.ok) {
      const sportsRaw = await sportsRes.json();
      console.log(`[fetch-betfair-events] get_sports raw: ${JSON.stringify(sportsRaw).substring(0, 500)}`);
      
      // Extract sport names from various formats
      const sportsList = Array.isArray(sportsRaw) ? sportsRaw 
        : (sportsRaw?.sports || sportsRaw?.data || sportsRaw?.result || []);
      
      availableSports = sportsList
        .map((s: any) => s?.sport || s?.name || s?.sportName || s?.id || s)
        .filter((s: any) => typeof s === 'string' && s.length > 0)
        .map((s: string) => s.toLowerCase());
      
      console.log(`[fetch-betfair-events] Available sports: ${JSON.stringify(availableSports)}`);
    }
  } catch (e: any) {
    console.log(`[fetch-betfair-events] get_sports error: ${e.message}`);
  }

  // ============================================================
  // STEP 2: Determine which sport names to fetch
  // Based on API docs, these are the inplay sports available
  // ============================================================
  const targetSports = ['soccer', 'tennis', 'cricket', 'basketball'];
  
  // If we got available sports, filter to what's supported. Otherwise try all.
  const sportsToFetch = availableSports.length > 0
    ? targetSports.filter(s => availableSports.some(a => a.includes(s) || s.includes(a)))
    : targetSports;
  
  // Always include soccer and tennis at minimum
  const finalSports = sportsToFetch.length > 0 ? sportsToFetch : ['soccer', 'tennis'];
  console.log(`[fetch-betfair-events] Sports to fetch: ${JSON.stringify(finalSports)}`);

  // ============================================================
  // STEP 3: Try GET /betfair/get_sport_events?sport={name}
  // ============================================================
  const allEvents: any[] = [];
  
  // Also try different param names in case 'sport' doesn't work
  const paramNamesToTry = ['sport', 'sportName', 'sport_name', 'name', 'type'];
  let workingParamName = 'sport'; // default
  
  // First test with soccer to find working param name
  let foundWorkingParam = false;
  for (const paramName of paramNamesToTry) {
    try {
      const testUrl = `${BASE}/betfair/get_sport_events?${paramName}=soccer`;
      console.log(`[fetch-betfair-events] Testing param: GET ${testUrl}`);
      const res = await fetch(testUrl, { headers: h });
      console.log(`[fetch-betfair-events] Param test ${paramName} status: ${res.status}`);
      
      if (res.ok) {
        const raw = await res.json();
        console.log(`[fetch-betfair-events] Param test ${paramName} raw: ${JSON.stringify(raw).substring(0, 400)}`);
        const events = extractEvents(raw);
        
        if (events.length > 0) {
          workingParamName = paramName;
          foundWorkingParam = true;
          console.log(`[fetch-betfair-events] Working param found: ${paramName}`);
          
          // Add soccer events
          for (const item of events) {
            allEvents.push({ ...item, _detectedSport: 'Soccer' });
          }
          break;
        }
      }
    } catch (e: any) {
      console.log(`[fetch-betfair-events] Param ${paramName} error: ${e.message}`);
    }
  }
  
  // If found working param, fetch remaining sports
  if (foundWorkingParam) {
    const remainingSports = finalSports.filter(s => s !== 'soccer');
    
    const sportResults = await Promise.allSettled(
      remainingSports.map(sport =>
        fetch(`${BASE}/betfair/get_sport_events?${workingParamName}=${sport}`, { headers: h })
          .then(r => r.ok ? r.json() : [])
          .then(raw => {
            const events = extractEvents(raw);
            console.log(`[fetch-betfair-events] ${sport}: ${events.length} events`);
            return events.map((e: any) => ({ ...e, _detectedSport: mapSportLabel(sport) }));
          })
          .catch(e => { console.log(`Sport ${sport} error: ${e.message}`); return []; })
      )
    );
    
    for (const r of sportResults) {
      if (r.status === 'fulfilled') allEvents.push(...r.value);
    }
  } else {
    // No param worked — try path-based or no-param
    console.log(`[fetch-betfair-events] No query param worked, trying path-based`);
    
    try {
      // Try path: /betfair/get_sport_events/soccer
      const res = await fetch(`${BASE}/betfair/get_sport_events/soccer`, { headers: h });
      console.log(`[fetch-betfair-events] Path-based status: ${res.status}`);
      
      if (res.ok) {
        const raw = await res.json();
        console.log(`[fetch-betfair-events] Path-based raw: ${JSON.stringify(raw).substring(0, 400)}`);
        const events = extractEvents(raw);
        if (events.length > 0) {
          allEvents.push(...events.map((e: any) => ({ ...e, _detectedSport: 'Soccer' })));
        }
      }
    } catch (e: any) {
      console.log(`[fetch-betfair-events] Path-based error: ${e.message}`);
    }

    // Last resort: no params (returns all)
    if (allEvents.length === 0) {
      try {
        const res = await fetch(`${BASE}/betfair/get_sport_events`, { headers: h });
        console.log(`[fetch-betfair-events] No-param status: ${res.status}`);
        
        if (res.ok) {
          const raw = await res.json();
          console.log(`[fetch-betfair-events] No-param raw: ${JSON.stringify(raw).substring(0, 600)}`);
          allEvents.push(...extractEvents(raw));
        }
      } catch (e: any) {
        console.log(`[fetch-betfair-events] No-param error: ${e.message}`);
      }
    }
  }

  // ============================================================
  // STEP 4: Map to our standard event format
  // ============================================================
  const mapped = allEvents.map((item: any) => {
    const name = item.event?.name || item.eventName || item.name 
              || item.title || item.matchName || item.event_name || '';
    const teams = parseTeams(name);
    const eventId = item.event?.id || item.eventId || item.event_id 
                  || item.id || item.marketId || '';
    const rawSport = item._detectedSport || item.eventType?.name 
                   || item.sport || item.sportName || 'Soccer';
    const isLive = item.inPlay === true || item.inplay === true 
                || item.in_play === true || item.status === 'OPEN'
                || item.status === 'live' || item.isInPlay === true;

    return {
      id: `bf-${eventId || Math.random().toString(36).slice(2)}`,
      betfair_event_id: String(eventId),
      title: name,
      team1: teams.team1,
      team2: teams.team2,
      sport: mapSportLabel(rawSport),
      status: isLive ? 'live' : 'upcoming',
      match_time: item.marketStartTime || item.startTime 
               || item.openDate || item.event?.openDate 
               || item.matchTime || '',
      back_odds: 1.9,
      lay_odds: 2.0,
      back_odds2: 1.9,
      lay_odds2: 2.0,
      source: 'betfair',
    };
  }).filter((e: any) => e.title && e.betfair_event_id && e.betfair_event_id !== 'undefined');

  console.log(`[fetch-betfair-events] Final result: ${mapped.length} events`);

  return new Response(JSON.stringify(mapped), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
