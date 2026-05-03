
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const parseTeams = (name: string) => {
  for (const sep of [' v ', ' vs ', ' - ']) {
    if (name.includes(sep)) {
      const [t1, t2] = name.split(sep);
      return { team1: t1.trim(), team2: t2.trim() };
    }
  }
  return { team1: name, team2: '' };
};

const extractList = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  return raw?.data || raw?.matches || raw?.matchList || raw?.results || raw?.response || raw?.list || [];
};

function mapAll(matches: any[]): any[] {
  return matches
    .map((item: any, index: number) => {
      const name = item.title || item.match || item.match_name || item.name || '';
      const teamA = item.team_a || item.teamA || item.team_a_short || '';
      const teamB = item.team_b || item.teamB || item.team_b_short || '';
      
      const title = name || (teamA && teamB ? `${teamA} v ${teamB}` : '');
      if (!title) return null;

      const teams = teamA && teamB ? { team1: teamA, team2: teamB } : parseTeams(title);
      
      // AllThingsDev IDs can be numeric or strings
      const rawId = item.match_id || item.matchId || item.id || item.series_id || index;
      const id = `atd-${rawId}`;

      const isLive = item.status === 'live' || item.live === 1 || item.inplay === 1 || item.is_live === true;

      return {
        id,
        atd_match_id: String(rawId),
        cricbuzz_match_id: item.cricbuzz_id || item.cricbuzz_match_id || null,
        title,
        team1: teams.team1,
        team2: teams.team2,
        sport: 'Cricket',
        status: isLive ? 'live' : 'upcoming',
        match_time: item.match_time || item.match_date || item.date || new Date().toISOString(),
        back_odds: 1.9, // Default for UI if not present in API
        lay_odds: 2.0,
        back_odds2: 1.9,
        lay_odds2: 2.0,
        source: 'atd-cricket',
      };
    })
    .filter((e): e is NonNullable<typeof e> => !!e && !!e.title);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ATD_API_KEY');
  if (!apiKey) {
    console.log('[ATD] No API key set');
    return new Response(JSON.stringify({ matches: [], error: 'No ATD_API_KEY' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const headers = {
    'x-atd-key': apiKey,
    'x-apihub-host': 'Cricket-Live-Line-API.allthingsdev.co',
    'x-apihub-endpoint': 'ef387cb6-001f-4c4a-abb4-bed45c575e4e',
    'Accept': 'application/json',
  };

  const urls = [
    'https://Cricket-Live-Line-API.allthingsdev.co/Home?type=1&per_paged=100&highlight_com=1',
    'https://allthingsdev.co/Home?type=1&per_paged=100&highlight_com=1',
    'https://Cricket-Live-Line-API.allthingsdev.co/?type=1&per_paged=100&highlight_com=1',
  ];

  let rawData = null;
  let lastError = null;

  for (const url of urls) {
    try {
      console.log(`[ATD] Fetching ${url}`);
      const res = await fetch(url, { headers });
      console.log(`[ATD] Status: ${res.status}`);
      
      const bodyText = await res.text();
      console.log(`[ATD] Body snippet: ${bodyText.substring(0, 400)}`);

      if (res.ok) {
        try {
          rawData = JSON.parse(bodyText);
          break; // Success
        } catch (e) {
          lastError = `JSON Parse Error: ${e.message}`;
        }
      } else {
        lastError = `HTTP ${res.status}: ${bodyText.substring(0, 100)}`;
      }
    } catch (err) {
      console.log(`[ATD] Error fetching ${url}: ${err.message}`);
      lastError = err.message;
    }
  }

  if (!rawData) {
    return new Response(JSON.stringify({ matches: [], error: lastError }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const matches = mapAll(extractList(rawData));

  return new Response(JSON.stringify({ matches, raw: rawData }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
