import test from "node:test";
import assert from "node:assert/strict";
import { getWalletSummary } from "../src/lib/walletBalances.ts";

test("Bettor: cash and issued credit contribute to combined withdrawable balance", () => {
  const account = { role: "bettor", cash: 50000, credit_remaining: 50000, pl_downline: 1007 };
  const summary = getWalletSummary(account);
  assert.equal(summary.combinedAvailable, 101007);
  assert.equal(summary.cashTabBalance, 101007);
  assert.equal(summary.maxCashWithdraw, 101007);
  assert.equal(summary.maxCreditWithdraw, 50000);
  // Reference recording: withdraw 100,000 cash, credit remains issued.
  const after = getWalletSummary({ ...account, cash: account.cash - 100000 });
  assert.equal(after.credit, 50000);
  assert.equal(after.combinedAvailable, 1007);
  assert.equal(after.maxCashWithdraw, 1007);
  assert.equal(after.maxCreditWithdraw, 1007);
});

test("SuperMaster: cash max does not include issued credit", () => {
  const summary = getWalletSummary({ role: "supermaster", cash: 10000, credit_remaining: 0, pl_downline: 0 });
  assert.equal(summary.cashTabBalance, 0);
  assert.equal(summary.maxCashWithdraw, 10000);
});

test("No negative withdrawal limit; credit cannot be withdrawn beyond available credit", () => {
  const summary = getWalletSummary({ role: "client", cash: -12000, credit_remaining: 10000, pl_downline: 0 });
  assert.equal(summary.maxCashWithdraw, 0);
  assert.equal(summary.maxCreditWithdraw, 0);
});
