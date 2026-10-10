const {test}=require("node:test");
const assert=require("node:assert/strict");
const {handler}=require("../src/handler");
test("health has no secrets",async()=>{const r=await handler({rawPath:"/health",requestContext:{http:{method:"GET"}}});assert.equal(r.statusCode,200);assert.equal(JSON.parse(r.body).status,"read-only");});
test("unverified account denied",async()=>{const r=await handler({rawPath:"/v1/session",requestContext:{http:{method:"GET"}}});assert.equal(r.statusCode,401);});
test("no financial mutations",async()=>{const r=await handler({rawPath:"/v1/bets",requestContext:{http:{method:"POST"}}});assert.equal(r.statusCode,405);});
test("read-only markets fail closed",async()=>{const r=await handler({rawPath:"/v1/markets",requestContext:{http:{method:"GET"}}});assert.equal(r.statusCode,503);});
test("Vercel routes AWS health through same-origin proxy before SPA fallback",()=>{
 const fs=require("node:fs"),path=require("node:path");
 const cfg=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../../../../vercel.json"),"utf8"));
 const healthIndex=cfg.rewrites.findIndex(r=>r.source==="/aws-health");
 const fallbackIndex=cfg.rewrites.findIndex(r=>r.source==="/(.*)");
 assert.ok(healthIndex>=0&&fallbackIndex>healthIndex,"proxy must precede SPA fallback");
 assert.equal(cfg.rewrites[healthIndex].destination,
   "https://r5vz6m7uhl.execute-api.ap-southeast-2.amazonaws.com/health");
});
