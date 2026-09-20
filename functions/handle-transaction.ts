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
      clientId,                // Downline User ID
      clientUsername,          // Downline Username
      tabType,                 // 'cash' | 'credit'
      transactionType,         // 'deposit' | 'withdraw'
      amount,                  // Amount
      description,
      beforeCash = 0,
      beforeCreditRemaining = 0,
      beforeBalanceUpline = 0,
      dealerId,                // Upline/Admin ID
      dealerCash = 0,          // Upline ka current Cash balance
      dealerCreditRemaining = 0, // Upline ka current Credit Remaining balance
    } = body;

    if (!clientId || !clientUsername || !tabType || !transactionType || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid input parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const txAmount = transactionType === 'deposit' ? amount : -amount;
    let beforeBalance: number = 0;
    let afterBalance: number = 0;
    
    let clientUpdateData: Record<string, any> = {};
    let dealerUpdateData: Record<string, any> = {};

    // =============================================================
    // 1. CREDIT TRANSACTIONS LOGIC (BPEXCH Rules)
    // =============================================================
    if (tabType === 'credit') {
      if (transactionType === 'deposit') {
        // Validation: Upline ke pass kafi Credit Remaining hona chahiye
        if (amount > dealerCreditRemaining) {
          return new Response(
            JSON.stringify({
              error: `Max available credit is ${dealerCreditRemaining}`,
              available: dealerCreditRemaining,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        beforeBalance = beforeCreditRemaining;
        afterBalance = beforeBalance + amount;

        // NOTE: credit_received box NOT updated (fixed rehta hai)
        clientUpdateData = {
          credit_remaining: afterBalance,
        };

        // Upline ka credit deduct hoga
        dealerUpdateData = {
          credit_remaining: dealerCreditRemaining - amount,
        };
      } else {
        // Credit Withdrawal
        if (amount > beforeCreditRemaining) {
          return new Response(
            JSON.stringify({
              error: 'Insufficient credit balance to withdraw',
              available: beforeCreditRemaining,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        beforeBalance = beforeCreditRemaining;
        afterBalance = Math.max(0, beforeBalance - amount);

        clientUpdateData = {
          credit_remaining: afterBalance,
        };

        // Upline ka credit restore hoga
        dealerUpdateData = {
          credit_remaining: dealerCreditRemaining + amount,
        };
      }
    }

    // =============================================================
    // 2. CASH TRANSACTIONS LOGIC (BPEXCH Rules)
    // =============================================================
    if (tabType === 'cash') {
      if (transactionType === 'deposit') {
        beforeBalance = beforeCash;
        afterBalance = beforeBalance + amount;
        const newBalanceUpline = beforeBalanceUpline + amount;

        clientUpdateData = {
          cash: afterBalance,
          balance_upline: newBalanceUpline,
        };

        // Downline ko Cash deposit karne par Upline ka Cash deduct/minus ho jata hai
        dealerUpdateData = {
          cash: dealerCash - amount,
        };
      } else {
        // Cash Withdrawal
        if (amount > beforeCash) {
          return new Response(
            JSON.stringify({
              error: 'Insufficient cash balance to withdraw',
              available: beforeCash,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        beforeBalance = beforeCash;
        afterBalance = Math.max(0, beforeBalance - amount);
        const newBalanceUpline = Math.max(0, beforeBalanceUpline - amount);

        clientUpdateData = {
          cash: afterBalance,
          balance_upline: newBalanceUpline,
        };

        // Upline ka Cash balance recover hota hai
        dealerUpdateData = {
          cash: dealerCash + amount,
        };
      }
    }

    // =============================================================
    // 3. EXECUTE DATABASE UPDATES
    // =============================================================
    const txData = {
      client_username: clientUsername,
      type: tabType,
      amount: txAmount,
      description: description || '',
      before_balance: beforeBalance,
      after_balance: afterBalance,
    };

    const tokensToTry: string[] = [];
    const serviceKey =
      Deno.env.get('SUPERDEV_SERVICE_KEY') ||
      Deno.env.get('SUPERDEV_API_KEY') ||
      Deno.env.get('SUPERDEV_SECRET_KEY') ||
      Deno.env.get('SUPERDEV_ADMIN_KEY') ||
      '';
    if (serviceKey) tokensToTry.push(serviceKey);

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const userToken = authHeader.replace('Bearer ', '').trim();
    if (userToken) tokensToTry.push(userToken);
    tokensToTry.push('');

    let lastError: string = '';
    let succeeded = false;

    for (const token of tokensToTry) {
      try {
        const superdev = createSuperdevClient({ appId });
        if (token) superdev.auth.setToken(token);

        const TxEntity = superdev.entity('Transaction');
        const ClientEntity = superdev.entity('Client');

        // Transaction history record create karna
        await TxEntity.create(txData);

        // Downline Client update karna
        await ClientEntity.update(clientId, clientUpdateData);

        // Upline Dealer update karna (agar dealerId di ho)
        if (dealerId && Object.keys(dealerUpdateData).length > 0) {
          await ClientEntity.update(dealerId, dealerUpdateData);
        }

        succeeded = true;
        break;
      } catch (e: any) {
        lastError = e?.message ?? 'Unknown error';
        console.error(`Token attempt failed:`, lastError);
      }
    }

    if (!succeeded) {
      return new Response(JSON.stringify({ error: lastError || 'Transaction failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        afterBalance,
        balanceUpline: clientUpdateData.balance_upline ?? beforeBalanceUpline,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('handle-transaction error:', err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
