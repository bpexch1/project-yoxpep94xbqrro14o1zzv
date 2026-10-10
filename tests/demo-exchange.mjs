import assert from "node:assert/strict";
import { fresh, place, cancel, settle, marketStatus, permit, reserved, available } from "../src/demo/exchangeEngine.ts";

function mustReject(callback,contains) {
 assert.throws(callback, e => e instanceof Error && e.message.includes(contains));
}
const seed=fresh();
assert.equal(seed.orders.length,4);
assert.equal(seed.cash.client,5000);
assert.equal(seed.fills.length,0);
assert.equal(seed.status,"OPEN");

const matched=place(seed,"client","back","Falcons",2.16,100);
assert.equal(seed.orders.length,4,"pure functions must not mutate their input");
assert.equal(matched.fills.length,1);
assert.equal(matched.orders.at(-1).matched,100);
assert.equal(available(matched,"client"),4900);
assert.equal(reserved(matched,"client"),100);
mustReject(()=>place(matched,"client","back","Falcons",2.16,1001),"Stake limit");
mustReject(()=>place(matched,"client","lay","Falcons",100,1000),"Insufficient");

const partially=place(seed,"client","back","Falcons",2.16,500);
assert.equal(partially.orders.at(-1).matched,350);
assert.equal(reserved(partially,"client"),500);
const cancelled=cancel(partially,partially.orders.at(-1).id);
assert.equal(reserved(cancelled,"client"),350);
mustReject(()=>cancel(cancelled,partially.orders.at(-1).id),"No cancellable");

const suspended=marketStatus(seed,"SUSPENDED");
mustReject(()=>place(suspended,"client","back","Falcons",2.16,100),"suspended");
const denied=permit(seed,false);
mustReject(()=>place(denied,"client","back","Falcons",2.16,100),"permission");

const won=settle(matched,"Falcons");
assert.equal(won.status,"SETTLED");
assert.equal(won.cash.client,5113.68);
assert.equal(won.cash.house,1.97);
assert.equal(won.cash.agent,0.35);
assert.equal(reserved(won,"client"),0);
const originalTotal=Object.values(seed.cash).reduce((a,b)=>a+b,0);
const afterTotal=Object.values(won.cash).reduce((a,b)=>a+b,0);
assert.ok(Math.abs(originalTotal-afterTotal)<0.00001,"double-entry financial conservation");
mustReject(()=>settle(won,"Falcons"),"Already settled");
mustReject(()=>place(won,"client","back","Falcons",2.16,100),"settled");

const lay=place(seed,"client","lay","Falcons",2.16,100);
assert.equal(lay.fills.length,1);
assert.equal(reserved(lay,"client"),116);
const layLost=settle(lay,"Falcons");
assert.equal(layLost.cash.client,4884);
assert.equal(Object.values(layLost.cash).reduce((a,b)=>a+b,0),25000);

console.log("PASS: 21 demo matching, exposure, account, settlement and reconciliation assertions");
