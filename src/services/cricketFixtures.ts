import { realClient } from '@/integrations/supabase';

export type CricketFixture = {
  id: string;
  providerId: string;
  source: 'CricketData';
  title: string;
  teams: [string, string];
  startsAt: string | null;
  status: 'live' | 'upcoming' | 'completed';
  statusText: string;
  scores: { inning: string; runs: number; wickets: number; overs: number }[];
  marketStatus: 'SUSPENDED';
};

export type CricketFixturesResponse = {
  matches: CricketFixture[];
  source: 'CricketData';
  fetchedAt: string;
  stale: boolean;
  oddsAvailable: false;
};

export async function getCricketFixtures(): Promise<CricketFixturesResponse> {
  const token = sessionStorage.getItem('exchangeSessionToken');
  if (!token || !realClient) throw new Error('Cricket schedule is unavailable');
  const { data, error } = await realClient.functions.invoke('cricket-feed', {
    method: 'GET',
    headers: { 'x-exchange-session': token },
  });
  if (error || !Array.isArray(data?.matches)) throw new Error('Cricket schedule is unavailable');
  return data as CricketFixturesResponse;
}
