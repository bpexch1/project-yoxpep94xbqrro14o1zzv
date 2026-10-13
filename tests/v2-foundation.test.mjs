import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { handler, __test } = require("../infra/aws/bpexch-v2/src/handler.cjs");
const sql = readFileSync(new URL("../supabase/v2/20261010_01_secure_fresh_schema.sql", import.meta.url), "utf8");
const config = JSON.parse(readFileSync(new URL("../infra/aws/bpexch-v2/cloudformation-staging.json", import.meta.url), "utf8"));
const event=(method,path,body,headers={})=>({requestContext:{http:{method}},rawPath:path,headers,body:body?JSON.stringify(body):""});

test("V2 six-role chain is Company → SuperAdmin → Admin → SuperMaster → Master → Bettor",()=>{
 assert.deepEqual(__test.ROLES,{company:"superadmin",superadmin:"admin",admin:"supermaster",supermaster:"master",master:"bettor",bettor:null});
 assert.doesNotMatch(sql,/when 'dealer'/);
 assert.match(sql,/when 'master' then 'bettor'/);
});
test("No legacy client or financial tables are imported or touched by V2 schema",()=>{
 assert.match(sql,/create table public.v2_profiles/);
 assert.match(sql,/create table public.v2_wallets/);
 assert.match(sql,/create table public.v2_ledger/);
 assert.doesNotMatch(sql,/delete from public.clients|truncate public.clients|drop table public.clients/i);
});
test("Health is readable, but no V2 token endpoints are usable without approved secret",async()=>{
 const v=await handler(event("GET","/v2/health"));
 assert.equal(v.statusCode,200);
 assert.equal(JSON.parse(v.body).backendConfigured,false);
 assert.equal((await handler(event("POST","/v2/auth/login",{username:"tester",password:"123456789012"}))).statusCode,503);
 assert.equal((await handler(event("POST","/v2/wallet/transfer",{targetId:"wrong"}))).statusCode,503);
});
test("Unknown path and unsupported verbs are rejected",async()=>{
 assert.equal((await handler(event("GET","/another"))).statusCode,404);
 assert.equal((await handler(event("PATCH","/v2/ledger"))).statusCode,405);
});
test("Origin is allowlisted, never wildcard CORS",async()=>{
 const wrong=await handler(event("OPTIONS","/v2/auth/login",undefined,{origin:"https://evil.example"}));
 assert.equal(wrong.statusCode,403);
 assert.equal(wrong.headers["access-control-allow-origin"],undefined);
 const allowed=await handler(event("OPTIONS","/v2/auth/login",undefined,{origin:"https://bpexch1.com"}));
 assert.equal(allowed.statusCode,204);
 assert.equal(allowed.headers["access-control-allow-origin"],"https://bpexch1.com");
});
test("No browser role, username or password can set transfer actor; RLS fails closed",()=>{
 const source=readFileSync(new URL("../infra/aws/bpexch-v2/src/handler.cjs", import.meta.url),"utf8");
 assert.match(source,/p_actor:actor\.id/);
 assert.match(source,/role:desiredRole,parent_id:actor\.id/);
 assert.match(source,/await verifyActor\(event,cfg\)/);
 assert.match(sql,/alter table public.v2_profiles enable row level security/);
 assert.match(sql,/alter table public.v2_wallets enable row level security/);
 assert.match(sql,/revoke all on public.v2_profiles,public.v2_wallets,public.v2_transfers,public.v2_ledger from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public.v2_wallet_transfer\(uuid,uuid,text,text,numeric,text,uuid\) to service_role/);
});
test("Ledger uses atomic two-sided entries, conserves funds and is immutable",()=>{
 assert.match(sql,/perform 1 from public.v2_wallets where profile_id in\(p_actor,p_target\) order by profile_id for update/);
 assert.match(sql,/target_after:=target_before\+movement/);
 assert.match(sql,/actor_after:=actor_before-movement/);
 assert.match(sql,/unique\(request_id,profile_id\)/);
 assert.match(sql,/constraint v2_ledger_arithmetic check \(after_balance = before_balance \+ delta\)/);
 assert.match(sql,/create trigger v2_ledger_immutable before update or delete/);
});
test("CloudFormation has strict stage throttles, limited logs, conditionally scoped secrets",()=>{
 assert.equal(config.Resources.BackendFunction.Properties.Timeout,12);
 assert.equal(config.Resources.LogGroup.Properties.RetentionInDays,7);
 assert.equal(config.Resources.Stage.Properties.DefaultRouteSettings.ThrottlingRateLimit,2);
 assert.equal(config.Resources.Stage.Properties.DefaultRouteSettings.ThrottlingBurstLimit,5);
 assert.ok(config.Resources.ExecutionRole.Properties.Policies["Fn::If"]);
 assert.equal(config.Resources.Api.Properties.ProtocolType,"HTTP");
});
