import {test} from 'node:test';
import assert from 'node:assert/strict';
import {configFor,createOutcome,handScore,compare,shuffledDeck,rank} from '../supabase/functions/teenpatti-studio/engine.ts';
import {studioGames} from '../src/features/teenpatti/catalog.ts';
import {currentRoundMatchedBets,settledRoundBets} from '../src/features/teenpatti/bets.ts';
const card=(rank,suit=0)=>suit*13+rank-2;
test('34 supplied-thumbnail games are playable with two-sided finite prices',()=>{const live=studioGames.filter(g=>g.playable);assert.equal(live.length,34);for(const g of live){const c=configFor(g.id);assert.ok(c?.runners.length>0,g.name);for(const r of c.runners){assert.ok(r.odds>1&&r.layOdds>=r.odds&&r.layOdds<=1000,g.name);}}});
test('catalog contains only the 34 supplied thumbnail games',()=>{
 assert.equal(studioGames.length,34);assert.equal(new Set(studioGames.map(x=>x.id)).size,34);
 for(const g of studioGames)assert.equal(!!configFor(g.id),g.playable,g.name);
});
test('matched bets are round-scoped and settled results stay separate from history',()=>{
 const rows=[{id:'a',round_id:'R1',status:'pending'},{id:'b',round_id:'R1',status:'won'},{id:'c',round_id:'R2',status:'pending'},{id:'d',round_id:'R1',status:'matched'}];
 assert.deepEqual(currentRoundMatchedBets(rows,'R1').map(x=>x.id),['a','d']);
 assert.deepEqual(settledRoundBets(rows,'R1').map(x=>x.id),['b']);
 assert.equal(rows.length,4,'filtering active rows must not delete historical rows');
});
test('32 Cards exposes the requested runner labels and deals from a 32-card deck',()=>{
 const cfg=configFor('9010');assert.deepEqual(cfg.runners.map(x=>x.name),['Player 8','Player 9','Player 10','Player 11']);
 assert.deepEqual(cfg.runners.map(x=>x.id),['8','9','10','11']);
 for(let n=0;n<100;n++){
  const outcome=createOutcome('9010');const cards=outcome.groups.flatMap(g=>g.cards||[]);
  assert.equal(cards.length,4);assert.equal(new Set(cards).size,4);assert.ok(cards.every(c=>c%13>=5));
  assert.ok(outcome.winner===null||cfg.runners.some(r=>r.id===outcome.winner));
 }
});
test('each gameplay family has a server-owned timing policy',()=>{
 assert.notDeepEqual(configFor('9010').timing,configFor('9022').timing);
 assert.notDeepEqual(configFor('9022').timing,configFor('9030').timing);
 assert.deepEqual(configFor('9030').timing,{bettingSeconds:18,resultSeconds:12});
 for(const game of studioGames){const timing=configFor(game.id).timing;assert.ok(timing.bettingSeconds>0&&timing.resultSeconds>0,game.name);}
});
test('Teen Patti ranking, A23, ties and pair kickers',()=>{
 const trail=[card(5),card(5,1),card(5,2)];
 const sf=[card(12),card(13),card(14)];
 const straight=[card(10),card(11,1),card(12,2)];
 const flush=[card(2),card(9),card(14)];
 const pair=[card(10),card(10,1),card(14,2)];
 const high=[card(3),card(9,1),card(14,2)];
 const order=[trail,sf,straight,flush,pair,high].map(handScore);
 for(let i=1;i<order.length;i++)assert.equal(compare(order[i-1],order[i]),1);
 const a23=handScore([card(14),card(2,1),card(3,2)]);
 assert.equal(compare(a23,handScore([card(13),card(12,1),card(11,2)])),1);
 assert.equal(compare(handScore([card(14),card(13,1),card(12,2)]),a23),1);
 assert.equal(compare(handScore(pair),handScore([card(10,2),card(10,3),card(14)])),0);
});
test('all enabled games return valid outcomes; shuffled decks never repeat cards',()=>{
 for(let n=0;n<80;n++){
  const deck=shuffledDeck();assert.equal(new Set(deck).size,52);
  for(const game of studioGames.filter(g=>g.playable)){
   const cfg=configFor(game.id),o=createOutcome(game.id);
   assert.ok(o.winner===null||cfg.runners.some(r=>r.id===o.winner),game.name);
   const cards=o.groups.flatMap(g=>g.cards||[]);assert.equal(new Set(cards).size,cards.length);
   assert.ok(cards.every(c=>Number.isInteger(c)&&c>=0&&c<52));
   if(game.id==='9002'){
    const joker=rank(o.groups[0].cards[0]),side=o.groups[Number(o.winner)].cards;
    assert.equal(rank(side.at(-1)),joker);
   }
   if(game.id==='9007'){const total=o.groups[0].value.split(' + ').map(Number).reduce((a,b)=>a+b,0);assert.equal(o.winner,total<7?'1':total===7?'2':'3');}
   if(game.id==='9030'){const matched=cfg.runners.find(r=>r.id===o.winner);assert.equal(matched?.name,o.groups[0].value);}
  }
 }
 assert.throws(()=>createOutcome('9004'),/unavailable/);
});
