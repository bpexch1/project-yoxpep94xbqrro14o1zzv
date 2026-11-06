import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableQuoteSize, isFreshMarket } from '../src/services/marketFreshness.ts';

const now = Date.parse('2026-11-06T14:00:00Z');
const market = { status: 'OPEN', delayed: false, observed_at: new Date(now - 1000).toISOString() };
test('market freshness rejects future, stale, delayed and suspended snapshots', () => {
  assert.equal(isFreshMarket(market, now), true);
  for (const change of [
    { observed_at: new Date(now + 1000).toISOString() },
    { observed_at: new Date(now - 15000).toISOString() },
    { observed_at: 'invalid' }, { delayed: true }, { status: 'SUSPENDED' }, { betting_locked: true },
  ]) assert.equal(isFreshMarket({ ...market, ...change }, now), false);
});
test('displayed quote liquidity excludes local consumption and expired quotes', () => {
  const quote = { size: 100, consumed: 65, observed_at: market.observed_at };
  assert.equal(availableQuoteSize(quote, now), 35);
  assert.equal(availableQuoteSize({ ...quote, consumed: 120 }, now), 0);
  assert.equal(availableQuoteSize({ ...quote, observed_at: new Date(now - 15000).toISOString() }, now), 0);
  assert.equal(availableQuoteSize({ ...quote, observed_at: new Date(now + 1).toISOString() }, now), 0);
});
