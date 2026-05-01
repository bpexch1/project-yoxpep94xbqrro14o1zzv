import { MongoClient } from 'npm:mongodb@6';
import { createSuperdevClient } from 'npm:@superdevhq/client@latest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * MongoDB "users" collection schema:
 * {
 *   username: String,           -- unique identifier
 *   sharePercentage: Number,    -- default 85 (admin share %)
 *   plDownline: Number,         -- Admin's cumulative P/L (85% share) starts at 0
 *   plUpline: Number,           -- Company's cumulative P/L (15% share) starts at 0
 *   balance: Number,            -- current balance
 *   updatedAt: Date
 * }
 *
 * P/L FORMULA (when user loses amount X):
 *   plDownline += X * 0.85   (Admin earns 85% of loss → add to plDownline)
 *   plUpline   -= X * 0.15   (Company 15% is deducted  → subtract from plUpline)
 *
 * P/L FORMULA (when user wins amount X):
 *   plDownline -= X * 0.85   (Admin pays 85% of win → deduct from plDownline)
 *   plUpline   += X * 0.15   (Company pays 15% of win → add to plUpline)
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const mongoUri = Deno.env.get('MONGODB_URI');
  if (!mongoUri) {
    return new Response(JSON.stringify({ error: 'MONGODB_URI not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const appId = Deno.env.get('SUPERDEV_APP_ID') ?? 'yoxpep94xbqrro14o1zzv';

  const mongoClient = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 10000, // fail fast after 10s if can't connect
    connectTimeoutMS: 10000,
  });

  try {
    const body = await req.json();
    const { matchId, winningSide, token } = body;

    if (!matchId || !winningSide) {
      return new Response(JSON.stringify({ error: 'matchId and winningSide are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Connect to MongoDB Atlas ---
    await mongoClient.connect();
    const db = mongoClient.db('bpexch');
    const usersCollection = db.collection('users');
    const plRecordsCollection = db.collection('pl_records');

    // --- Connect to Buildy ---
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const userToken = token || authHeader.replace('Bearer ', '').trim();
    const superdev = createSuperdevClient({ appId });
    if (userToken) superdev.auth.setToken(userToken);

    const BetEntity = superdev.entity('Bet');
    const ClientEntity = superdev.entity('Client');
    const MatchEntity = superdev.entity('Match');

    // --- Fetch pending bets ---
    const bets = await BetEntity.query()
      .where('match_id', matchId)
      .where('status', 'pending')
      .exec();

    if (!bets || bets.length === 0) {
      await mongoClient.close();
      return new Response(JSON.stringify({ message: 'No pending bets found', settled: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Mark match as completed ---
    try { await MatchEntity.update(matchId, { status: 'completed' }); } catch (_) {}

    const settlements: any[] = [];

    for (const bet of bets as any[]) {
      const stake     = bet.stake ?? 0;
      const odds      = bet.odds ?? 1;
      const betType   = bet.bet_type ?? 'back';
      const selection = bet.selection ?? '';
      const username  = bet.user_email ?? 'unknown';

      const didWin = selection === winningSide || (winningSide === 'draw' && selection === 'draw');

      // Raw P/L from the bet
      let pl = 0;
      if (betType === 'back') {
        pl = didWin ? stake * (odds - 1) : -stake;
      } else {
        pl = didWin ? -(stake * (odds - 1)) : stake;
      }

      // pl > 0 means user WON, pl < 0 means user LOST
      const lossAmount = -pl; // positive when user lost
      const sharePercentage = 85;

      // ---- P/L SHARING FORMULA ----
      // When user LOSES (lossAmount > 0):
      //   plDownline += lossAmount * 0.85   (admin earns 85%)
      //   plUpline   -= lossAmount * 0.15   (company 15% deducted)
      // When user WINS (lossAmount < 0, i.e., pl > 0):
      //   plDownline -= winAmount * 0.85    (admin pays 85%)
      //   plUpline   += winAmount * 0.15    (company pays 15%)
      const plDownlineDelta = parseFloat((lossAmount * 0.85).toFixed(2));  // +85% when loss, -85% when win
      const plUplineDelta   = parseFloat((-lossAmount * 0.15).toFixed(2)); // -15% when loss, +15% when win

      const newStatus = didWin ? 'won' : 'lost';

      // --- Update bet status in Buildy ---
      try { await BetEntity.update(bet.id, { status: newStatus }); } catch (_) {}

      // --- Upsert user in MongoDB with findOneAndUpdate + $inc (atomic, no data loss) ---
      const updatedUser = await usersCollection.findOneAndUpdate(
        { username },
        {
          $inc: {
            plDownline: plDownlineDelta,
            plUpline:   plUplineDelta,
            balance:    pl, // add win or subtract loss from balance
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
          returnDocument: 'after',
        }
      );

      // --- Save P/L record for audit ---
      await plRecordsCollection.insertOne({
        match_id:        matchId,
        winning_side:    winningSide,
        username,
        bet_id:          bet.id,
        stake,
        odds,
        bet_type:        betType,
        selection,
        did_win:         didWin,
        pl_raw:          parseFloat(pl.toFixed(2)),
        pl_downline:     plDownlineDelta,
        pl_upline:       plUplineDelta,
        share_pct_admin: sharePercentage,
        share_pct_company: 100 - sharePercentage,
        new_pl_downline: updatedUser?.plDownline ?? 0,
        new_pl_upline:   updatedUser?.plUpline ?? 0,
        settled_at:      new Date(),
      });

      // --- Update Buildy Client entity ---
      try {
        let clients = await ClientEntity.query().where('created_by', username).limit(1).exec() as any[];
        if (!clients?.length) {
          clients = await ClientEntity.query().where('username', username).limit(1).exec() as any[];
        }
        if (clients?.length) {
          const c = clients[0];
          await ClientEntity.update(c.id, {
            pl_downline:   parseFloat(((c.pl_downline ?? 0) + plDownlineDelta).toFixed(2)),
            balance_upline: parseFloat(((c.balance_upline ?? 0) + plUplineDelta).toFixed(2)),
          });
        }
      } catch (_) {}

      settlements.push({
        betId:         bet.id,
        username,
        status:        newStatus,
        stake,
        odds,
        pl_raw:        parseFloat(pl.toFixed(2)),
        pl_downline:   plDownlineDelta,
        pl_upline:     plUplineDelta,
        note:          didWin
          ? `User WON ${pl.toFixed(2)} → Admin pays 85% (${(-plDownlineDelta).toFixed(2)}), Company pays 15% (${(plUplineDelta).toFixed(2)})`
          : `User LOST ${(-pl).toFixed(2)} → Admin earns 85% (+${plDownlineDelta.toFixed(2)}), Company deducted 15% (${plUplineDelta.toFixed(2)})`,
      });
    }

    await mongoClient.close();

    return new Response(JSON.stringify({
      success:          true,
      matchId,
      winningSide,
      totalBetsSettled: settlements.length,
      settlements,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    try { await mongoClient.close(); } catch (_) {}
    const errMsg = err?.message ?? 'Unknown error';
    console.error('settle-bets error:', errMsg, err?.code, err?.codeName);
    return new Response(JSON.stringify({ 
      error: errMsg,
      code: err?.code,
      codeName: err?.codeName,
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
