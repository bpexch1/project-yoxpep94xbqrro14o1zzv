import assert from "node:assert/strict";
import { test } from "node:test";
import { ACCOUNT_ROLES, canCreateChild, normalizeAccountRole, permittedChildRole, roleLabel } from "../src/lib/accountHierarchy.ts";

test("company may create SuperAdmin, but cannot skip to SuperMaster or Bettor", () => {
  assert.equal(permittedChildRole("company"), "superadmin");
  assert.equal(canCreateChild("company", "superadmin"), true);
  assert.equal(canCreateChild("company", "supermaster"), false);
  assert.equal(canCreateChild("company", "bettor"), false);
});
test("six-level hierarchy: Master creates Bettor directly; Bettor cannot create users", () => {
  const chain = ["company", "superadmin", "admin", "supermaster", "master", "bettor"];
  assert.deepEqual([...ACCOUNT_ROLES], chain);
  for (let i = 0; i < chain.length - 1; i++) {
    assert.equal(permittedChildRole(chain[i]), chain[i + 1]);
    for (const role of chain) {
      assert.equal(canCreateChild(chain[i], role), role === chain[i + 1], chain[i] + " -> " + role);
    }
  }
  assert.equal(permittedChildRole("bettor"), null);
  assert.equal(canCreateChild("bettor", "bettor"), false);
});
test("legacy client accounts are treated as Bettor without rewriting stored roles", () => {
  assert.equal(normalizeAccountRole("client"), "bettor");
  assert.equal(normalizeAccountRole("Bettor"), "bettor");
  assert.equal(normalizeAccountRole("user"), "bettor");
  assert.equal(roleLabel("client"), "Bettor");
  assert.equal(roleLabel("bettor"), "Bettor");
  assert.equal(canCreateChild("master", "client"), true);
});
test("Dealer is not supported as a parent, a child or an admin role", () => {
  assert.equal(normalizeAccountRole("dealer"), null);
  assert.equal(permittedChildRole("dealer"), null);
  assert.equal(canCreateChild("master", "dealer"), false);
  assert.equal(canCreateChild("dealer", "client"), false);
  assert.equal(normalizeAccountRole("Super_Admin"), "superadmin");
  assert.equal(permittedChildRole("bad"), null);
});
