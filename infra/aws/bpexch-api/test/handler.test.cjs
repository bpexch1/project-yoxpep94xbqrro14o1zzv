const {test}=require("node:test");
const assert=require("node:assert/strict");
const {handler}=require("../src/handler");
test("health has no secrets",async()=>{const r=await handler({rawPath:"/health",requestContext:{http:{method:"GET"}}});assert.equal(r.statusCode,200);assert.equal(JSON.parse(r.body).status,"read-only");});
test("unverified account denied",async()=>{const r=await handler({rawPath:"/v1/session",requestContext:{http:{method:"GET"}}});assert.equal(r.statusCode,401);});
test("no financial mutations",async()=>{const r=await handler({rawPath:"/v1/bets",requestContext:{http:{method:"POST"}}});assert.equal(r.statusCode,405);});
test("read-only markets fail closed",async()=>{const r=await handler({rawPath:"/v1/markets",requestContext:{http:{method:"GET"}}});assert.equal(r.statusCode,503);});