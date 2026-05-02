import { MongoClient, ObjectId } from "npm:mongodb@6.3.0";

const MONGODB_URI = Deno.env.get("MONGODB_URI") || "";
const DB_NAME = "bpexch";
const COLLECTION = "live_odds";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let client: MongoClient | null = null;

async function getDb() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client.db(DB_NAME).collection(COLLECTION);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, matchId, odds, isSuspended, matchMeta } = body;
    const col = await getDb();

    // ── GET single match odds ──────────────────────────────
    if (action === "getOdds") {
      if (!matchId) return json({ error: "matchId required" }, 400);
      const doc = await col.findOne({ matchId });
      return json({ odds: doc || null });
    }

    // ── GET all live match odds ────────────────────────────
    if (action === "getAllOdds") {
      const docs = await col.find({}).toArray();
      return json({ odds: docs });
    }

    // ── INIT odds for a match (upsert) ────────────────────
    if (action === "initOdds") {
      if (!matchId) return json({ error: "matchId required" }, 400);
      const existing = await col.findOne({ matchId });
      if (!existing) {
        await col.insertOne({
          matchId,
          teamA_back: odds?.teamA_back ?? 1.90,
          teamA_lay: odds?.teamA_lay ?? 2.00,
          teamB_back: odds?.teamB_back ?? 1.90,
          teamB_lay: odds?.teamB_lay ?? 2.00,
          isSuspended: false,
          lastUpdated: new Date(),
          ...matchMeta,
        });
      }
      const doc = await col.findOne({ matchId });
      return json({ odds: doc });
    }

    // ── UPDATE odds ───────────────────────────────────────
    if (action === "updateOdds") {
      if (!matchId) return json({ error: "matchId required" }, 400);
      const update: any = { lastUpdated: new Date() };
      if (odds?.teamA_back != null) update.teamA_back = Number(odds.teamA_back);
      if (odds?.teamA_lay != null)  update.teamA_lay  = Number(odds.teamA_lay);
      if (odds?.teamB_back != null) update.teamB_back = Number(odds.teamB_back);
      if (odds?.teamB_lay != null)  update.teamB_lay  = Number(odds.teamB_lay);
      if (matchMeta) Object.assign(update, matchMeta);

      await col.updateOne(
        { matchId },
        { $set: update },
        { upsert: true }
      );
      const doc = await col.findOne({ matchId });
      return json({ success: true, odds: doc });
    }

    // ── SUSPEND / UNSUSPEND ───────────────────────────────
    if (action === "suspendMarket") {
      if (!matchId) return json({ error: "matchId required" }, 400);
      await col.updateOne(
        { matchId },
        { $set: { isSuspended: !!isSuspended, lastUpdated: new Date() } },
        { upsert: true }
      );
      const doc = await col.findOne({ matchId });
      return json({ success: true, odds: doc });
    }

    // ── VALIDATE odds at bet placement ────────────────────
    if (action === "validateOdds") {
      if (!matchId) return json({ error: "matchId required" }, 400);
      const doc = await col.findOne({ matchId });
      if (!doc) return json({ valid: false, reason: "Market not found" });
      if (doc.isSuspended) return json({ valid: false, reason: "Market suspended" });
      const { requestedOdds, side } = body; // side: 'teamA_back' | 'teamA_lay' | 'teamB_back' | 'teamB_lay'
      const currentOdds = doc[side];
      const diff = Math.abs((currentOdds - requestedOdds) / requestedOdds);
      if (diff > 0.05) { // >5% change = reject
        return json({ valid: false, reason: "Odds have changed", currentOdds });
      }
      return json({ valid: true, currentOdds });
    }

    return json({ error: "Unknown action" }, 400);

  } catch (err: any) {
    console.error("[odds-engine]", err.message);
    return json({ error: err.message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
