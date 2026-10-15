import {test} from 'node:test';
import assert from 'node:assert/strict';
import {configFor,createOutcome,handScore,compare,shuffledDeck,rank} from '../supabase/functions/teenpatti-studio/engine.ts';
import {studioGames} from '../src/features/teenpatti/catalog.ts';
const card=(rank,suit=0)=>suit*13+rank-2;
test('catalog contains all 38 unique reference names and exactly supported tables',()=>{
 assert.equal(studioGames.length,38);assert.equal(new Set(studioGames.map(x=>x.id)).size,38);
 for(const g of studioGames)assert.equal(!!configFor(g.id),g.playable,g.name);
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
   if(game.id==='9030')assert.equal(o.winner,o.groups[0].value);
  }
 }
 assert.throws(()=>createOutcome('9022'),/unavailable/);
});
