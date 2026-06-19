import axios from 'axios';

const fetchBetfairEvents = async (opts = {}) => {
  const rapidApiKey = process.env.BETFAIR_RAPIDAPI_KEY || process.env.VITE_BETFAIR_RAPIDAPI_KEY;

  if (!rapidApiKey) {
    console.warn('BETFAIR_RAPIDAPI_KEY is not set. Returning empty events.');
    return [];
  }

  // Basic safe implementation - adapt later to real Betfair API endpoints
  try {
    const response = await axios.get('https://api.example-betfair.com/events', {
      headers: {
        'x-rapidapi-key': rapidApiKey
      },
      params: opts
    });
    return response.data || [];
  } catch (err) {
    console.error('Error fetching Betfair events:', err);
    return [];
  }
};

export default fetchBetfairEvents;
