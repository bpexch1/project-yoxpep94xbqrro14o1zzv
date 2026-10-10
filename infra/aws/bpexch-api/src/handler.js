"use strict";
const allowedOrigin=process.env.ALLOWED_ORIGIN||"";
function respond(status,data,origin=""){
 const headers={"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"};
 if(allowedOrigin&&origin===allowedOrigin){headers["access-control-allow-origin"]=allowedOrigin;headers["vary"]="Origin";}
 return {statusCode:status,headers,body:JSON.stringify(data)};
}
exports.handler=async function(event){
 const origin=event.headers?.origin||event.headers?.Origin||"";
 const method=(event.requestContext?.http?.method||event.httpMethod||"GET").toUpperCase();
 const path=event.rawPath||event.path||"/";
 if(method==="OPTIONS"){
  if(!allowedOrigin||origin!==allowedOrigin)return respond(403,{error:"Origin not allowed"});
  return {statusCode:204,headers:{"access-control-allow-origin":allowedOrigin,"access-control-allow-methods":"GET,OPTIONS","access-control-allow-headers":"authorization,content-type","access-control-max-age":"600"},body:""};
 }
 if(!["GET"].includes(method))return respond(405,{error:"Method not allowed"},origin);
 if(path==="/health"||path==="/v1/health")return respond(200,{ok:true,service:"bpexch-api",status:"read-only",region:process.env.AWS_REGION||"unknown"},origin);
 if(path==="/v1/session"){
  const auth=event.headers?.authorization||event.headers?.Authorization||"";
  if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth))return respond(401,{error:"Authentication required"},origin);
  const supabase=process.env.SUPABASE_URL||"";
  const anon=process.env.SUPABASE_ANON_KEY||"";
  if(!/^https:\/\/[a-z0-9.-]+$/.test(supabase)||!anon)return respond(503,{error:"Auth provider not configured"},origin);
  try{
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),5000);
   try{
    const result=await fetch(supabase+"/auth/v1/user",{headers:{"apikey":anon,"Authorization":auth},signal:controller.signal});
    if(!result.ok)return respond(401,{error:"Session invalid"},origin);
    const user=await result.json();
    if(!user?.id)return respond(401,{error:"Session invalid"},origin);
    return respond(200,{authenticated:true,userId:user.id},origin);
   }finally{clearTimeout(timer);}
  }catch{return respond(503,{error:"Authentication verification unavailable"},origin);}
 }
 if(path==="/v1/markets"||path==="/v1/bets"||path==="/v1/settlement")
  return respond(503,{error:"Verified backend market/financial operations not yet enabled"},origin);
 return respond(404,{error:"Not found"},origin);
};