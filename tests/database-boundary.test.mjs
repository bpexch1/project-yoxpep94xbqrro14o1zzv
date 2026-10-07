import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/databaseBoundary.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { databaseBoundary } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('missing configuration cannot read, write or authenticate against a mock store', () => {
  const db = databaseBoundary(null);
  for (const property of ['from', 'rpc', 'auth', 'functions']) assert.throws(() => db[property], /not configured/);
});
test('configured client retains identity and server failures', async () => {
  const failure = new Error('network unavailable');
  const real = { from() { assert.equal(this, real); return { insert: async () => { throw failure; } }; } };
  const db = databaseBoundary(real);
  assert.equal(db, real);
  await assert.rejects(db.from('transactions').insert({}), err => err === failure);
});
test('server error and empty success remain distinguishable', async () => {
  for (const result of [{ data: null, error: { message: 'permission denied' } }, { data: [], error: null }]) {
    const db = databaseBoundary({ from: () => ({ select: async () => result }) });
    assert.equal(await db.from('clients').select(), result);
  }
});
