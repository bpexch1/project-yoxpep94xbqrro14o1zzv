import { MongoClient, Collection, Document } from "npm:mongodb@6.3.0";

// Configuration
const MONGODB_URI = Deno.env.get("MONGODB_URI") || "";
const DB_NAME = "bpexch";
const COLLECTION_NAME = "live_odds";
const RAPID_API_KEY = Deno.env.get("BETFAIR_RAPIDAPI_KEY") || "";

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

// Global MongoDB Client for Connection Pooling (Initialized outside request handler)
let cachedClient: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not configured");
  }

  if (cachedClient) {
    try {
      // Ping database to ensure connection is alive
      await cachedClient.db("admin").command({ ping: 1 });
      return cachedClient;
    } catch (_pingErr) {
      console.warn("[odds-engine] Cached MongoDB connection lost. Reconnecting...");
      try {
        await cachedClient.close();
      } catch {
        // Ignore close error on dead connection
      }
      cachedClient = null;
      clientPromise = null;
    }
  }

  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });

    clientPromise = client.connect().then((connectedClient) => {
      cachedClient = connectedClient;
      return connectedClient;
    });
  }

  return clientPromise;
}

async function getLiveOddsCollection(): Promise<Collection<Document>> {
  const client = await getMongoClient();
  return client.db(DB_NAME).collection(COLLECTION_NAME);
}

// Request Payload Types
interface SyncMatchItem {
  matchId: string;
  betfairEventId: string;
}

interface OddsPayload {
  teamA_back?: number | string;
  teamA_lay?: number | string;
  teamB_back?: number | string;
  teamB_lay?: number | string;
  [key: string]: unknown;
}

interface RequestBody {
  action: string;
  matchId?: string;
  betfairEventId?: string;
  matches?: SyncMatchItem[];
  odds?: OddsPayload;
  isSuspended?: boolean;
  matchMeta?: Record<string, unknown>;
  requestedOdds?: number;
  side?: string;
}

// Helper to extract odds from Betfair market runners
function extractRunnerOdds(runner: any, type: "back" | "lay"): number | null {
  const list = type === "back"
    ? (runner?.availableToBack || runner?.ex?.availableToBack || runner?.back || [])
    : (runner?.availableToLay || runner?.ex?.availableToLay || runner?.lay || []);
  
  const price = list[0]?.price ?? list[0]?.Price;
  if (typeof price === "number" && !isNaN(price)) return price;
  if (typeof price === "string") {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Deno Edge Function Handler
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  let col: Collection<Document> | null = null;

  try {
    // Parse JSON body safely
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (_jsonErr) {
      return jsonResponse({ error: "Invalid JSON request body" }, 400);
    }

    const { action, matchId, odds, isSuspended, matchMeta } = body;

    if (!action || typeof action !== "string") {
      return jsonResponse({ error: "Missing or invalid 'action' parameter" }, 400);
    }

    // Connect to database collection via pool
    try {
      col = await getLiveOddsCollection();
    } catch (dbErr: any) {
      console.error("[odds-engine] Database pool acquisition failed:", dbErr?.message || dbErr);
      return jsonResponse({ error: "Database connection failed", success: false }, 200);
    }

    switch (action) {
      case "syncFromBetfair": {
        const betfairEventId = body.betfairEventId;
        if (!matchId || !betfairEventId) {
          return jsonResponse({ error: "matchId and betfairEventId are required" }, 400);
        }
        if (!RAPID_API_KEY) {
          return jsonResponse({ error: "BETFAIR_RAPIDAPI_KEY is not configured" }, 400);
        }

        try {
          const existing = await col.findOne({ matchId });
          if (existing?.lastManualOverride) {
            const secsSince = (Date.now() - new Date(existing.lastManualOverride).getTime()) / 1000;
            if (secsSince < 60) {
              return jsonResponse({ odds: existing, skipped: true });
            }
          }

          const res = await fetch(
            `https://betfair-orbitexch-data.p.rapidapi.com/betfair/get_event_with_markets/${betfairEventId}`,
            {
              headers: {
                "x-rapidapi-key": RAPID_API_KEY,
                "x-rapidapi-host": "betfair-orbitexch-data.p.rapidapi.com",
              },
            }
          );

          if (!res.ok) {
            return jsonResponse({ odds: existing || null, error: "Betfair API request failed" });
          }

          const raw = await res.json();
          const rawMarkets = Array.isArray(raw)
            ? raw
            : (raw?.markets || raw?.result?.markets || (raw?.market ? [raw.market] : (raw?.marketBook ? [raw.marketBook] : [])));
          
          const matchOddsMarket = rawMarkets.find((m: any) =>
            (m.marketName || m.MarketName || "").toLowerCase().includes("match odds")
          ) || rawMarkets[0];

          if (!matchOddsMarket) {
            return jsonResponse({ odds: existing || null, error: "No match odds market found" });
          }

          const runners = matchOddsMarket.runners || matchOddsMarket.runner || [];
          const updateDoc: Record<string, unknown> = {
            matchId,
            isSuspended: matchOddsMarket.status === "SUSPENDED" || matchOddsMarket.status === "CLOSED",
            autoSynced: true,
            lastUpdated: new Date(),
          };

          if (runners[0]) {
            const b = extractRunnerOdds(runners[0], "back");
            const l = extractRunnerOdds(runners[0], "lay");
            if (b !== null) updateDoc.teamA_back = b;
            if (l !== null) updateDoc.teamA_lay = l;
          }
          if (runners[1]) {
            const b = extractRunnerOdds(runners[1], "back");
            const l = extractRunnerOdds(runners[1], "lay");
            if (b !== null) updateDoc.teamB_back = b;
            if (l !== null) updateDoc.teamB_lay = l;
          }

          if (existing) {
            if (!updateDoc.teamA && existing.teamA) updateDoc.teamA = existing.teamA;
            if (!updateDoc.teamB && existing.teamB) updateDoc.teamB = existing.teamB;
          }

          await col.updateOne({ matchId }, { $set: updateDoc }, { upsert: true });
          const doc = await col.findOne({ matchId });
          return jsonResponse({ odds: doc, synced: true });
        } catch (syncErr: any) {
          console.error(`[odds-engine] syncFromBetfair failed for match ${matchId}:`, syncErr?.message || syncErr);
          return jsonResponse({ error: syncErr?.message || "Sync failed", matchId }, 500);
        }
      }

      case "syncAllFromBetfair": {
        const matches = body.matches;
        if (!Array.isArray(matches)) {
          return jsonResponse({ error: "matches array is required" }, 400);
        }
        if (!RAPID_API_KEY) {
          return jsonResponse({ error: "BETFAIR_RAPIDAPI_KEY is not configured" }, 400);
        }

        const results = await Promise.allSettled(
          matches.slice(0, 10).map(async (m: SyncMatchItem) => {
            const { matchId: mId, betfairEventId: bId } = m;
            if (!mId || !bId) return { matchId: mId, error: "Missing matchId or betfairEventId" };

            try {
              const existing = await col!.findOne({ matchId: mId });
              if (existing?.lastManualOverride) {
                const secsSince = (Date.now() - new Date(existing.lastManualOverride).getTime()) / 1000;
                if (secsSince < 60) return { matchId: mId, skipped: true };
              }

              const res = await fetch(
                `https://betfair-orbitexch-data.p.rapidapi.com/betfair/get_event_with_markets/${bId}`,
                {
                  headers: {
                    "x-rapidapi-key": RAPID_API_KEY,
                    "x-rapidapi-host": "betfair-orbitexch-data.p.rapidapi.com",
                  },
                }
              );

              if (!res.ok) return { matchId: mId, error: `API status ${res.status}` };

              const raw = await res.json();
              const rawMarkets = Array.isArray(raw)
                ? raw
                : (raw?.markets || raw?.result?.markets || (raw?.market ? [raw.market] : (raw?.marketBook ? [raw.marketBook] : [])));
              
              const matchOddsMarket = rawMarkets.find((item: any) =>
                (item.marketName || item.MarketName || "").toLowerCase().includes("match odds")
              ) || rawMarkets[0];

              if (!matchOddsMarket) return { matchId: mId, error: "No market found" };

              const runners = matchOddsMarket.runners || matchOddsMarket.runner || [];
              const updateDoc: Record<string, unknown> = {
                matchId: mId,
                isSuspended: matchOddsMarket.status === "SUSPENDED" || matchOddsMarket.status === "CLOSED",
                autoSynced: true,
                lastUpdated: new Date(),
              };

              if (runners[0]) {
                const b = extractRunnerOdds(runners[0], "back");
                const l = extractRunnerOdds(runners[0], "lay");
                if (b !== null) updateDoc.teamA_back = b;
                if (l !== null) updateDoc.teamA_lay = l;
              }
              if (runners[1]) {
                const b = extractRunnerOdds(runners[1], "back");
                const l = extractRunnerOdds(runners[1], "lay");
                if (b !== null) updateDoc.teamB_back = b;
                if (l !== null) updateDoc.teamB_lay = l;
              }

              if (existing) {
                if (!updateDoc.teamA && existing.teamA) updateDoc.teamA = existing.teamA;
                if (!updateDoc.teamB && existing.teamB) updateDoc.teamB = existing.teamB;
              }

              await col!.updateOne({ matchId: mId }, { $set: updateDoc }, { upsert: true });
              return { matchId: mId, synced: true };
            } catch (err: any) {
              return { matchId: mId, error: err?.message || "Sync failed" };
            }
          })
        );

        return jsonResponse({ results });
      }

      case "getOdds": {
        if (!matchId) return jsonResponse({ error: "matchId is required" }, 400);
        try {
          const doc = await col.findOne({ matchId });
          return jsonResponse({ odds: doc || null });
        } catch (queryErr: any) {
          return jsonResponse({ error: queryErr?.message || "Failed to query odds", matchId }, 500);
        }
      }

      case "getAllOdds": {
        try {
          const docs = await col.find({}).toArray();
          return jsonResponse({ odds: docs });
        } catch (queryErr: any) {
          return jsonResponse({ error: queryErr?.message || "Failed to fetch all odds" }, 500);
        }
      }

      case "initOdds": {
        if (!matchId) return jsonResponse({ error: "matchId is required" }, 400);
        try {
          const existing = await col.findOne({ matchId });
          if (!existing) {
            await col.insertOne({
              matchId,
              teamA_back: Number(odds?.teamA_back ?? 1.90),
              teamA_lay: Number(odds?.teamA_lay ?? 2.00),
              teamB_back: Number(odds?.teamB_back ?? 1.90),
              teamB_lay: Number(odds?.teamB_lay ?? 2.00),
              isSuspended: false,
              lastUpdated: new Date(),
              ...(matchMeta || {}),
            });
          }
          const doc = await col.findOne({ matchId });
          return jsonResponse({ odds: doc });
        } catch (initErr: any) {
          return jsonResponse({ error: initErr?.message || "Failed to initialize odds", matchId }, 500);
        }
      }

      case "updateOdds": {
        if (!matchId) return jsonResponse({ error: "matchId is required" }, 400);
        try {
          const updateDoc: Record<string, unknown> = {
            lastUpdated: new Date(),
            lastManualOverride: new Date(),
          };

          if (odds?.teamA_back != null) updateDoc.teamA_back = Number(odds.teamA_back);
          if (odds?.teamA_lay != null)  updateDoc.teamA_lay  = Number(odds.teamA_lay);
          if (odds?.teamB_back != null) updateDoc.teamB_back = Number(odds.teamB_back);
          if (odds?.teamB_lay != null)  updateDoc.teamB_lay  = Number(odds.teamB_lay);
          if (matchMeta) Object.assign(updateDoc, matchMeta);

          await col.updateOne({ matchId }, { $set: updateDoc }, { upsert: true });
          const doc = await col.findOne({ matchId });
          return jsonResponse({ success: true, odds: doc });
        } catch (updateErr: any) {
          return jsonResponse({ error: updateErr?.message || "Failed to update odds", matchId }, 500);
        }
      }

      case "suspendMarket": {
        if (!matchId) return jsonResponse({ error: "matchId is required" }, 400);
        try {
          await col.updateOne(
            { matchId },
            { $set: { isSuspended: !!isSuspended, lastUpdated: new Date() } },
            { upsert: true }
          );
          const doc = await col.findOne({ matchId });
          return jsonResponse({ success: true, odds: doc });
        } catch (suspendErr: any) {
          return jsonResponse({ error: suspendErr?.message || "Failed to suspend market", matchId }, 500);
        }
      }

      case "validateOdds": {
        if (!matchId) return jsonResponse({ error: "matchId is required" }, 400);
        try {
          const doc = await col.findOne({ matchId });
          if (!doc) return jsonResponse({ valid: false, reason: "Market not found" });
          if (doc.isSuspended) return jsonResponse({ valid: false, reason: "Market is suspended" });

          const requestedOdds = typeof body.requestedOdds === "number" ? body.requestedOdds : parseFloat(String(body.requestedOdds || 0));
          const side = body.side;

          if (!side || typeof side !== "string") {
            return jsonResponse({ valid: true, currentOdds: requestedOdds });
          }

          const currentOdds = doc[side];
          if (currentOdds == null) {
            return jsonResponse({ valid: true, currentOdds: requestedOdds });
          }

          const numCurrentOdds = Number(currentOdds);
          const diff = Math.abs((numCurrentOdds - requestedOdds) / requestedOdds);
          if (diff > 0.05) {
            return jsonResponse({ valid: false, reason: "Odds have changed", currentOdds: numCurrentOdds });
          }

          return jsonResponse({ valid: true, currentOdds: numCurrentOdds });
        } catch (valErr: any) {
          return jsonResponse({ error: valErr?.message || "Validation failed", matchId }, 500);
        }
      }

      default:
        return jsonResponse({ error: `Unknown action: '${action}'` }, 400);
    }
  } catch (outerErr: any) {
    console.error("[odds-engine] Unhandled exception:", outerErr?.message || outerErr);
    return jsonResponse({ error: outerErr?.message || "Internal server error" }, 500);
  }
});
