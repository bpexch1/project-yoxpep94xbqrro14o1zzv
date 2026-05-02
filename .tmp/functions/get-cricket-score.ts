const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get('CRICBUZZ_RAPIDAPI_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No API key' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { matchId } = await req.json();
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'matchId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[get-cricket-score] Fetching match ${matchId}`);

    const response = await fetch(
      `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}/leanback`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.error(`[get-cricket-score] API error: ${response.status}`);
      return new Response(JSON.stringify({ score: null }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    console.log(`[get-cricket-score] Raw (500): ${JSON.stringify(data).substring(0, 500)}`);

    const miniscore = data.miniscore;
    if (!miniscore) {
      return new Response(JSON.stringify({ score: null, raw: data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const batTeam = miniscore.batTeam;
    const innings = batTeam?.teamScore?.inngs;

    // Parse this over's balls from recentOvsStats
    // Format: "1 W 0 | 4 0w 0" — bars separate overs
    const recentStats: string = miniscore.recentOvsStats || miniscore.recentOvs || '';
    const overSegments = recentStats.split('|');
    const thisOverStr = (overSegments[overSegments.length - 1] || '').trim();
    const thisOverBalls: string[] = thisOverStr ? thisOverStr.split(' ').filter((b: string) => b.trim()) : [];
    const lastBall: string | null = thisOverBalls.length > 0 ? thisOverBalls[thisOverBalls.length - 1] : null;

    const score = {
      battingTeam: batTeam?.teamSName || batTeam?.teamName || '',
      runs: innings?.runs ?? null,
      wickets: innings?.wickets ?? null,
      overs: miniscore.oversAct || innings?.overs || null,
      crr: miniscore.currentRunRate != null ? Number(miniscore.currentRunRate).toFixed(2) : null,
      rrr: miniscore.requiredRunRate != null ? Number(miniscore.requiredRunRate).toFixed(2) : null,
      target: miniscore.target ?? null,
      thisOver: thisOverBalls,
      lastBall,
      recentOvsStats: recentStats,
      matchStatus: data.matchHeader?.status || null,
    };

    return new Response(JSON.stringify({ score }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[get-cricket-score] Error:', error.message);
    return new Response(JSON.stringify({ score: null, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
