const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const rapidApiKey = Deno.env.get('BETFAIR_RAPIDAPI_KEY');
  if (!rapidApiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { eventId } = await req.json();
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'eventId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(
      `https://betfair-orbitexch-data.p.rapidapi.com/betfair/get_event_with_markets/${eventId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'betfair-orbitexch-data.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const raw = await response.json();

    // Normalize: extract markets array
    const markets = raw?.markets || raw?.result?.markets || raw?.market ? (Array.isArray(raw.markets || raw.result?.markets) ? (raw.markets || raw.result?.markets) : [raw.market]) : [];

    // Parse each market into a clean structure
    const parsedMarkets = markets.map((market: any) => {
      const runners = (market.runners || []).map((runner: any) => {
        const back = runner.availableToBack || runner.ex?.availableToBack || [];
        const lay = runner.availableToLay || runner.ex?.availableToLay || [];
        return {
          selectionId: runner.selectionId,
          runnerName: runner.runnerName || runner.name || '',
          status: runner.status || 'ACTIVE',
          backPrice: back[0]?.price ?? null,
          backSize: back[0]?.size ?? null,
          layPrice: lay[0]?.price ?? null,
          laySize: lay[0]?.size ?? null,
        };
      });

      return {
        marketId: market.marketId,
        marketName: market.marketName || '',
        status: market.status || 'OPEN', // OPEN | SUSPENDED | CLOSED
        runners,
      };
    });

    return new Response(JSON.stringify({ markets: parsedMarkets, raw }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('get-live-odds error:', error.message);
    return new Response(JSON.stringify({ error: error.message, markets: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});