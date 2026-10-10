import { supabase } from "@/integrations/supabase";

export interface SecureBetRequest {
  matchId: string;
  selection: string;
  betType: "back" | "lay";
  stake: number;
  odds: number;
}

// Keep the request UUID stable across a retried click in the same client session.
const pendingRequests = new Map<string, string>();

export async function placeBetSecure(bet: SecureBetRequest): Promise<any> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bet.matchId || "")) {
    throw new Error("This event is not linked to a verified market. Betting is unavailable.");
  }
  if (!Number.isFinite(bet.stake) || bet.stake <= 0 || !Number.isFinite(bet.odds) || bet.odds <= 1) {
    throw new Error("Invalid stake or odds.");
  }
  if (bet.betType !== "back") {
    throw new Error("Lay betting requires verified liability accounting and is not enabled.");
  }
  // Legacy localStorage usernames are NOT authentication; require real Supabase Auth JWT.
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    throw new Error("Secure account authentication is required before betting.");
  }

  const key = [bet.matchId, bet.selection, bet.betType, bet.stake, bet.odds].join("|");
  let requestId = pendingRequests.get(key);
  if (!requestId) {
    requestId = crypto.randomUUID();
    pendingRequests.set(key, requestId);
  }

  const { data, error } = await supabase.rpc("place_bet_atomic", {
    p_match_id: bet.matchId,
    p_selection: bet.selection,
    p_bet_type: bet.betType,
    p_stake: bet.stake,
    p_requested_odds: bet.odds,
    p_request_id: requestId,
  });

  if (error || !data?.success) {
    // Retain requestId on transport uncertainty to avoid double-charging on retry.
    throw new Error(error?.message || data?.error || "Server rejected the wager.");
  }
  pendingRequests.delete(key);
  return data;
}
