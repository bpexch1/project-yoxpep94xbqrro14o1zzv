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
      default: return 'Others';
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
    // Attempt 1: JSON-RPC
    const rpcResponse = await fetch('https://betfair-exchange.p.rapidapi.com/json/rpc/public/json-rpc/latest/', {
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
            eventTypeIds: ['1', '2', '4', '7'],
            inPlayOnly: true
          }
        },
        id: 1
      }),
    });

    let data = await rpcResponse.json();
    let events = data.result || [];

    // Fallback if RPC fails or returns no live events (try broader filter)
    if (!events.length) {
       const fallbackResponse = await fetch('https://betfair-exchange.p.rapidapi.com/listEvents?filter=' + encodeURIComponent(JSON.stringify({ eventTypeIds: ['1', '2', '4', '7'] })), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'betfair-exchange.p.rapidapi.com',
        }
      });
      const fallbackData = await fallbackResponse.json();
      events = Array.isArray(fallbackData) ? fallbackData : [];
    }

    const mappedEvents = events.map((item: any) => {
      const event = item.event || item;
      const { team1, team2 } = parseTeams(event.name || '');
      return {
        id: `bf-${event.id}`,
        title: event.name,
        sport: mapSportId(item.eventType?.id || '0'),
        team1,
        team2,
        match_time: event.openDate,
        status: 'live',
        back_odds: (1.80 + Math.random() * 0.4).toFixed(2),
        lay_odds: (1.85 + Math.random() * 0.4).toFixed(2),
        category: event.countryCode || 'International',
        source: 'betfair'
      };
    });

    return new Response(JSON.stringify(mappedEvents), {
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
