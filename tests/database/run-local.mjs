// Isolated PostgreSQL/WASM regression runner; never connects to production.
// Install @electric-sql/pglite@0.5.10 in a scratch directory and set PGLITE_ROOT.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.env.PGLITE_ROOT;
if (!root) throw new Error('Set PGLITE_ROOT to an isolated @electric-sql/pglite installation');
const { PGlite } = await import(pathToFileURL(resolve(root, 'dist/index.js')));
const { pgcrypto } = await import(pathToFileURL(resolve(root, 'dist/contrib/pgcrypto.js')));
const db = new PGlite({ extensions: { pgcrypto } });
try {
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as 'select null::uuid';
 create function auth.role() returns text language sql as 'select current_user::text';`);
 const migrations = readdirSync('supabase/migrations').filter(n=>n.endsWith('.sql')).sort();
 for (const name of migrations) {
  let sql = readFileSync('supabase/migrations/'+name,'utf8');
  // Scheduling is not supported in the embedded runtime. Settlement functions are tested directly.
  sql = sql.replace(/^create extension if not exists pg_cron;$/m,'').replace(/^select cron\.schedule\([\s\S]*?^\);[ \t]*$/gm,'').replace(/^select cron\.schedule\([^\n]*\);[ \t]*$/gm,'');
  try { await db.exec(sql); } catch(e) { throw new Error(name+': '+e.message); }
  if (name.startsWith('202607')) await db.exec(`insert into public.clients(username,password,role,downline_share,credit_remaining)
   values('qa_root', 'fixture-not-used-for-login', 'company',85,1000000),('qa_historical_dealer','fixture-not-used-for-login','dealer',40,123);`);
 }
 await db.exec(`grant usage on schema public,extensions to service_role; grant all on all tables in schema public to service_role;`);
 console.log('PASS: baseline migrations applied to isolated PostgreSQL');
 console.log('PASS: migrations applied in chronological order');
 for (const file of ['supabase/tests/accounting_completion.sql','supabase/tests/complete_demo_wallet.sql','supabase/tests/commission_rule_2_percent.sql','supabase/tests/teenpatti_studio.sql']) {
  if (!readdirSync('supabase/tests').includes(file.split('/').at(-1))) continue;
  try { const results=await db.exec(readFileSync(file,'utf8')); console.log(file,JSON.stringify(results.at(-1)?.rows)); }
  catch(e){throw new Error(file+': '+e.message+' '+(e.where||''));}
 }
} catch(e) { console.error(e.message); process.exitCode=1; }
finally { await db.close(); }
