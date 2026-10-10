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

test("recorded cash/credit flow: available cash cap and ledger on successful commit",()=>{
 const page=read("src/pages/accounts/CashCreditPage.tsx");
 const modal=read("src/components/accounts/CashCreditModal.tsx");
 const ledger=read("src/pages/accounts/LedgerPage.tsx");
 for(const file of [page,modal]){
   assert.match(file,/Max \$\{activeTab\} deposit is/);
   assert.match(file,/adminClient\.cash/);
   assert.match(file,/adminClient\.credit_remaining/);
   assert.match(file,/Cash payment to \$\{session\?\.username/);
   assert.match(file,/accounts\/ledger\/\$\{encodeURIComponent\(client\.username\)\}\?wallet=\$\{activeTab\}/);
   assert.match(file,/setTransferWarning\(/);
 }
 assert.match(ledger,/useSearchParams\(\)/);
 assert.match(ledger,/walletFilter/);
 assert.match(ledger,/ledger-category/);
 assert.match(ledger,/exportFile/);
});
test("reference mobile wallet styles are scoped and distinguish two card colors",()=>{
 const page=read("src/pages/accounts/CashCreditPage.tsx");
 const css=read("src/pages/accounts/cashCreditReference.css");
 assert.match(page,/wallet-reference-summary/);
 assert.match(page,/wallet-reference-deposit/);
 assert.match(page,/wallet-reference-withdraw/);
 assert.match(css,/@media \(max-width: 640px\)/);
 assert.match(css,/\.reference-cash \.wallet-reference-summary/);
 assert.match(css,/wallet-reference-deposit/);
 assert.match(css,/wallet-reference-withdraw/);
});
test("SQL bridge has one session wallet transfer function with separate cash and credit funding",()=>{
 const m=read("supabase/migrations/20261010190000_wallet_login_session.sql");
 assert.equal(m.split("create or replace function public.manual_wallet_transfer_session(").length - 1,1);
 assert.equal(m.split("insert into public.transactions(").length - 1,1);
 assert.match(m,/actor\.cash < p_amount/);
 assert.match(m,/actor\.credit_remaining < p_amount/);
 assert.match(m,/cash = cash - signed_amount where id = actor\.id;/);
 assert.doesNotMatch(m,/cash = cash - signed_amount,\s*credit_remaining = credit_remaining - signed_amount/);
 assert.match(m,/revoke all on public\.bpexch_login_sessions from public,anon,authenticated/);
});
