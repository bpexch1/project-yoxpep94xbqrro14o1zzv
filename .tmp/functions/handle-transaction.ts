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

    // Check for available service-level keys (auto-injected by Buildy for backend functions)
    const serviceKey = Deno.env.get('SUPERDEV_SERVICE_KEY') 
      || Deno.env.get('SUPERDEV_API_KEY')
      || Deno.env.get('SUPERDEV_SECRET_KEY')
      || Deno.env.get('SUPERDEV_ADMIN_KEY')
      || '';

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

    const txData = {
      client_username: clientUsername,
      type: tabType,
      amount: txAmount,
      description: description || '',
      before_balance: beforeBalance,
      after_balance: afterBalance,
    };

    // Try approach 1: service key if available
    if (serviceKey) {
      const superdev = createSuperdevClient({ appId });
      superdev.auth.setToken(serviceKey);
      const TxEntity = superdev.entity('Transaction');
      const ClientEntity = superdev.entity('Client');
      await TxEntity.create(txData);
      await ClientEntity.update(clientId, clientUpdateData);
    } else {
      // Approach 2: user token from request headers
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
      const userToken = authHeader.replace('Bearer ', '').trim();

      const superdev = createSuperdevClient({ appId });
      if (userToken) {
        superdev.auth.setToken(userToken);
      }
      
      const TxEntity = superdev.entity('Transaction');
      const ClientEntity = superdev.entity('Client');
      await TxEntity.create(txData);
      await ClientEntity.update(clientId, clientUpdateData);
    }

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
