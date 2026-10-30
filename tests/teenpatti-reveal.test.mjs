import test from 'node:test';
import assert from 'node:assert/strict';
import { progressiveCards, publicCardCount } from '../src/features/teenpatti/reveal.ts';

test('slow polling deals one public card per step and withholds the winner', () => {
  const outcome = {
    winner: '10', summary: 'Player 10 wins',
    groups: [
      { label: 'Player 8', cards: [1, 5], value: '16' },
      { label: 'Player 9', cards: [2], value: '13' },
      { label: 'Player 10', cards: [3], value: '15' },
      { label: 'Player 11', cards: [4], value: '17' },
    ],
  };
  assert.equal(publicCardCount(outcome), 5);
  const steps = Array.from({ length: 6 }, (_, count) => progressiveCards(outcome, count, true));
  assert.deepEqual(steps.slice(0, 5).map(step => step.groups.map(group => group.cards)), [
    [[], [], [], []],
    [[1], [], [], []],
    [[1], [2], [], []],
    [[1], [2], [3], []],
    [[1], [2], [3], [4]],
  ]);
  assert.deepEqual(steps[5].groups[0].cards, [1, 5]);
  assert.ok(steps.slice(0, 5).every(step => step.winner === null && step.groups.every(group => group.value === undefined)));
  assert.equal(steps[5].winner, '10');
});
