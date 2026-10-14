import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getWalletSummary } from "../src/lib/walletBalances.ts";

test("Bettor: cash and issued credit contribute to combined withdrawable balance", () => {
  const account = { role: "bettor", cash: 50000, credit_remaining: 50000, pl_downline: 1007 };
  const summary = getWalletSummary(account);
  assert.equal(summary.combinedAvailable, 101007);
  assert.equal(summary.cashTabBalance, 101007);
  assert.equal(summary.maxCashWithdraw, 101007);
  assert.equal(summary.maxCreditWithdraw, 50000);
  // Reference recording: withdraw 100,000 cash, issued credit stays, but only 1,007 is still free.
  const after = getWalletSummary({ ...account, cash: account.cash - 100000 });
  assert.equal(after.credit, 50000);
  assert.equal(after.combinedAvailable, 1007);
  assert.equal(after.maxCashWithdraw, 1007);
  assert.equal(after.maxCreditWithdraw, 1007);
});

test("SuperMaster: cash withdrawal can use issued credit, as shown in the reference recording", () => {
  const summary = getWalletSummary({ role: "supermaster", cash: 10000, credit_remaining: 50000, pl_downline: 0 });
  assert.equal(summary.cashTabBalance, 0);
  assert.equal(summary.maxCashWithdraw, 60000);
  assert.equal(summary.maxCreditWithdraw, 50000);
  const after = getWalletSummary({ role: "supermaster", cash: -50000, credit_remaining: 50000, pl_downline: 0 });
  assert.equal(after.maxCashWithdraw, 0);
  assert.equal(after.maxCreditWithdraw, 0);
});

test("No negative withdrawal limit; pledged credit cannot be withdrawn twice", () => {
  const summary = getWalletSummary({ role: "client", cash: -12000, credit_remaining: 10000, pl_downline: 0 });
  assert.equal(summary.combinedAvailable, -2000);
  assert.equal(summary.maxCashWithdraw, 0);
  assert.equal(summary.maxCreditWithdraw, 0);
});

test("Non-finite balances do not produce a withdrawable limit", () => {
  const summary = getWalletSummary({ role: "bettor", cash: Number.NaN, credit_remaining: 20, pl_downline: 0 });
  assert.equal(summary.maxCashWithdraw, 20);
  assert.equal(summary.maxCreditWithdraw, 20);
});

test("Wallet migration blocks credit overdraw and unfunded dealer cash deposits", () => {
  const sql = fs.readFileSync(new URL("../supabase/migrations/20261014224500_fix_wallet_overdraw.sql", import.meta.url), "utf8");
  assert.match(sql, /p_direction = 'withdraw' and combined_after < 0/);
  assert.match(sql, /coalesce\(actor\.cash, 0\) < p_amount/);
  assert.match(sql, /Insufficient cash balance/);
});
