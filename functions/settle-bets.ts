import { MongoClient } from "npm:mongodb@6";
import { createSuperdevClient } from "npm:@superdevhq/client@latest";

// CORS Headers
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Interfaces
interface SettleBetsRequestBody {
  matchId?: string;
  winningSide?: string;
  token?: string;
}

interface BetRecord {
  id: string;
  match_id: string;
  match_title?: string;
  selection: string;
  bet_type: "back" | "lay";
  stake: number;
  odds: number;
  user_email?: string;
  status: string;
}

interface SettlementResult {
  betId: string;
  username: string;
  status: "won" | "lost";
  stake: number;
  odds: number;
  pl_raw: number;
  pl_downline: number;
  pl_upline: number;
  note: string;
}

/**
 * MongoDB "users" collection schema:
 * {
 *   username: String,           -- unique identifier
 *   sharePercentage: Number,    -- default 85 (admin share %)
 *   plDownline: Number,         -- Admin's cumulative P/L (85% share)
 *   plUpline: Number,           -- Company's cumulative P/L (15% share)
 *   balance: Number,            -- current balance
 *   updatedAt: Date
 * }
 *
 * P/L FORMULA (when user loses amount X):
 *   plDownline += X * 0.85   (Admin earns 85% of loss -> add to plDownline)
 *   plUpline   -= X * 0.15   (Company 15% is deducted  -> subtract from plUpline)
 *
 * P/L FORMULA (when user wins amount X):
 *   plDownline -= X * 0.85   (Admin pays 85% of win -> deduct from plDownline)
 *   plUpline   += X * 0.15   (Company pays 15% of win -> add to plUpline)
 */

Deno.serve(async (req: Request): Promise<Response> => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  // 2. Parse & Validate Payload
  let body: SettleBetsRequestBody;
  try {
    body = await req.json();
  } catch (_parseErr) {
    return jsonResponse({ error: "Invalid JSON request body" }, 400);
  }

  const { matchId, winningSide, token } = body;

  // Strict Payload Validation
  if (!matchId || typeof matchId !== "string" || matchId.trim().length === 0) {
    return jsonResponse({ error: "Invalid or missing 'matchId'. Must be a non-empty string." }, 400);
  }

  if (!winningSide || typeof winningSide !== "string" || winningSide.trim().length === 0) {
    return jsonResponse({ error: "Invalid or missing 'winningSide'. Must be a non-empty string." }, 400);
  }

  const normalizedMatchId = matchId.trim();
  const normalizedWinningSide = winningSide.trim();

  const mongoUri = Deno.env.get("MONGODB_URI");
  if (!mongoUri) {
    return jsonResponse({ error: "MONGODB_URI environment variable is not configured" }, 500);
  }

  const appId = Deno.env.get("SUPERDEV_APP_ID") || "yoxpep94xbqrro14o1zzv";

  // 3. Initialize MongoDB Client instance
  const mongoClient = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    // Connect to MongoDB Atlas
    await mongoClient.connect();
    const db = mongoClient.db("bpexch");
    const usersCollection = db.collection("users");
    const plRecordsCollection = db.collection("pl_records");

    // Initialize backend client / entities
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
    const userToken = token || authHeader.replace(/^Bearer\s+/i, "").trim();
    const superdev = createSuperdevClient({ appId });
    if (userToken) {
      superdev.auth.setToken(userToken);
    }

    const BetEntity = superdev.entity("Bet");
    const ClientEntity = superdev.entity("Client");
    const MatchEntity = superdev.entity("Match");

    // Fetch pending bets for the match
    const bets = (await BetEntity.query()
      .where("match_id", normalizedMatchId)
      .where("status", "pending")
      .exec()) as BetRecord[];

    if (!bets || bets.length === 0) {
      return jsonResponse({
        message: "No pending bets found for this match",
        matchId: normalizedMatchId,
        settled: 0,
        settlements: [],
      });
    }

    // Mark match as completed
    try {
      await MatchEntity.update(normalizedMatchId, { status: "completed" });
    } catch (matchUpdateErr) {
      console.warn(`[settle-bets] Could not mark match ${normalizedMatchId} as completed:`, matchUpdateErr);
    }

    const settlements: SettlementResult[] = [];

    // Process each pending bet
    for (const bet of bets) {
      const stake = typeof bet.stake === "number" ? bet.stake : (parseFloat(String(bet.stake || 0)) || 0);
      const odds = typeof bet.odds === "number" ? bet.odds : (parseFloat(String(bet.odds || 1)) || 1);
      const betType: "back" | "lay" = bet.bet_type === "lay" ? "lay" : "back";
      const selection = String(bet.selection || "").trim();
      const username = String(bet.user_email || "unknown").trim();

      const didWin = selection.toLowerCase() === normalizedWinningSide.toLowerCase() ||
        (normalizedWinningSide.toLowerCase() === "draw" && selection.toLowerCase() === "draw");

      // Calculate raw P/L
      let pl = 0;
      if (betType === "back") {
        pl = didWin ? stake * (odds - 1) : -stake;
      } else {
        pl = didWin ? -(stake * (odds - 1)) : stake;
      }

      // pl > 0 means user WON, pl < 0 means user LOST
      const lossAmount = -pl; // positive when user lost
      const sharePercentage = 85;

      // P/L Sharing formula
      const plDownlineDelta = parseFloat((lossAmount * 0.85).toFixed(2));
      const plUplineDelta = parseFloat((-lossAmount * 0.15).toFixed(2));
      const newStatus: "won" | "lost" = didWin ? "won" : "lost";

      // Update bet status in backend database
      try {
        await BetEntity.update(bet.id, { status: newStatus });
      } catch (betUpdateErr) {
        console.error(`[settle-bets] Failed to update bet ${bet.id} status:`, betUpdateErr);
      }

      // Atomically update user balance and P/L in MongoDB
      const updatedUser = await usersCollection.findOneAndUpdate(
        { username },
        {
          $inc: {
            plDownline: plDownlineDelta,
            plUpline: plUplineDelta,
            balance: parseFloat(pl.toFixed(2)),
          },
          $set: { updatedAt: new Date() },
          $setOnInsert: {
            username,
            sharePercentage,
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      // Save audit record
      await plRecordsCollection.insertOne({
        match_id: normalizedMatchId,
        winning_side: normalizedWinningSide,
        username,
        bet_id: bet.id,
        stake,
        odds,
        bet_type: betType,
        selection,
        did_win: didWin,
        pl_raw: parseFloat(pl.toFixed(2)),
        pl_downline: plDownlineDelta,
        pl_upline: plUplineDelta,
        share_pct_admin: sharePercentage,
        share_pct_company: 100 - sharePercentage,
        new_pl_downline: (updatedUser as any)?.plDownline ?? 0,
        new_pl_upline: (updatedUser as any)?.plUpline ?? 0,
        settled_at: new Date(),
      });

      // Update Client entity downline & upline values
      try {
        let clients = (await ClientEntity.query().where("created_by", username).limit(1).exec()) as any[];
        if (!clients?.length) {
          clients = (await ClientEntity.query().where("username", username).limit(1).exec()) as any[];
        }
        if (clients?.length) {
          const c = clients[0];
          await ClientEntity.update(c.id, {
            pl_downline: parseFloat(((c.pl_downline ?? 0) + plDownlineDelta).toFixed(2)),
            balance_upline: parseFloat(((c.balance_upline ?? 0) + plUplineDelta).toFixed(2)),
          });
        }
      } catch (clientSyncErr) {
        console.warn(`[settle-bets] Could not sync Client entity for user ${username}:`, clientSyncErr);
      }

      settlements.push({
        betId: bet.id,
        username,
        status: newStatus,
        stake,
        odds,
        pl_raw: parseFloat(pl.toFixed(2)),
        pl_downline: plDownlineDelta,
        pl_upline: plUplineDelta,
        note: didWin
          ? `User WON ${pl.toFixed(2)} -> Admin pays 85% (${(-plDownlineDelta).toFixed(2)}), Company pays 15% (${plUplineDelta.toFixed(2)})`
          : `User LOST ${(-pl).toFixed(2)} -> Admin earns 85% (+${plDownlineDelta.toFixed(2)}), Company deducted 15% (${plUplineDelta.toFixed(2)})`,
      });
    }

    return jsonResponse({
      success: true,
      matchId: normalizedMatchId,
      winningSide: normalizedWinningSide,
      totalBetsSettled: settlements.length,
      settlements,
    });
  } catch (err: any) {
    const errMsg = err?.message ?? "An unexpected error occurred during settlement";
    console.error("[settle-bets] Error executing settlement:", errMsg, err?.code, err?.codeName);
    return jsonResponse(
      {
        error: errMsg,
        code: err?.code,
        codeName: err?.codeName,
      },
      500
    );
  } finally {
    // Always safely close MongoDB connection
    try {
      await mongoClient.close();
    } catch (closeErr) {
      console.warn("[settle-bets] Error closing MongoDB connection in finally block:", closeErr);
    }
  }
});
