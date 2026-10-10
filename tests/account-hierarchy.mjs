import assert from "node:assert/strict";
import { test } from "node:test";
import { canCreateChild, normalizeAccountRole, permittedChildRole, roleLabel } from "../src/lib/accountHierarchy.ts";

test("company can only create SuperAdmin, never SuperMaster", () => {
  assert.equal(permittedChildRole("company"),"superadmin");
  assert.equal(canCreateChild("company","superadmin"),true);
  assert.equal(canCreateChild("company","supermaster"),false);
  assert.equal(canCreateChild("company","client"),false);
});
test("complete chain is monotonic and direct only", () => {
 const chain=["company","superadmin","admin","supermaster","master","dealer","client"];
 for(let i=0;i<chain.length-1;i++){
  assert.equal(permittedChildRole(chain[i]),chain[i+1]);
  assert.equal(canCreateChild(chain[i],chain[i+1]),true);
  for(const role of chain){if(role!==chain[i+1]) assert.equal(canCreateChild(chain[i],role),false);}
 }
 assert.equal(permittedChildRole("client"),null);
});
test("normalize input but reject unknown roles",()=>{
 assert.equal(normalizeAccountRole("Super_Admin"),"superadmin");
 assert.equal(normalizeAccountRole("Bettor"),"client");
 assert.equal(permittedChildRole("bad"),null);
 assert.equal(canCreateChild("bad","client"),false);
 assert.equal(roleLabel("supermaster"),"SuperMaster");
});
