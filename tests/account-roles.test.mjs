import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
const code = readFileSync(new URL("../src/lib/accountRoles.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { getCreatableChildRoles, canCreateChildRole } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
test("company creates SuperAdmin, never SuperMaster", () => {
  assert.deepEqual(getCreatableChildRoles("Company").map(x => x.label), ["SuperAdmin","Bettor"]);
  assert.equal(canCreateChildRole("company","supermaster"), false);
  assert.equal(canCreateChildRole("company","superadmin"), true);
});
test("hierarchy follows Company to Dealer and denies privilege escalation", () => {
  for(const [parent,child] of [["superadmin","admin"],["admin","supermaster"],["supermaster","master"],["master","dealer"],["dealer","client"]]) {
    assert.equal(canCreateChildRole(parent,child),true);
  }
  for(const [parent,child] of [["client","superadmin"],["dealer","admin"],["admin","company"],["supermaster","superadmin"],["invalid","client"]]) {
    assert.equal(canCreateChildRole(parent,child),false);
  }
});
