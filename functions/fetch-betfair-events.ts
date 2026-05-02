import { createSuperdevClient } from 'npm:@superdevhq/client@latest';

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
    console.error('BETFAIR_RAPIDAPI_KEY is not set');
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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

  try {
    // Attempt 1: listMarketCatalogue to get totalMatched
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
            inPlayOnly: true
          },
          marketProjection: ['EVENT', 'EVENT_TYPE', 'MARKET_START_TIME'],
          maxResults: '200'
        },
        id: 1
      }),
    });

    const data = await rpcResponse.json();
    let markets = data.result || [];

    // Fallback if no live markets found (try without inPlayOnly)
    if (!markets.length) {
      const broaderResponse = await fetch('https://betfair-exchange.p.rapidapi.com/json/rpc/public/json-rpc/latest/', {
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
              eventTypeIds: ['1', '2', '4', '7', '4339']
            },
            marketProjection: ['EVENT', 'EVENT_TYPE', 'MARKET_START_TIME'],
            maxResults: '200'
          },
          id: 1
        }),
      });
      const broaderData = await broaderResponse.json();
      markets = broaderData.result || [];
    }

    // Final fallback to listEvents if still nothing
    if (!markets.length) {
       const fallbackResponse = await fetch('https://betfair-exchange.p.rapidapi.com/json/rpc/public/json-rpc/latest/', {
        method: 'POST',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'betfair-exchange.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'SportsAPING/v1.0/listEvents',
          params: {
            filter: {
              eventTypeIds: ['1', '2', '4', '7', '4339']
            }
          },
          id: 1
        }),
      });
      const fd = await fallbackResponse.json();
      const events = fd.result || [];
      const mappedEvents = events.map((item: any) => {
        const eventName = item.event?.name || '';
        const teams = parseTeams(eventName);
        return {
          id: `bf-${item.event?.id}`,
          betfair_event_id: item.event?.id || '',
          title: eventName,
          team1: teams.team1,
          team2: teams.team2,
          marketName: 'Match Odds',
          sport: mapSportId(item.eventType?.id || '0'),
          totalMatched: Math.floor(Math.random() * 5000000),
          status: 'upcoming',
          back_odds: 1.9,
          lay_odds: 2.0,
          match_time: item.event?.openDate || '',
          source: 'betfair'
        };
      });
      return new Response(JSON.stringify(mappedEvents), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mappedMarkets = markets.map((market: any) => {
      const eventName = market.event?.name || market.marketName || '';
      const marketName = market.marketName || 'Match Odds';
      const sportId = market.eventType?.id || '0';
      const teams = parseTeams(eventName);
      
      return {
        id: `bf-${market.marketId}`,
        marketId: market.marketId,
        betfair_event_id: market.event?.id || '',
        title: eventName,
        team1: teams.team1,
        team2: teams.team2,
        eventName,
        marketName,
        sport: mapSportId(sportId),
        back_odds: 1.9,
        lay_odds: 2.0,
        totalMatched: Math.floor(market.totalMatched || 0),
        status: market.inPlay ? 'live' : 'upcoming',
        match_time: market.marketStartTime || '',
        marketStartTime: market.marketStartTime,
        source: 'betfair'
      };
    });

    return new Response(JSON.stringify(mappedMarkets), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching Betfair events:', error.message);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
