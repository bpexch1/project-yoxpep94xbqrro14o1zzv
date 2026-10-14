import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20261014200000_multilevel_pl_share_distribution.sql', import.meta.url),
  'utf8',
);

// Model the PostgreSQL numeric round(...,2) policy using integer cents
// and percentage basis points, rounding ties away from zero.
function roundedShare(remainingCents, rateBasisPoints) {
  const product = BigInt(remainingCents) * BigInt(rateBasisPoints);
  const numerator = product < 0n ? -product : product;
  const rounded = (numerator + 5000n) / 10000n;
  return Number(product < 0n ? -rounded : rounded);
}

function distribute(housePlCents, rates) {
  let remaining = housePlCents;
  const entries = rates.map((percent, index) => {
    assert(percent >= 0 && percent <= 100);
    const part = index === rates.length - 1
      ? remaining // Root receives the exact residual, ignoring its configured share.
      : roundedShare(remaining, Math.round(percent * 100));
    remaining -= part;
    return part;
  });
  assert.equal(remaining, 0);
  assert.equal(entries.reduce((sum, value) => sum + value, 0), housePlCents);
  return entries;
}

test('Bettor loses 1000: Master 10%, SuperMaster 85% of remaining, Admin 70%, Company rest', () => {
  assert.deepEqual(distribute(100000, [10,85,70,100]), [10000, 76500, 9450, 4050]);
});

test('Bettor wins 1000: upline liabilities use the same negative shares', () => {
  assert.deepEqual(distribute(-100000, [10,85,70,100]), [-10000, -76500, -9450, -4050]);
});

test('Odd-cent amounts always reconcile exactly without rounding leakage', () => {
  for (const cents of [1, 3, 10001, -1, -3, -10001, 987654321, -987654321]) {
    const amounts = distribute(cents, [33.33,40,15,100]);
    assert.equal(amounts.reduce((a,b)=>a+b,0), cents);
  }
});

test('Single Company parent absorbs the whole P/L; zero share cannot erase remainder', () => {
  assert.deepEqual(distribute(100000,[100]),[100000]);
  assert.deepEqual(distribute(-12345,[0,0,100]),[0,0,-12345]);
});

test('New P/L tables, RLS, non-public function privileges and idempotency are present', () => {
  for(const fragment of [
    'create table if not exists public.exchange_bet_share_snapshot',
    'create table if not exists public.exchange_pl_allocations',
    'enable row level security',
    'revoke all on public.exchange_bet_share_snapshot',
    'grant execute on function public.exchange_distribute_bet_pl',
    'unique (bet_id,account_id)',
    'P/L already allocated for this bet',
    'Missing/invalid P/L snapshot',
    "p_bettor_net_pl<>round(p_bettor_net_pl,2)",
    'if remaining<>0 then',
    'perform public.exchange_snapshot_bet_shares(b.id,a.username)',
    'perform public.exchange_distribute_bet_pl(b.id,pnl-fee,a.username)',
    'Legacy bet lacks funding/commission snapshot'
  ]) assert.ok(migration.includes(fragment), 'Missing SQL safety invariant: '+fragment);
});
