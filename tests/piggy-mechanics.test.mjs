import test from 'node:test';
import assert from 'node:assert/strict';
import { concatenate, tier, cappedAward } from '../src/features/piggy/mechanics.ts';

test('payline concatenates tokens rather than adding and ignores blanks', () => {
  for (const [tokens, expected] of [[['','10',''],10n],[['','5','0'],50n],[['10','','00'],1000n],[['10','0','00'],10000n],[['','',''],0n]]) assert.equal(concatenate(tokens),expected);
  assert.throws(() => concatenate(['1','bad','0']));
});
test('stake gates match recorded rules', () => {
  for (const [stake,reels,levels,ten,pig] of [[1,2,1,false,'green-pig'],[5,3,2,false,'green-pig'],[10,3,2,true,'green-pig'],[50,3,3,true,'red-pig'],[100,3,3,true,'red-pig']]) {
    const t=tier(stake); assert.equal(t.baseReels,reels); assert.equal(t.bonusLevels,levels); assert.equal(t.specials.includes('10x'),ten); assert.ok(t.specials.includes(pig));
  }
  assert.throws(() => tier(2));
});
test('integer accumulation and award cap reject invalid inputs', () => {
  assert.equal(cappedAward([1n,50n],10n,500n),500n);
  assert.equal(cappedAward([1n,50n],2n,1000n),102n);
  assert.throws(() => cappedAward([-1n],1n,10n));
});
