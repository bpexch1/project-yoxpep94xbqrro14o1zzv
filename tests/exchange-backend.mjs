process.on('uncaughtException',e=>{console.error(e.message,e.where||'');process.exit(1)});
// Run with EXCHANGE_PGLITE_ROOT pointing to a scratch installation of @electric-sql/pglite.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.env.EXCHANGE_PGLITE_ROOT;
if(!root) throw new Error('Set EXCHANGE_PGLITE_ROOT to the pglite package directory');
const {PGlite}=await import(pathToFileURL(path.join(root,'dist/index.js')));
const {pgcrypto}=await import(pathToFileURL(path.join(root,'dist/contrib/pgcrypto.js')));
const db=new PGlite({extensions:{pgcrypto}});
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);`);
for(const file of fs.readdirSync('supabase/migrations').sort()) {
 await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 if(file.includes('manual_wallet_transactions')) await db.exec(`insert into clients(username,password,role,cash) values('qa_company',extensions.crypt('TestOnlyPass123',extensions.gen_salt('bf',4)),'company',0)`);
}
await db.exec(`insert into clients(username,password,role,parent_username,cash) values
 ('qa_superadmin',extensions.crypt('TestOnlyPass123',extensions.gen_salt('bf',4)),'superadmin','qa_company',0),
 ('qa_admin',extensions.crypt('TestOnlyPass123',extensions.gen_salt('bf',4)),'admin','qa_superadmin',0),
 ('qa_supermaster',extensions.crypt('TestOnlyPass123',extensions.gen_salt('bf',4)),'supermaster','qa_admin',0),
 ('qa_master',extensions.crypt('TestOnlyPass123',extensions.gen_salt('bf',4)),'master','qa_supermaster',0),
 ('qa_bettor',extensions.crypt('TestOnlyPass123',extensions.gen_salt('bf',4)),'bettor','qa_master',1000),
 ('qa_other',extensions.crypt('TestOnlyPass123',extensions.gen_salt('bf',4)),'bettor','qa_master',1000);`);
const one=async(sql,args=[]) => (await db.query(sql,args)).rows[0];
const login=async(name)=>(await one('select exchange_login($1,$2) data',[name,'TestOnlyPass123'])).data;
const admin=await login('qa_company'), bettor=await login('qa_bettor'), other=await login('qa_other');
const call=async(session,action,input={})=>(await one('select exchange_request($1,$2,$3::jsonb) data',[session.token,action,JSON.stringify(input)])).data;
let checks=0;
async function rejects(fn,pattern) {await assert.rejects(fn,pattern);checks++;}
await rejects(()=>one('select exchange_login($1,$2)',['qa_company','wrong']),/Invalid username/);
await rejects(()=>call({token:'bad'},'account'),/Authentication required/);
assert.equal((await call(bettor,'account')).cash,1000);checks++;
await rejects(()=>call(bettor,'account',{clientId:other.account.id}),/Permission denied/);
const read=await call(admin,'entityRead',{table:'clients',filters:[{method:'eq',column:'username',value:'qa_bettor'}]});
assert.equal(read.length,1);assert.ok(!('password' in read[0]));checks++;
await rejects(()=>call(admin,'entityRead',{table:'clients',filters:[{method:'eq',column:'password',value:'x'}]}),/Invalid query/);
await rejects(()=>call(bettor,'saveClient',{id:bettor.account.id,data:{cash:999999}}),/Self account changes/);
await rejects(()=>call(admin,'saveClient',{id:bettor.account.id,data:{cash:999999}}),/dedicated financial/);
await call(admin,'setCommission',{requestId:crypto.randomUUID(),clientId:bettor.account.id,rate:10,reason:'QA rule'});
async function market(id='1.123',side='back',odds=3) {
 const m={id,eventId:'123',eventName:'QA A v QA B',sport:'cricket',name:'Match Odds',startTime:new Date().toISOString(),status:'OPEN',delayed:false,observedAt:new Date().toISOString(),runners:[{id:'11',name:'QA A'},{id:'22',name:'QA B'}],quotes:[{runnerId:'11',selection:'QA A',side,odds,size:10000}]};
 await one('select exchange_ingest($1::jsonb)',[JSON.stringify([m])]);return m;
}
await market();
const input={requestId:crypto.randomUUID(),marketId:'1.123',runnerId:'11',side:'back',stake:100,odds:3};
const receipt=await call(bettor,'placeBet',input);
assert.equal((await call(bettor,'account')).cash,900);assert.equal(receipt.reserved,100);checks++;
const replay=await call(bettor,'placeBet',input);assert.equal(receipt.id,replay.id);assert.equal((await call(bettor,'account')).cash,900);checks++;
await rejects(()=>call(bettor,'placeBet',{...input,stake:200}),/Request ID conflict/);
await rejects(()=>call(bettor,'placeBet',{...input,requestId:crypto.randomUUID(),stake:-1}),/Invalid bet/);
await rejects(()=>call(bettor,'placeBet',{...input,requestId:crypto.randomUUID(),odds:2}),/Odds changed/);
await rejects(()=>call(bettor,'placeBet',{...input,requestId:crypto.randomUUID(),stake:901}),/Insufficient balance/);
await rejects(()=>call(other,'betStatus',{betId:receipt.id}),/Bet not found/);
await call(admin,'setCommission',{requestId:crypto.randomUUID(),clientId:bettor.account.id,rate:50,reason:'Change after placement'});
await rejects(()=>call(bettor,'settle',{marketId:'1.123',requestId:crypto.randomUUID(),winnerId:'11',reason:'QA result'}),/permission/);
const settlement={marketId:'1.123',requestId:crypto.randomUUID(),winnerId:'11',reason:'QA result'};
await rejects(()=>call(admin,'settle',settlement),/Suspend or close/);
await call(admin,'lockMarket',{marketId:'1.123',requestId:crypto.randomUUID(),locked:true});
await rejects(()=>call(bettor,'placeBet',{...input,requestId:crypto.randomUUID()}),/Market unavailable/);
await call(admin,'settle',settlement);
assert.equal((await call(bettor,'account')).cash,1180);assert.equal((await call(bettor,'betStatus',{betId:receipt.id})).commission_amount,20);checks++;
await call(admin,'settle',settlement);assert.equal((await call(bettor,'account')).cash,1180);checks++;
await rejects(()=>call(admin,'settle',{...settlement,winnerId:'22'}),/Request ID conflict/);
await rejects(()=>call(admin,'settle',{...settlement,requestId:crypto.randomUUID()}),/already settled/);
await market('1.124','lay',4);
const lay=await call(bettor,'placeBet',{...input,requestId:crypto.randomUUID(),marketId:'1.124',side:'lay',odds:4});
assert.equal(lay.reserved,300);assert.equal((await call(bettor,'account')).exposure,300);checks++;
await call(admin,'lockMarket',{marketId:'1.124',requestId:crypto.randomUUID(),locked:true});
await call(admin,'settle',{...settlement,marketId:'1.124',requestId:crypto.randomUUID()});
assert.equal((await call(bettor,'account')).cash,880);assert.equal((await call(bettor,'betStatus',{betId:lay.id})).status,'lost');checks++;
await market('1.125');
const voidBet=await call(bettor,'placeBet',{...input,requestId:crypto.randomUUID(),marketId:'1.125'});
await call(admin,'lockMarket',{marketId:'1.125',requestId:crypto.randomUUID(),locked:true});
await call(admin,'settle',{marketId:'1.125',requestId:crypto.randomUUID(),void:true,reason:'QA abandoned'});
assert.equal((await call(bettor,'account')).cash,880);assert.equal((await call(bettor,'betStatus',{betId:voidBet.id})).status,'void');checks++;
await market('1.126');await db.exec(`update exchange_markets set observed_at=now()-interval '1 minute' where id='1.126'`);
await rejects(()=>call(bettor,'placeBet',{...input,requestId:crypto.randomUUID(),marketId:'1.126'}),/Market unavailable/);
const ledger=await call(bettor,'reports',{kind:'ledger',limit:1});assert.equal(ledger.rows.length,1);assert.equal(ledger.truncated,true);checks++;
await rejects(()=>call(bettor,'reports',{kind:'ledger',clientId:other.account.id}),/Permission denied/);
await rejects(()=>call(bettor,'reports',{kind:'ledger',limit:10001}),/Invalid report/);
const report=await call(bettor,'reports',{kind:'ledger'});assert.equal(report.rows.reduce((s,r)=>s+Number(r.amount),1000),880);checks++;
await db.exec('set role anon');
await rejects(()=>one('select password from clients'),/permission denied/);
await rejects(()=>one(`update clients set cash=999999`),/permission denied/);
await rejects(()=>one(`insert into bets(user_email,match_id) values('qa','qa')`),/permission denied/);
await rejects(()=>one(`select exchange_request('bad','account','{}')`),/permission denied/);
await db.exec('reset role');
await call(bettor,'logout');await rejects(()=>call(bettor,'account'),/Authentication required/);
console.log(`${checks} backend invariant checks passed`);
await db.close();
