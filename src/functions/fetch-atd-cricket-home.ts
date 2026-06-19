import axios from 'axios';

const fetchLiveCricketMatches = async () => {
  const rapidApiKey = process.env.CRICBUZZ_RAPIDAPI_KEY || process.env.VITE_CRICBUZZ_RAPIDAPI_KEY;

  if (!rapidApiKey) {
    // Don't crash the app in production if the key is missing — return empty shape expected by UI
    // UI reads atdData?.matches, so return { matches: [] }
    console.warn('CRICBUZZ_RAPIDAPI_KEY is not set. Returning empty matches.');
    return { matches: [] };
  }

  const options = {
    method: 'GET',
    url: 'https://cricket-live-data.p.rapidapi.com/matches',
    headers: {
      'x-rapidapi-host': 'cricket-live-data.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    }
  };

  try {
    const response = await axios.request(options);
    // Some RapidAPI responses wrap data; keep the raw response so UI can use atdData.matches
    return response.data || { matches: [] };
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return { matches: [] };
  }
};

export default fetchLiveCricketMatches;
