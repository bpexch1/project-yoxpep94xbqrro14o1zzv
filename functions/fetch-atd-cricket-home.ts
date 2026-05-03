
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
  // Deep search for any array that looks like matches
  const search = (obj: any): any[] | null => {
    if (!obj || typeof obj !== 'object') return null;
    for (const key in obj) {
      if (Array.isArray(obj[key]) && obj[key].length > 0) {
        const first = obj[key][0];
        if (first && (first.match_id || first.match_name || first.team_a || first.title || first.matchId)) {
          return obj[key];
        }
      }
      const nested = search(obj[key]);
      if (nested) return nested;
    }
    return null;
  };

  const found = search(raw);
  if (found) return found;

  return raw?.data || raw?.matches || raw?.matchList || raw?.results || raw?.response || raw?.list || raw?.home || raw?.live || raw?.upcoming || [];
};

function mapAll(matches: any[]): any[] {
  return matches
    .map((item: any, index: number) => {
      const name = item.title || item.match || item.match_name || item.name || item.match_title || '';
      const teamA = item.team_a || item.teamA || item.team_a_short || item.team_a_name || item.localteam || (item.team_a && item.team_a.name) || '';
      const teamB = item.team_b || item.teamB || item.team_b_short || item.team_b_name || item.visitorteam || (item.team_b && item.team_b.name) || '';
      
      const title = name || (teamA && teamB ? `${teamA} v ${teamB}` : '');
      if (!title) return null;

      const teams = teamA && teamB ? { team1: String(teamA), team2: String(teamB) } : parseTeams(title);
      
      const rawId = item.match_id || item.matchId || item.id || item.series_id || index;
      const id = `atd-${rawId}`;

      // Status logic: live vs upcoming vs completed
      const rawStatus = String(item.status || item.match_status || item.matchStatus || item.state || '').toLowerCase();
      const liveIndicators = ['live', 'inplay', 'running', 'started', '2', 'true'];
      const completedIndicators = ['completed', 'finished', 'result', 'ended', '3'];
      
      let status = 'upcoming';
      if (liveIndicators.some(ind => rawStatus.includes(ind)) || item.live === 1 || item.inplay === 1 || item.is_live === true) {
        status = 'live';
      } else if (completedIndicators.some(ind => rawStatus.includes(ind))) {
        status = 'completed';
      }

      // Time parsing
      let matchTime = item.match_time || item.match_date || item.date || item.start_date || new Date().toISOString();
      
      return {
        id,
        atd_match_id: String(rawId),
        cricbuzz_match_id: item.cricbuzz_id || item.cricbuzz_match_id || null,
        title,
        team1: teams.team1,
        team2: teams.team2,
        sport: 'Cricket',
        status,
        match_time: matchTime,
        back_odds: 1.9,
        lay_odds: 2.0,
        back_odds2: 1.9,
        lay_odds2: 2.0,
        source: 'atd-cricket',
        api_status: rawStatus,
      };
    })
    .filter((e): e is NonNullable<typeof e> => !!e && !!e.title && e.status !== 'completed');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ATD_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ matches: [], error: 'No ATD_API_KEY set in secrets' }), {
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
    'https://allthingsdev.co/api?type=1&per_paged=100&highlight_com=1',
    'https://api.allthingsdev.co/Home?type=1&per_paged=100&highlight_com=1',
    'https://Cricket-Live-Line-API.allthingsdev.co/?type=1&per_paged=100&highlight_com=1',
  ];

  let rawData = null;
  let lastError = null;
  let successUrl = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers });
      const bodyText = await res.text();

      if (res.ok) {
        try {
          rawData = JSON.parse(bodyText);
          successUrl = url;
          break;
        } catch (e) {
          lastError = `JSON Parse Error: ${e.message}`;
        }
      } else {
        lastError = `HTTP ${res.status}: ${bodyText.substring(0, 100)}`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  if (!rawData) {
    return new Response(JSON.stringify({ matches: [], error: lastError, debug: { tried_urls: urls } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rawList = extractList(rawData);
  const matches = mapAll(rawList);

  return new Response(JSON.stringify({ 
    matches, 
    debug: { 
      success_url: successUrl,
      raw_count: rawList.length,
      mapped_count: matches.length,
      top_keys: Object.keys(rawData)
    } 
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
