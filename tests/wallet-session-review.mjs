import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = p => readFileSync(new URL("../"+p, import.meta.url), "utf8");
test("cash credit page and modal never request administrator password",()=>{
 for (const p of ["src/pages/accounts/CashCreditPage.tsx","src/components/accounts/CashCreditModal.tsx"]){
  const s=read(p);
  assert.doesNotMatch(s,/operatorPassword|wallet-operator-password|administrator password/i,p);
  assert.match(s,/manualWalletTransfer/);
 }
});
test("wallet API has no browser-supplied operator name, role or password",()=>{
 const s=read("src/lib/manualWallet.ts");
 assert.doesNotMatch(s,/operatorPassword|operatorUsername/);
 assert.match(s,/getWalletSessionToken\(\)/);
 assert.match(s,/authorization/i);
});
test("login fetches no bcrypt hashes; server identity is verified before session storage",()=>{
 const s=read("src/pages/Login.tsx");
 assert.match(s,/authenticatedLogin\(/);
 assert.doesNotMatch(s,/\.from\("clients"\)/);
 const auth=read("src/lib/walletSession.ts");
 assert.match(auth,/sessionStorage/);
 assert.match(auth,/expiresInSeconds/);
});
test("wallet transfer reads server-verified token and keeps idempotent ledger request ID",()=>{
 const m=read("supabase/migrations/20261010190000_wallet_login_session.sql");
 assert.match(m,/bpexch_login_sessions/);
 assert.match(m,/sessionToken|p_token_hash/);
 assert.match(m,/manual_wallet_transfer_session/);
 assert.match(m,/operator_username.*request_id/);
 assert.match(m,/for update of s/);
 assert.doesNotMatch(m,/manual_wallet_transfer_session\([\s\S]*?p_password/);
});
