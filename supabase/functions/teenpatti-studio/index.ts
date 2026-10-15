import { createClient } from 'npm:@supabase/supabase-js@2.110.4';
import { configFor, createOutcome } from './engine.ts';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info,x-exchange-session','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try {
  const token=req.headers.get('x-exchange-session');if(!token||token.length>512)return json({error:'Authentication required'},401);
  const raw=await req.text();if(raw.length>4096)return json({error:'Request too large'},413);
  const {action,input={}}=JSON.parse(raw);
  if(!['state','bet'].includes(action))return json({error:'Unknown studio action'},400);
  const config=action==='state'?configFor(String(input.gameId)):null;
  if(action==='state'&&!config)return json({error:'Game unavailable'},400);
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(action==='bet'&&(!uuid.test(input.roundId)||!uuid.test(input.requestId)||!['back','lay'].includes(input.side)||typeof input.runnerId!=='string'||!Number.isFinite(input.stake)||input.stake<=0||input.stake>1000000||!Number.isFinite(input.odds)))return json({error:'Invalid bet parameters'},400);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.rpc('studio_request',{p_token:token,p_action:action,p_input:input,p_config:config,p_outcome:config?createOutcome(config.id):null});
  if(error){const permitted=/^(Authentication required|Bettor account required|Round unavailable|Betting closed|Game unavailable|Invalid bet parameters|Request ID conflict|Betting is disabled|Market unavailable or stale|Odds changed; refresh and confirm|Insufficient quoted liquidity|Insufficient balance)$/;return json({error:permitted.test(error.message)?error.message:'Studio request failed. Retry with the same request ID.'},error.message==='Authentication required'?401:400);}
  return json(data);
 } catch {return json({error:'Invalid request or studio unavailable'},400);}
});
