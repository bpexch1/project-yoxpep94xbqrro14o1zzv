import { realClient } from "@/integrations/supabase";
import type { CricketMatch } from "../../supabase/functions/cricket-feed/normalize";

export type CricketFeed = {
  matches: CricketMatch[];
  source: "CricketData";
  fetchedAt: string;
  stale: boolean;
  oddsAvailable: false;
};

export async function getCricketFeed(): Promise<CricketFeed> {
  const token = sessionStorage.getItem("exchangeSessionToken");
  if (!token || !realClient) throw new Error("Sign in to load cricket matches");
  const { data, error } = await realClient.functions.invoke("cricket-feed", {
    method: "GET", headers: { "x-exchange-session": token },
  });
  if (error || !data || !Array.isArray(data.matches)) {
    throw new Error(data?.error || "Cricket feed unavailable; try again later");
  }
  return data as CricketFeed;
}
