
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
  if (client) {
    try {
      await client.db("admin").command({ ping: 1 });
      return client.db(DB_NAME).collection(COLLECTION);
    } catch (e) {
      console.log("[odds-engine] MongoDB connection dead, reconnecting...");
      try { await client.close(); } catch {}
      client = null;
    }
  }
  
  client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 10000,
  });
  await client.connect();
  return client.db(DB_NAME).collection(COLLECTION);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, matchId, odds, isSuspended, matchMeta } = body;
    const col = await getDb();
    const rapidApiKey = Deno.env.get("BETFAIR_RAPIDAPI_KEY");

    switch (action) {
      case "syncFromBetfair": {
        const { betfairEventId } = body;
        if (!matchId || !betfairEventId) return json({ error: "matchId and betfairEventId required" }, 400);
        if (!rapidApiKey) return json({ error: "No API key" }, 400);

        const existing = await col.findOne({ matchId });
        if (existing?.lastManualOverride) {
          const secsSince = (Date.now() - new Date(existing.lastManualOverride).getTime()) / 1000;
          if (secsSince < 60) return json({ odds: existing, skipped: true });
        }

        const res = await fetch(
          `https://betfair-orbitexch-data.p.rapidapi.com/betfair/get_event_with_markets/${betfairEventId}`,
          { headers: { 
            "x-rapidapi-key": rapidApiKey, 
            "x-rapidapi-host": "betfair-orbitexch-data.p.rapidapi.com" 
          } }
        );
        
        if (!res.ok) return json({ odds: existing || null, error: "Betfair API error" });

        const raw = await res.json();
        let rawMarkets = Array.isArray(raw) ? raw : (raw?.markets || raw?.result?.markets || (raw?.market ? [raw.market] : (raw?.marketBook ? [raw.marketBook] : [])));
        const matchOddsMarket = rawMarkets.find((m: any) => (m.marketName || m.MarketName || '').toLowerCase().includes('match odds')) || rawMarkets[0];

        if (!matchOddsMarket) return json({ odds: existing || null, error: "No market found" });

        const runners = matchOddsMarket.runners || matchOddsMarket.runner || [];
        const getOdds = (runner: any, type: 'back' | 'lay') => {
          const list = type === 'back' ? (runner.availableToBack || runner.ex?.availableToBack || runner.back || []) : (runner.availableToLay || runner.ex?.availableToLay || runner.lay || []);
          const price = list[0]?.price ?? list[0]?.Price;
          return typeof price === 'number' ? price : (parseFloat(price) || null);
        };

        const update: any = {
          matchId,
          isSuspended: matchOddsMarket.status === 'SUSPENDED' || matchOddsMarket.status === 'CLOSED',
          autoSynced: true,
          lastUpdated: new Date(),
        };
        
        if (runners[0]) {
          const b = getOdds(runners[0], 'back');
          const l = getOdds(runners[0], 'lay');
          if (b) update.teamA_back = b;
          if (l) update.teamA_lay = l;
        }
        if (runners[1]) {
          const b = getOdds(runners[1], 'back');
          const l = getOdds(runners[1], 'lay');
          if (b) update.teamB_back = b;
          if (l) update.teamB_lay = l;
        }

        if (existing) {
          if (!update.teamA && existing.teamA) update.teamA = existing.teamA;
          if (!update.teamB && existing.teamB) update.teamB = existing.teamB;
        }

        await col.updateOne({ matchId }, { $set: update }, { upsert: true });
        const doc = await col.findOne({ matchId });
        return json({ odds: doc, synced: true });
      }

      case "syncAllFromBetfair": {
        const { matches } = body;
        if (!Array.isArray(matches)) return json({ error: "matches array required" }, 400);
        if (!rapidApiKey) return json({ error: "No API key" }, 400);

        const results = await Promise.allSettled(
          matches.slice(0, 10).map(async (m: any) => {
            const { matchId, betfairEventId } = m;
            const existing = await col.findOne({ matchId });
            if (existing?.lastManualOverride) {
              const secsSince = (Date.now() - new Date(existing.lastManualOverride).getTime()) / 1000;
              if (secsSince < 60) return { matchId, skipped: true };
            }

            const res = await fetch(`https://betfair-orbitexch-data.p.rapidapi.com/betfair/get_event_with_markets/${betfairEventId}`, {
              headers: { "x-rapidapi-key": rapidApiKey, "x-rapidapi-host": "betfair-orbitexch-data.p.rapidapi.com" }
            });
            if (!res.ok) return { matchId, error: "API error" };

            const raw = await res.json();
            let rawMarkets = Array.isArray(raw) ? raw : (raw?.markets || raw?.result?.markets || (raw?.market ? [raw.market] : (raw?.marketBook ? [raw.marketBook] : [])));
            const matchOddsMarket = rawMarkets.find((m: any) => (m.marketName || m.MarketName || '').toLowerCase().includes('match odds')) || rawMarkets[0];
            if (!matchOddsMarket) return { matchId, error: "No market" };

            const runners = matchOddsMarket.runners || matchOddsMarket.runner || [];
            const getOdds = (runner: any, type: 'back' | 'lay') => {
              const list = type === 'back' ? (runner.availableToBack || runner.ex?.availableToBack || runner.back || []) : (runner.availableToLay || runner.ex?.availableToLay || runner.lay || []);
              const price = list[0]?.price ?? list[0]?.Price;
              return typeof price === 'number' ? price : (parseFloat(price) || null);
            };

            const update: any = {
              matchId,
              isSuspended: matchOddsMarket.status === 'SUSPENDED' || matchOddsMarket.status === 'CLOSED',
              autoSynced: true,
              lastUpdated: new Date(),
            };
            if (runners[0]) {
              const b = getOdds(runners[0], 'back');
              const l = getOdds(runners[0], 'lay');
              if (b) update.teamA_back = b;
              if (l) update.teamA_lay = l;
            }
            if (runners[1]) {
              const b = getOdds(runners[1], 'back');
              const l = getOdds(runners[1], 'lay');
              if (b) update.teamB_back = b;
              if (l) update.teamB_lay = l;
            }

            if (existing) {
              if (!update.teamA && existing.teamA) update.teamA = existing.teamA;
              if (!update.teamB && existing.teamB) update.teamB = existing.teamB;
            }

            await col.updateOne({ matchId }, { $set: update }, { upsert: true });
            return { matchId, synced: true };
          })
        );
        return json({ results });
      }

      case "getOdds": {
        if (!matchId) return json({ error: "matchId required" }, 400);
        const doc = await col.findOne({ matchId });
        return json({ odds: doc || null });
      }

      case "getAllOdds": {
        const docs = await col.find({}).toArray();
        return json({ odds: docs });
      }

      case "initOdds": {
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

      case "updateOdds": {
        if (!matchId) return json({ error: "matchId required" }, 400);
        const update: any = { lastUpdated: new Date(), lastManualOverride: new Date() };
        if (odds?.teamA_back != null) update.teamA_back = Number(odds.teamA_back);
        if (odds?.teamA_lay != null)  update.teamA_lay  = Number(odds.teamA_lay);
        if (odds?.teamB_back != null) update.teamB_back = Number(odds.teamB_back);
        if (odds?.teamB_lay != null)  update.teamB_lay  = Number(odds.teamB_lay);
        if (matchMeta) Object.assign(update, matchMeta);
        await col.updateOne({ matchId }, { $set: update }, { upsert: true });
        const doc = await col.findOne({ matchId });
        return json({ success: true, odds: doc });
      }

      case "suspendMarket": {
        if (!matchId) return json({ error: "matchId required" }, 400);
        await col.updateOne({ matchId }, { $set: { isSuspended: !!isSuspended, lastUpdated: new Date() } }, { upsert: true });
        const doc = await col.findOne({ matchId });
        return json({ success: true, odds: doc });
      }

      case "validateOdds": {
        if (!matchId) return json({ error: "matchId required" }, 400);
        const doc = await col.findOne({ matchId });
        if (!doc) return json({ valid: false, reason: "Market not found" });
        if (doc.isSuspended) return json({ valid: false, reason: "Market suspended" });
        const { requestedOdds, side } = body;
        const currentOdds = doc[side];
        if (!currentOdds) return json({ valid: true, currentOdds: requestedOdds }); // Fallback
        const diff = Math.abs((currentOdds - requestedOdds) / requestedOdds);
        if (diff > 0.05) return json({ valid: false, reason: "Odds have changed", currentOdds });
        return json({ valid: true, currentOdds });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("[odds-engine]", err.message);
    return json({ error: err.message }, 500);
  }
});
