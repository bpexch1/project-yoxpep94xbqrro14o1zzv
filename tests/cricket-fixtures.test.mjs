import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeCricketMatches } from '../supabase/functions/cricket-feed/normalize.ts';

test('provider fixtures keep real IDs and timing without inventing odds', () => {
  const rows = normalizeCricketMatches({ data: [
    { id: 'provider-1', teams: ['Pakistan', 'Australia'], dateTimeGMT: '2026-11-01T10:00:00', matchStarted: false, matchEnded: false },
    { id: 'provider-2', teams: ['Oman', 'Afghanistan'], dateTimeGMT: '2026-10-31T10:00:00', matchStarted: true, matchEnded: false, score: [{ inning: 'Oman', r: 112, w: 4, o: 15.2 }] },
    { id: 'provider-1', teams: ['Duplicate', 'Fixture'] },
  ] });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, 'cricketdata:provider-1');
  assert.equal(rows[0].startsAt, '2026-11-01T10:00:00.000Z');
  assert.equal(rows[0].status, 'upcoming');
  assert.equal(rows[1].status, 'live');
  assert.equal(rows[1].scores[0].runs, 112);
  assert.equal(rows[0].marketStatus, 'SUSPENDED');
  assert.equal('odds' in rows[0], false);
});

test('invalid provider data does not become a fixture', () => {
  assert.throws(() => normalizeCricketMatches({ data: null }));
  assert.deepEqual(normalizeCricketMatches({ data: [{ id: 'x', teams: ['Only One'] }] }), []);
});
