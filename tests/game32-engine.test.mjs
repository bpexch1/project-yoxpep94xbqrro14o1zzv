import test from "node:test";
import assert from "node:assert/strict";
import {
  GAME32_PLAYERS, cardRank, commitmentFor, revealOutcome, resolveGame32,
  game32Settlement, game32VisibleCards,
  secureDeck, validGame32Deck,
} from "../supabase/functions/game32/engine.ts";

const card = (rank, suit = 0) => suit * 13 + rank - 2;

test("secure 32-card deck contains each 6-through-K card exactly once", () => {
  for (let i = 0; i < 100; i++) {
    const deck = secureDeck();
    assert.equal(validGame32Deck(deck), true);
    assert.equal(new Set(deck).size, 32);
    assert.ok(deck.every(value => cardRank(value) >= 6 && cardRank(value) <= 13));
  }
});

test("base values 8, 9, 10 and 11 determine the highest total", () => {
  const first = [card(6), card(6, 1), card(13), card(11)];
  const rest = secureDeck(() => 0).filter(value => !first.includes(value));
  const result = resolveGame32([...first, ...rest]);
  assert.equal(result.winner, "10");
  assert.deepEqual(GAME32_PLAYERS, ["8", "9", "10", "11"]);
});

test("a tied high score deals one extra card to each tied player", () => {
  const start = [card(13), card(12), card(11), card(10), card(6), card(8), card(7), card(6, 1)];
  const rest = secureDeck(() => 0).filter(value => !start.includes(value));
  const result = resolveGame32([...start, ...rest]);
  assert.equal(result.winner, "9");
  assert.deepEqual(result.groups.map(group => group.cards.length), [2, 2, 2, 2]);
});

test("public outcome reveals cards one at a time and hides winner until complete", () => {
  const outcome = resolveGame32(secureDeck(() => 0));
  const one = revealOutcome(outcome, 1, false);
  assert.equal(one.groups.reduce((sum, group) => sum + group.cards.length, 0), 1);
  assert.equal(one.winner, null);
  const all = revealOutcome(outcome, 32, true);
  assert.equal(all.winner, outcome.winner);
});

test("round commitment changes with deck or nonce", async () => {
  const deck = secureDeck(() => 0);
  assert.notEqual(await commitmentFor(deck, "a"), await commitmentFor(deck, "b"));
  const changed = [...deck]; [changed[0], changed[1]] = [changed[1], changed[0]];
  assert.notEqual(await commitmentFor(deck, "a"), await commitmentFor(changed, "a"));
});

test("committed deck deterministically reproduces every card and winner", async () => {
  const deck = secureDeck();
  const nonce = "a".repeat(48);
  const commitment = await commitmentFor(deck, nonce);
  const result = resolveGame32(deck);
  const dealt = result.groups.flatMap(group => group.cards);
  assert.ok(dealt.every(card => deck.includes(card)));
  assert.equal(new Set(dealt).size, dealt.length);
  assert.deepEqual(resolveGame32([...deck]), result);
  assert.equal(await commitmentFor([...deck], nonce), commitment);
  const changed = [...deck]; [changed[0], changed[1]] = [changed[1], changed[0]];
  assert.notEqual(await commitmentFor(changed, nonce), commitment);
});

test("a tie is resolved from the next committed deck cards", () => {
  const first = [card(13), card(12), card(11), card(10)];
  const rest = secureDeck(() => 0).filter(value => !first.includes(value));
  const result = resolveGame32([...first, ...rest]);
  assert.ok(result.groups.some(group => group.cards.length > 1));
  assert.ok(result.winner === null || GAME32_PLAYERS.includes(result.winner));
});

test("reservation and payout reconcile for back, lay, loss and void", () => {
  const cases = [
    ["back",100,3.2,true,false,100,220,320,"won"],
    ["back",100,3.2,false,false,100,-100,0,"lost"],
    ["lay",100,3.45,true,false,245,-245,0,"lost"],
    ["lay",100,3.45,false,false,245,100,345,"won"],
    ["back",100,3.2,false,true,100,0,100,"void"],
    ["lay",100,3.45,true,true,245,0,245,"void"],
  ];
  for (const [side,stake,odds,win,voidRound,reserved,profit,payout,status] of cases) {
    assert.deepEqual(game32Settlement(side,stake,odds,win,voidRound),{reserved,profit,payout,status});
    assert.equal(-reserved+payout,profit);
  }
});

test("20 second betting boundary and one card per second timing", () => {
  const start = 1_000_000, close = start + 20_000;
  assert.equal(start + 19_999 < close,true);
  assert.equal(close < close,false);
  assert.equal(game32VisibleCards(close-1,close,4),0);
  assert.deepEqual([0,999,1000,1999,2000,3000,4000].map(t => game32VisibleCards(close+t,close,4)),[1,1,2,2,3,4,4]);
});
