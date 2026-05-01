import { MongoClient } from 'npm:mongodb@6';
import { createSuperdevClient } from 'npm:@superdevhq/client@latest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

  try {
    const body = await req.json();
    // matchId: string, winningSide: string (team name that won, or "draw")
    // token: optional auth token from client
    const { matchId, winningSide, token } = body;

    if (!matchId || !winningSide) {
      return new Response(JSON.stringify({ error: 'matchId and winningSide are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Connect to MongoDB Atlas ---
    const mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db(); // uses DB from connection string
    const plRecords = db.collection('pl_records');
    const betRecords = db.collection('bets');

    // --- Connect to Buildy entity system ---
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const userToken = token || authHeader.replace('Bearer ', '').trim();
    const superdev = createSuperdevClient({ appId });
    if (userToken) superdev.auth.setToken(userToken);

    const BetEntity = superdev.entity('Bet');
    const ClientEntity = superdev.entity('Client');
    const MatchEntity = superdev.entity('Match');

    // --- Fetch all pending bets for this match ---
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

    // --- Update match status to completed ---
    try {
      await MatchEntity.update(matchId, { status: 'completed' });
    } catch (_) { /* ignore match update errors */ }

    const settlements: any[] = [];
    const clientPlMap: Map<string, { downline: number; upline: number; username: string; clientId: string }> = new Map();

    // --- Calculate P/L for each bet ---
    for (const bet of bets as any[]) {
      const stake = bet.stake ?? 0;
      const odds = bet.odds ?? 1;
      const betType = bet.bet_type ?? 'back'; // 'back' or 'lay'
      const selection = bet.selection ?? '';
      const userEmail = bet.user_email ?? '';

      let pl = 0; // positive = win, negative = loss
      const didWin = selection === winningSide;

      if (betType === 'back') {
        pl = didWin ? stake * (odds - 1) : -stake;
      } else {
        // lay bet: if selection wins → layer loses (pays odds-1 per stake unit); if selection loses → layer wins the stake
        pl = didWin ? -(stake * (odds - 1)) : stake;
      }

      // 85% stays with downline (client), 15% goes to upline
      const plDownline = parseFloat((pl * 0.85).toFixed(2));
      const plUpline = parseFloat((pl * 0.15).toFixed(2));

      const newStatus = didWin ? 'won' : 'lost';

      // Update bet status in Buildy
      try {
        await BetEntity.update(bet.id, { status: newStatus });
      } catch (_) {}

      // Sync bet to MongoDB bets collection
      await betRecords.updateOne(
        { buildy_id: bet.id },
        { $set: {
          buildy_id: bet.id,
          match_id: matchId,
          user_email: userEmail,
          selection,
          bet_type: betType,
          stake,
          odds,
          pl,
          pl_downline: plDownline,
          pl_upline: plUpline,
          status: newStatus,
          winning_side: winningSide,
          settled_at: new Date(),
        }},
        { upsert: true }
      );

      // Accumulate P/L per client (by email)
      if (userEmail) {
        const existing = clientPlMap.get(userEmail) || { downline: 0, upline: 0, username: userEmail, clientId: '' };
        existing.downline += plDownline;
        existing.upline += plUpline;
        clientPlMap.set(userEmail, existing);
      }

      settlements.push({ betId: bet.id, status: newStatus, pl, plDownline, plUpline });
    }

    // --- Update Client P/L in Buildy entity + save to MongoDB pl_records ---
    for (const [email, plData] of clientPlMap.entries()) {
      // Find client by email (created_by = email)
      let clients: any[] = [];
      try {
        clients = await ClientEntity.query().where('created_by', email).limit(1).exec();
        if (!clients || clients.length === 0) {
          // try by username
          clients = await ClientEntity.query().where('username', email).limit(1).exec();
        }
      } catch (_) {}

      if (clients && clients.length > 0) {
        const client = clients[0];
        const newPlDownline = parseFloat(((client.pl_downline ?? 0) + plData.downline).toFixed(2));
        const newBalanceUpline = parseFloat(((client.balance_upline ?? 0) + plData.upline).toFixed(2));

        try {
          await ClientEntity.update(client.id, {
            pl_downline: newPlDownline,
            balance_upline: newBalanceUpline,
          });
        } catch (_) {}

        plData.clientId = client.id;
        plData.username = client.username || email;
      }

      // Save P/L record to MongoDB
      await plRecords.insertOne({
        match_id: matchId,
        winning_side: winningSide,
        user_email: email,
        username: plData.username,
        client_id: plData.clientId,
        pl_total: parseFloat((plData.downline + plData.upline).toFixed(2)),
        pl_downline: parseFloat(plData.downline.toFixed(2)),
        pl_upline: parseFloat(plData.upline.toFixed(2)),
        pl_downline_pct: 85,
        pl_upline_pct: 15,
        settled_at: new Date(),
        created_at: new Date(),
      });
    }

    await mongoClient.close();

    return new Response(JSON.stringify({
      success: true,
      matchId,
      winningSide,
      totalBetsSettled: settlements.length,
      settlements,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('settle-bets error:', err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});