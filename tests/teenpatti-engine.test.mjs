import {test} from 'node:test';
import assert from 'node:assert/strict';
import {configFor,createOutcome,handScore,compare,shuffledDeck,rank,score32Cards,resolve32Cards} from '../supabase/functions/teenpatti-studio/engine.ts';
import {studioGames} from '../src/features/teenpatti/catalog.ts';
import {currentRoundMatchedBets,settledRoundBets} from '../src/features/teenpatti/bets.ts';
import {bettingWindowOpen} from '../src/features/teenpatti/roundClock.ts';
const card=(rank,suit=0)=>suit*13+rank-2;
test('bet slip closes before the server cutoff to account for transit time',()=>{
 assert.equal(bettingWindowOpen(25000,23000),true);
 assert.equal(bettingWindowOpen(25000,24000),false);
 assert.equal(bettingWindowOpen(25000,24800),false);
 assert.equal(bettingWindowOpen(NaN,23000),false);
});
test('only bounded demo mechanics accept bets; 34 lobby tiles remain',()=>{const live=studioGames.filter(g=>g.playable);assert.equal(studioGames.length,34);assert.equal(live.length,15);assert.equal(studioGames.filter(g=>g.status==='UNAVAILABLE').length,19);for(const g of live){const c=configFor(g.id);assert.ok(c?.runners.length>0,g.name);assert.equal(g.status,'LIMITED');for(const r of c.runners){assert.ok(r.odds>1&&r.layOdds>=r.odds&&r.layOdds<=1000,g.name);}}for(const id of ['9301','9022','9040','9023','9100','9021'])assert.equal(configFor(id),null,id);});
test('catalog contains only the 34 supplied thumbnail games',()=>{
 assert.equal(studioGames.length,34);assert.equal(new Set(studioGames.map(x=>x.id)).size,34);
 for(const g of studioGames)assert.equal(!!configFor(g.id),g.playable,g.name);
});
test('matched bets stay through ROUND OVER and clear on next round without deleting history',()=>{
 const rows=[{id:'a',round_id:'R1',status:'pending'},{id:'b',round_id:'R1',status:'won'},{id:'c',round_id:'R2',status:'pending'},{id:'d',round_id:'R1',status:'matched'}];
 assert.deepEqual(currentRoundMatchedBets(rows,'R1').map(x=>x.id),['a','b','d']);
 assert.deepEqual(currentRoundMatchedBets(rows,'R2').map(x=>x.id),['c']);
 assert.deepEqual(settledRoundBets(rows,'R1').map(x=>x.id),['b']);
 assert.equal(rows.length,4,'filtering active rows must not delete historical rows');
});
test('32 Cards uses the 6-to-K deck and resolves a highest-total tie with extra cards',()=>{
 const cfg=configFor('9010');assert.deepEqual(cfg.runners.map(x=>x.name),['Player 8','Player 9','Player 10','Player 11']);
 assert.deepEqual(cfg.runners.map(x=>x.id),['8','9','10','11']);
 assert.deepEqual(score32Cards([[card(6)],[card(6,1)],[card(13)],[card(11)]]),[14,15,23,22]);
 assert.deepEqual(score32Cards([[card(13)],[card(12,1)],[card(11,2)],[card(10,3)]]),[21,21,21,21]);
 assert.throws(()=>score32Cards([[card(2)],[card(6)],[card(7)],[card(8)]]),/Invalid/);
 const seed=[card(13),card(12),card(11),card(10),card(6),card(8),card(7),card(6,1)];
 const full=Array.from({length:52},(_,i)=>i).filter(c=>rank(c)>=6&&rank(c)<=13);
 const tied=resolve32Cards([...seed,...full.filter(c=>!seed.includes(c))]);
 assert.equal(tied.winner,'9');assert.deepEqual(tied.groups.map(g=>g.cards.length),[2,2,2,2]);
 assert.deepEqual(tied.groups.map(g=>g.value),['8 + 13 + 6 = 27','9 + 12 + 8 = 29','10 + 11 + 7 = 28','11 + 10 + 6 = 27']);
 for(let n=0;n<100;n++){
  const outcome=createOutcome('9010');const groups=outcome.groups.map(g=>g.cards||[]),cards=groups.flat();
  assert.ok(cards.length>=4&&cards.length<=32);assert.equal(new Set(cards).size,cards.length);
  assert.ok(cards.every(c=>rank(c)>=6&&rank(c)<=13));
  const totals=score32Cards(groups),best=Math.max(...totals),indices=totals.map((t,i)=>t===best?i:-1).filter(i=>i>=0);
  assert.equal(outcome.winner,indices.length===1?String(indices[0]+8):null);
  assert.ok(outcome.winner===null||cfg.runners.some(r=>r.id===outcome.winner));
 }
});
test('each gameplay family has a server-owned timing policy',()=>{
 assert.notDeepEqual(configFor('9010').timing,configFor('9015').timing);
 assert.deepEqual(configFor('9010').timing,{bettingSeconds:20,resultSeconds:10,revealSeconds:7});
 for(const game of studioGames.filter(g=>g.playable)){const timing=configFor(game.id).timing;assert.ok(timing.bettingSeconds>0&&timing.resultSeconds>timing.revealSeconds&&timing.revealSeconds>0,game.name);}
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
   if(game.id==='9007'){const drawn=rank(o.groups[0].cards[0]);assert.equal(o.winner,drawn>7?'1':drawn===7?'2':'3');}
   if(game.id==='9003'){const joker=rank(o.groups[0].cards[0]),ante=rank(o.groups[1].cards[0]);assert.equal(o.winner,ante>joker?'1':ante===joker?'2':'3');}
   if(game.id==='9030'){const matched=cfg.runners.find(r=>r.id===o.winner);assert.equal(matched?.name,o.groups[0].value);}
  }
 }
 assert.throws(()=>createOutcome('9004'),/unavailable/);
});
