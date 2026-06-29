import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const fetchBetfairEvents = async () => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/api/betfair/events`
    );

    return res.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchAtdCricketHome = async () => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/api/cricket/home`
    );

    return res.data;
  } catch (error) {
    console.error(error);
    return { matches: [] };
  }
};

export const handleTransaction = async (data: any) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/transactions`,
    data
  );

  return res.data;
};

export const settleBets = async (data: any) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/bets/settle`,
    data
  );

  return res.data;
};

export const getLiveOdds = async (matchId: string) => {
  const res = await axios.get(
    `${API_BASE_URL}/api/odds/${matchId}`
  );

  return res.data;
};

export const getCricketScore = async (matchId: string) => {
  const res = await axios.get(
    `${API_BASE_URL}/api/score/${matchId}`
  );

  return res.data;
};

export const oddsEngine = async (data: any) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/odds-engine`,
    data
  );

  return res.data;
};