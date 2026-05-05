import axios from 'axios';

const fetchLiveCricketMatches = async () => {
    const options = {
        method: 'GET',
        url: 'https://cricket-live-data.p.rapidapi.com/matches',
        headers: {
            'x-rapidapi-host': 'cricket-live-data.p.rapidapi.com',
            'x-rapidapi-key': 'your-rapidapi-key'
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error('Error fetching live matches:', error);
        throw error;
    }
};

export default fetchLiveCricketMatches;