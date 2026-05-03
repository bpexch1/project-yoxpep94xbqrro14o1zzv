
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { matchId, atdMatchId } = body;
    
    const actualAtdId = atdMatchId || (typeof matchId === 'string' && matchId.startsWith('atd-') ? matchId.replace('atd-', '') : null);
    const actualCricbuzzId = !actualAtdId ? matchId : null;

    const cricbuzzKey = Deno.env.get('CRICBUZZ_RAPIDAPI_KEY');
    const atdKey = Deno.env.get('ATD_API_KEY');

    // 1. Try Cricbuzz if we have a Cricbuzz ID and Key
    if (actualCricbuzzId && cricbuzzKey) {
      console.log(`[get-cricket-score] Fetching Cricbuzz match ${actualCricbuzzId}`);
      try {
        const response = await fetch(
          `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${actualCricbuzzId}/leanback`,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-key': cricbuzzKey,
              'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const miniscore = data.miniscore;
          if (miniscore) {
            const batTeam = miniscore.batTeam;
            const innings = batTeam?.teamScore?.inngs;
            const recentStats: string = miniscore.recentOvsStats || miniscore.recentOvs || '';
            const overSegments = recentStats.split('|');
            const thisOverStr = (overSegments[overSegments.length - 1] || '').trim();
            const thisOverBalls: string[] = thisOverStr ? thisOverStr.split(' ').filter((b: string) => b.trim()) : [];
            const lastBall: string | null = thisOverBalls.length > 0 ? thisOverBalls[thisOverBalls.length - 1] : null;

            return new Response(JSON.stringify({
              score: {
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
                source: 'cricbuzz'
              }
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      } catch (err) {
        console.error(`[get-cricket-score] Cricbuzz error: ${err.message}`);
      }
    }

    // 2. Try AllThingsDev if we have an ATD ID and Key (or if Cricbuzz failed)
    if (actualAtdId && atdKey) {
      console.log(`[get-cricket-score] Fetching ATD match ${actualAtdId}`);
      try {
        // For AllThingsDev, we usually fetch the whole Home list and find the match
        // Or if they have a specific Match Detail endpoint, we use that.
        // Based on screenshot, they have a "Home" endpoint. Let's try that.
        const atdHeaders = {
          'x-atd-key': atdKey,
          'x-apihub-host': 'Cricket-Live-Line-API.allthingsdev.co',
          'x-apihub-endpoint': 'ef387cb6-001f-4c4a-abb4-bed45c575e4e',
          'Accept': 'application/json',
        };

        const atdResponse = await fetch('https://Cricket-Live-Line-API.allthingsdev.co/Home?type=1', { headers: atdHeaders });
        if (atdResponse.ok) {
          const raw = await atdResponse.json();
          const matches = Array.isArray(raw) ? raw : (raw?.data || raw?.matches || []);
          const match = matches.find((m: any) => String(m.match_id || m.matchId || m.id) === String(actualAtdId));

          if (match) {
            // Normalize ATD score format
            // ATD often has fields like: team_a_scores, team_b_scores, team_batting, last_over, etc.
            const battingTeam = match.team_batting || match.batting_team || (match.live === 1 ? match.team_a_short || match.team_a : '');
            const scoreStr = match.score || match.team_a_scores || ''; // e.g. "150/3 (18.2)"
            
            let runs = null;
            let wickets = null;
            let overs = null;

            if (scoreStr && scoreStr.includes('/')) {
              const parts = scoreStr.split('/');
              runs = parseInt(parts[0]);
              const secondPart = parts[1] || '';
              wickets = parseInt(secondPart);
              const overMatch = secondPart.match(/\((.*?)\)/);
              if (overMatch) overs = overMatch[1];
            }

            const lastOverStr = match.last_over || match.recent_balls || '';
            const lastBalls = lastOverStr.split(',').map((s: string) => s.trim()).filter(Boolean);

            return new Response(JSON.stringify({
              score: {
                battingTeam,
                runs,
                wickets,
                overs,
                crr: match.crr || null,
                rrr: match.rrr || null,
                target: match.target || null,
                thisOver: lastBalls,
                lastBall: lastBalls.length > 0 ? lastBalls[lastBalls.length - 1] : null,
                recentOvsStats: lastOverStr,
                matchStatus: match.match_status || (match.live === 1 ? 'Live' : 'Upcoming'),
                source: 'atd'
              }
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      } catch (err) {
        console.error(`[get-cricket-score] ATD error: ${err.message}`);
      }
    }

    return new Response(JSON.stringify({ score: null, message: 'No score found or missing keys' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[get-cricket-score] Fatal error:', error.message);
    return new Response(JSON.stringify({ score: null, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
