import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeRoundBets } from '../src/features/teenpatti/activeBets.ts';
const rows=[
 {id:'accepted',round_id:'R2',status:'pending'},
 {id:'matched',round_id:'R2',status:'matched'},
 {id:'settled-current',round_id:'R2',status:'won'},
 {id:'lost-previous',round_id:'R1',status:'lost'},
 {id:'pending-previous',round_id:'R1',status:'pending'},
 {id:'void-previous',round_id:'R1',status:'void'}
];
test('Matched Bets shows only accepted bets in active round, no historical losses',()=>{
 assert.deepEqual(activeRoundBets(rows,'R2').map(x=>x.id),['accepted','matched']);
 assert.equal(activeRoundBets(rows,'R3').length,0);
 assert.deepEqual(activeRoundBets(rows,undefined),[]);
});
test('settled bets leave active view without destroying immutable history',()=>{
 const original=structuredClone(rows);
 const after=rows.map(b=>b.id==='accepted'?{...b,status:'lost'}:b);
 assert.deepEqual(activeRoundBets(after,'R2').map(b=>b.id),['matched']);
 assert.equal(after.length,original.length);
 assert.ok(after.find(b=>b.id==='lost-previous'));
});
