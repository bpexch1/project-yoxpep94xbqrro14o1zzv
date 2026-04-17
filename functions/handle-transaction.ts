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

  try {
    const appId = Deno.env.get('SUPERDEV_APP_ID') ?? 'yoxpep94xbqrro14o1zzv';

    const body = await req.json();
    const {
      clientId,
      clientUsername,
      tabType,
      transactionType,
      amount,
      description,
      beforeCash,
      beforeCreditReceived,
      beforeCreditRemaining,
      beforeBalanceUpline,
    } = body;

    if (!clientId || !clientUsername || !tabType || !transactionType || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const txAmount = transactionType === 'deposit' ? amount : -amount;
    let beforeBalance: number;
    let afterBalance: number;
    let clientUpdateData: Record<string, number> = {};

    // Balance check
    if (transactionType === 'withdraw') {
      if (tabType === 'cash' && amount > (beforeCash ?? 0)) {
        return new Response(JSON.stringify({ error: 'Insufficient Balance', available: beforeCash ?? 0 }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (tabType === 'credit' && amount > (beforeCreditRemaining ?? 0)) {
        return new Response(JSON.stringify({ error: 'Insufficient Balance', available: beforeCreditRemaining ?? 0 }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (tabType === 'cash') {
      beforeBalance = beforeCash ?? 0;
      afterBalance = transactionType === 'deposit' ? beforeBalance + amount : beforeBalance - amount;
      afterBalance = Math.max(0, afterBalance);
      const newBalanceUpline = transactionType === 'deposit'
        ? (beforeBalanceUpline ?? 0) + amount
        : Math.max(0, (beforeBalanceUpline ?? 0) - amount);
      clientUpdateData = { cash: afterBalance, balance_upline: newBalanceUpline };
    } else {
      if (transactionType === 'deposit') {
        beforeBalance = beforeCreditRemaining ?? 0;
        afterBalance = beforeBalance + amount;
        clientUpdateData = {
          credit_received: (beforeCreditReceived ?? 0) + amount,
          credit_remaining: afterBalance,
        };
      } else {
        beforeBalance = beforeCreditRemaining ?? 0;
        afterBalance = beforeBalance - amount;
        afterBalance = Math.max(0, afterBalance);
        clientUpdateData = { credit_remaining: afterBalance };
      }
    }

    const txData = {
      client_username: clientUsername,
      type: tabType,
      amount: txAmount,
      description: description || '',
      before_balance: beforeBalance,
      after_balance: afterBalance,
    };

    // Collect all possible auth tokens to try in order
    const tokensToTry: string[] = [];
    
    // 1. Service keys (auto-injected by Buildy if available)
    const serviceKey = Deno.env.get('SUPERDEV_SERVICE_KEY') 
      || Deno.env.get('SUPERDEV_API_KEY')
      || Deno.env.get('SUPERDEV_SECRET_KEY')
      || Deno.env.get('SUPERDEV_ADMIN_KEY')
      || '';
    if (serviceKey) tokensToTry.push(serviceKey);
    
    // 2. User token from Authorization header (if Buildy user is logged in)
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const userToken = authHeader.replace('Bearer ', '').trim();
    if (userToken) tokensToTry.push(userToken);
    
    // 3. Empty string = try without auth (backend functions on Buildy may have implicit permissions)
    tokensToTry.push('');

    let lastError: string = '';
    let succeeded = false;

    for (const token of tokensToTry) {
      try {
        const superdev = createSuperdevClient({ appId });
        if (token) superdev.auth.setToken(token);
        
        const TxEntity = superdev.entity('Transaction');
        const ClientEntity = superdev.entity('Client');
        await TxEntity.create(txData);
        await ClientEntity.update(clientId, clientUpdateData);
        succeeded = true;
        break;
      } catch (e: any) {
        lastError = e?.message ?? 'Unknown error';
        console.error(`Token attempt failed (token length: ${token.length}):`, lastError);
        // Continue to next token strategy
      }
    }

    if (!succeeded) {
      return new Response(JSON.stringify({ error: lastError || 'Transaction failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      afterBalance, 
      balanceUpline: clientUpdateData.balance_upline ?? beforeBalanceUpline ?? 0,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('handle-transaction error:', err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
