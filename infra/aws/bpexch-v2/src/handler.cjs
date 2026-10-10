"use strict";

// BPEXCH V2: AWS Lambda HTTP API. Never bundle/store Supabase service keys in frontend.
// Secret JSON: {"SUPABASE_URL":"https://<ref>.supabase.co",
//               "SUPABASE_PUBLISHABLE_KEY":"sb_publishable_...",
//               "SUPABASE_SERVICE_ROLE_KEY":"..."}.
// Requires AWS SecretsManager GetSecretValue permission on V2_CONFIG_SECRET_ARN.
let cachedSecrets;
const ROLES = Object.freeze({
  company: "superadmin", superadmin: "admin", admin: "supermaster",
  supermaster: "master", master: "bettor", bettor: null
});
const userRe = /^[A-Za-z0-9_]{3,32}$/;
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function response(statusCode, payload, origin = "") {
  const allowed = (process.env.V2_ALLOWED_ORIGINS || "https://bpexch1.com")
    .split(",").map(s=>s.trim());
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "vary": "Origin",
  };
  if (origin && allowed.includes(origin)) headers["access-control-allow-origin"] = origin;
  return {statusCode,headers,body:JSON.stringify(payload)};
}
function getOrigin(event) { return event.headers?.origin || event.headers?.Origin || ""; }
function requestMethod(event) { return (event.requestContext?.http?.method || event.httpMethod || "GET").toUpperCase(); }
function requestPath(event) {return event.rawPath || event.path || "/";}
function tokenFrom(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || "";
  const match = /^Bearer ([A-Za-z0-9._~-]{20,5000})$/.exec(header);
  return match ? match[1] : null;
}
function parseBody(event) {
  const raw = event.body || "";
  if (raw.length > 8192) throw Object.assign(new Error("Request too large"),{status:413});
  if (event.isBase64Encoded) throw Object.assign(new Error("Unsupported encoding"),{status:415});
  try {return JSON.parse(raw || "{}");}
  catch { throw Object.assign(new Error("Invalid JSON"),{status:400}); }
}
async function loadSecrets(){
  if(cachedSecrets)return cachedSecrets;
  const arn=process.env.V2_CONFIG_SECRET_ARN;
  if(!arn)throw Error("CONFIGURATION_UNAVAILABLE");
  const {SecretsManagerClient,GetSecretValueCommand}=require("@aws-sdk/client-secrets-manager");
  const client=new SecretsManagerClient({});
  const secret=await client.send(new GetSecretValueCommand({SecretId:arn}));
  const cfg=JSON.parse(secret.SecretString || "{}");
  if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/.test(cfg.SUPABASE_URL || "")
     || !cfg.SUPABASE_SERVICE_ROLE_KEY || !cfg.SUPABASE_PUBLISHABLE_KEY) {
    throw Error("CONFIGURATION_UNAVAILABLE");
  }
  cachedSecrets=cfg;
  return cfg;
}
async function supabaseFetch(cfg, path, options = {}, service = false){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),7500);
  const key=service?cfg.SUPABASE_SERVICE_ROLE_KEY:cfg.SUPABASE_PUBLISHABLE_KEY;
  try{
    const res=await fetch(cfg.SUPABASE_URL.replace(/\/$/,"")+path,{
      ...options,signal:controller.signal,
      headers:{"apikey":key,"authorization":"Bearer "+key,
        "content-type":"application/json",...(options.headers||{})}
    });
    const raw=await res.text();
    let data;
    try{data=raw?JSON.parse(raw):null;}catch{data=null;}
    return {ok:res.ok,status:res.status,data};
  }finally{clearTimeout(timeout);}
}
async function serviceRead(cfg,table,query){
  return supabaseFetch(cfg,"/rest/v1/"+table+"?"+query,{method:"GET"},true);
}
async function verifyActor(event,cfg){
  const token=tokenFrom(event);
  if(!token)return null;
  const user=await supabaseFetch(cfg,"/auth/v1/user",{
    method:"GET",headers:{"authorization":"Bearer "+token}
  });
  if(!user.ok || !uuidRe.test(user.data?.id||""))return null;
  const found=await serviceRead(cfg,"v2_profiles",
    "select=id,username,display_name,role,parent_id,status&id=eq."+user.data.id+"&limit=1");
  if(!found.ok||!Array.isArray(found.data)||found.data.length!==1||found.data[0].status!=="active")return null;
  return found.data[0];
}
function checkUuid(v){return typeof v==="string"&&uuidRe.test(v);}
function genericAuthError(origin){return response(401,{error:"Invalid username or password"},origin);}

async function route(event){
  const origin=getOrigin(event), method=requestMethod(event),path=requestPath(event);
  const allowed=(process.env.V2_ALLOWED_ORIGINS || "https://bpexch1.com").split(",").map(x=>x.trim());
  if(method==="OPTIONS"){
    if(!allowed.includes(origin))return response(403,{error:"Origin forbidden"},origin);
    const base=response(204,{},origin);
    base.headers["access-control-allow-methods"]="GET,POST,OPTIONS";
    base.headers["access-control-allow-headers"]="authorization,content-type";
    base.headers["access-control-max-age"]="600";
    base.body="";
    return base;
  }
  if(path==="/v2/health"&&method==="GET")return response(200,{
    ok:true,service:"bpexch-v2",mode:"stage",backendConfigured:!!process.env.V2_CONFIG_SECRET_ARN
  },origin);
  if(!path.startsWith("/v2/"))return response(404,{error:"Not found"},origin);
  if(!["GET","POST"].includes(method))return response(405,{error:"Method not allowed"},origin);
  // Fail closed until V2 configuration has been connected by approved deployment.
  if(!process.env.V2_CONFIG_SECRET_ARN)return response(503,{error:"V2 backend not configured"},origin);
  const cfg=await loadSecrets();

  if(path==="/v2/auth/login"&&method==="POST"){
    const body=parseBody(event);
    if(!userRe.test(body.username||"")||typeof body.password!=="string"
       ||body.password.length<8||body.password.length>128)return genericAuthError(origin);
    const reserve=await supabaseFetch(cfg,"/rest/v1/rpc/v2_reserve_login_attempt",{
      method:"POST",body:JSON.stringify({p_username:body.username})
    },true);
    if(!reserve.ok)return response(503,{error:"Authentication service unavailable"},origin);
    if(reserve.data!==true)return response(429,{error:"Too many login attempts. Retry later"},origin);
    const profile=await serviceRead(cfg,"v2_profiles",
      "select=email,status&username=ilike."+encodeURIComponent(body.username)+"&limit=1");
    if(!profile.ok||!Array.isArray(profile.data)||profile.data.length!==1||profile.data[0].status!=="active"){
      return genericAuthError(origin);
    }
    const login=await supabaseFetch(cfg,"/auth/v1/token?grant_type=password",{
      method:"POST",body:JSON.stringify({email:profile.data[0].email,password:body.password}),
    });
    if(!login.ok||!login.data?.access_token||!login.data?.refresh_token)return genericAuthError(origin);
    return response(200,{accessToken:login.data.access_token,refreshToken:login.data.refresh_token,
      expiresIn:login.data.expires_in,tokenType:"bearer"},origin);
  }
  const actor=await verifyActor(event,cfg);
  if(!actor)return response(401,{error:"Authentication required"},origin);
  if(path==="/v2/me"&&method==="GET"){
    const wallets=await serviceRead(cfg,"v2_wallets",
      "select=cash,credit_available&profile_id=eq."+actor.id+"&limit=1");
    if(!wallets.ok)return response(503,{error:"Account service unavailable"},origin);
    return response(200,{account:actor,wallet:wallets.data?.[0]||null},origin);
  }
  if(path==="/v2/accounts/children"&&method==="GET"){
    if(!ROLES[actor.role])return response(403,{error:"Permission denied"},origin);
    const children=await serviceRead(cfg,"v2_profiles",
      "select=id,username,display_name,role,status,created_at&parent_id=eq."+actor.id+"&order=created_at.desc&limit=100");
    if(!children.ok)return response(503,{error:"Account service unavailable"},origin);
    return response(200,{accounts:children.data||[]},origin);
  }
  if(path==="/v2/accounts"&&method==="POST"){
    const desiredRole=ROLES[actor.role];
    if(!desiredRole)return response(403,{error:"Permission denied"},origin);
    const data=parseBody(event);
    if(!userRe.test(data.username||"")||typeof data.email!=="string"
      ||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||data.email.length>255
      ||typeof data.password!=="string"||data.password.length<12||data.password.length>128
      ||typeof data.displayName!=="string"||data.displayName.length>120)return response(400,{error:"Invalid account fields"},origin);
    // Role and parent are ALWAYS derived from authenticated operator, never request body.
    const created=await supabaseFetch(cfg,"/auth/v1/admin/users",{
      method:"POST",body:JSON.stringify({email:data.email,password:data.password,
        email_confirm:false,user_metadata:{display_name:data.displayName}})
    },true);
    if(!created.ok||!checkUuid(created.data?.id))return response(409,{error:"Account could not be provisioned"},origin);
    const uid=created.data.id;
    const inserted=await supabaseFetch(cfg,"/rest/v1/v2_profiles",{
      method:"POST",headers:{"Prefer":"return=representation"},
      body:JSON.stringify({id:uid,username:data.username,email:data.email,
        display_name:data.displayName,role:desiredRole,parent_id:actor.id})
    },true);
    if(!inserted.ok){
      const rollback=await supabaseFetch(cfg,"/auth/v1/admin/users/"+uid,{method:"DELETE"},true);
      if(!rollback.ok)return response(503,{error:"Partial account provisioning; administrator review required"},origin);
      return response(409,{error:"Account could not be created"},origin);
    }
    return response(201,{account:inserted.data?.[0]||{id:uid,username:data.username,role:desiredRole}},origin);
  }
  if(path==="/v2/wallet/transfer"&&method==="POST"){
    if(!ROLES[actor.role])return response(403,{error:"Permission denied"},origin);
    const b=parseBody(event);
    if(!checkUuid(b.targetId)||!checkUuid(b.requestId)||!["cash","credit"].includes(b.wallet)
      ||!["deposit","withdraw"].includes(b.direction)
      ||typeof b.amount!=="string"||!/^[0-9]+(\.[0-9]{1,2})?$/.test(b.amount)
      ||Number(b.amount)<=0||Number(b.amount)>1e9
      ||typeof b.description!=="string"||b.description.length>500)
      return response(400,{error:"Invalid transfer request"},origin);
    const transfer=await supabaseFetch(cfg,"/rest/v1/rpc/v2_wallet_transfer",{
      method:"POST",body:JSON.stringify({p_actor:actor.id,p_target:b.targetId,p_wallet:b.wallet,
        p_direction:b.direction,p_amount:b.amount,p_description:b.description,p_request_id:b.requestId})
    },true);
    if(!transfer.ok)return response(409,{error:"Transfer rejected. Verify account access and available balance"},origin);
    return response(200,transfer.data,origin);
  }
  if(path==="/v2/ledger"&&method==="GET"){
    const params=event.queryStringParameters||{};
    const id=params.accountId||actor.id;
    if(!checkUuid(id))return response(400,{error:"Invalid account"},origin);
    if(id!==actor.id){
      const relation=await serviceRead(cfg,"v2_profiles",
        "select=id&parent_id=eq."+actor.id+"&id=eq."+id+"&limit=1");
      if(!relation.ok||!relation.data?.length)return response(403,{error:"Permission denied"},origin);
    }
    const limit=Math.min(100,Math.max(1,Number(params.limit)||50));
    const ledger=await serviceRead(cfg,"v2_ledger",
      "select=id,request_id,wallet,delta,before_balance,after_balance,created_at&profile_id=eq."
      +id+"&order=id.desc&limit="+limit);
    if(!ledger.ok)return response(503,{error:"Ledger temporarily unavailable"},origin);
    return response(200,{entries:ledger.data||[]},origin);
  }
  return response(404,{error:"Not found"},origin);
}
exports.handler=async event=>{
  try{return await route(event);}
  catch(error){
    // Never leak Supabase keys, passwords, raw SQL errors or auth tokens in logs.
    if(error?.status>=400&&error?.status<500)
      return response(error.status,{error:error.message},getOrigin(event));
    return response(503,{error:"Service unavailable"},getOrigin(event));
  }
};
exports.__test={response,requestPath,requestMethod,ROLES};
