import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ledgerDateParts, parseLedgerLocalInput, ledgerLocalToUtc } from "../src/lib/ledgerDateTime.ts";
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

test("legacy Cash/Credit and Ledger routes use the standalone admin container", () => {
 const s = read("src/components/layout/AppLayout.tsx");
 assert.match(s,/cash-credit\|cashcredit\|cash\|credit\|cr\|ledger/);
 assert.match(s,/reference-admin reference-standalone/);
});
test("original-style Ledger date/time is local with UTC report filtering", () => {
 const picker = read("src/components/accounts/LedgerDateTimeField.tsx");
 const ledger = read("src/pages/accounts/LedgerPage.tsx");
 assert.match(picker,/ledger-calendar-trigger/);
 assert.match(picker,/calendarOpen/);
 assert.match(picker,/From|label/);
 assert.match(ledger,/ledgerLocalToUtc\(fromDate\)/);
 assert.match(ledger,/ledgerLocalToUtc\(toDate\)/);
 assert.doesNotMatch(ledger,/type="datetime-local"/);
 assert.match(ledger,/ledger-sort-button/);
 assert.match(ledger,/ledger-kind-options/);
});
test("ledger 12-hour AM/PM, minimum date, and invalid dates handled exactly", () => {
 assert.equal(parseLedgerLocalInput("10/10/2026", "12:00", "AM"), "2026-10-10T00:00");
 assert.equal(parseLedgerLocalInput("10/10/2026", "12:00", "PM"), "2026-10-10T12:00");
 assert.equal(parseLedgerLocalInput("10/10/2026", "01:30", "PM"), "2026-10-10T13:30");
 assert.equal(parseLedgerLocalInput("01/01/2025", "12:00", "AM"), null);
 assert.equal(parseLedgerLocalInput("02/29/2026", "11:45", "AM"), null);
 assert.equal(parseLedgerLocalInput("13/10/2026", "12:00", "AM"), null);
 assert.equal(parseLedgerLocalInput("10/10/2026", "13:00", "PM"), null);
 assert.deepEqual(ledgerDateParts("2026-10-10T13:30"), { dateText: "10/10/2026", timeText: "01:30", period: "PM" });
 const utc = ledgerLocalToUtc("2026-10-10T13:30");
 assert.equal(utc, new Date(2026, 9, 10, 13, 30).toISOString());
 assert.equal(ledgerLocalToUtc("2025-12-31T23:59"), null);
});
test("reference Ledger and Cash styles are scoped, do not modify user dashboard", () => {
 const ledgerCss = read("src/pages/accounts/ledgerReference.css");
 const cashCss = read("src/pages/accounts/cashCreditReference.css");
 assert.match(ledgerCss,/\.reference-admin \.reference-ledger \.ledger-datetime-field/);
 assert.match(ledgerCss,/rgb\(236, 236, 237\)/);
 assert.match(ledgerCss,/Roboto Condensed/);
 assert.match(cashCss,/\.reference-admin\.reference-standalone \.reference-cash/);
 assert.doesNotMatch(ledgerCss, /\.reference-user-dashboard/);
});
