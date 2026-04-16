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
    const appId = Deno.env.get('SUPERDEV_APP_ID') ?? '';
    
    const superdev = createSuperdevClient({ appId });

    // Try to set auth from request header if available and not expired
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const userToken = authHeader.replace('Bearer ', '').trim();
    if (userToken) {
      superdev.auth.setToken(userToken);
    }

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

    if (tabType === 'cash') {
      beforeBalance = beforeCash ?? 0;
      afterBalance = transactionType === 'deposit' ? beforeBalance + amount : beforeBalance - amount;
      clientUpdateData = { cash: afterBalance };
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
        clientUpdateData = { credit_remaining: afterBalance };
      }
    }

    // Use .entity() method instead of .entities property
    const TransactionEntity = superdev.entity('Transaction');
    const ClientEntity = superdev.entity('Client');

    await TransactionEntity.create({
      client_username: clientUsername,
      type: tabType,
      amount: txAmount,
      description: description || '',
      before_balance: beforeBalance,
      after_balance: afterBalance,
    });

    await ClientEntity.update(clientId, clientUpdateData);

    return new Response(JSON.stringify({ success: true, afterBalance }), {
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
