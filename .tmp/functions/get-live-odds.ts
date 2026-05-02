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
    return new Response(JSON.stringify({ markets: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { eventId } = await req.json();
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'eventId required', markets: [] }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[get-live-odds] Fetching event ${eventId}`);

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
      console.error(`[get-live-odds] API error: ${response.status}`);
      return new Response(JSON.stringify({ markets: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const raw = await response.json();
    console.log(`[get-live-odds] Raw (first 500): ${JSON.stringify(raw).substring(0, 500)}`);

    // Normalize markets from various possible response structures
    let rawMarkets: any[] = [];
    if (Array.isArray(raw)) {
      rawMarkets = raw;
    } else if (Array.isArray(raw?.markets)) {
      rawMarkets = raw.markets;
    } else if (Array.isArray(raw?.result?.markets)) {
      rawMarkets = raw.result.markets;
    } else if (raw?.market && !Array.isArray(raw.market)) {
      rawMarkets = [raw.market];
    } else if (Array.isArray(raw?.market)) {
      rawMarkets = raw.market;
    } else if (raw?.marketBook) {
      rawMarkets = Array.isArray(raw.marketBook) ? raw.marketBook : [raw.marketBook];
    }

    const parsedMarkets = rawMarkets.map((market: any) => {
      // Get runners - might be nested in different ways
      const rawRunners = market.runners || market.runner || [];
      const runners = rawRunners.map((runner: any) => {
        // availableToBack - can be in ex.availableToBack OR directly
        const backList = runner.availableToBack 
          || runner.ex?.availableToBack 
          || runner.back 
          || [];
        const layList = runner.availableToLay 
          || runner.ex?.availableToLay 
          || runner.lay 
          || [];

        // Get best back price (highest price that someone will back at)
        const backPrice = backList[0]?.price ?? backList[0]?.Price ?? null;
        const backSize = backList[0]?.size ?? backList[0]?.Size ?? null;
        // Get best lay price (lowest price that someone will lay at)
        const layPrice = layList[0]?.price ?? layList[0]?.Price ?? null;
        const laySize = layList[0]?.size ?? layList[0]?.Size ?? null;

        return {
          selectionId: runner.selectionId || runner.SelectionId || runner.id,
          runnerName: runner.runnerName || runner.RunnerName || runner.name || runner.Name || '',
          status: runner.status || runner.Status || 'ACTIVE',
          backPrice: typeof backPrice === 'number' ? backPrice : parseFloat(backPrice) || null,
          backSize: typeof backSize === 'number' ? backSize : parseFloat(backSize) || null,
          layPrice: typeof layPrice === 'number' ? layPrice : parseFloat(layPrice) || null,
          laySize: typeof laySize === 'number' ? laySize : parseFloat(laySize) || null,
        };
      });

      return {
        marketId: market.marketId || market.MarketId || market.id,
        marketName: market.marketName || market.MarketName || market.name || '',
        status: market.status || market.Status || 'OPEN',
        runners,
      };
    });

    return new Response(JSON.stringify({ markets: parsedMarkets }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[get-live-odds] Error:', error.message);
    return new Response(JSON.stringify({ markets: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
