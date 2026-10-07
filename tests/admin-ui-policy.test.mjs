import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/adminUiPolicy.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { isStaffOrAdmin, marketAmount, ADMIN_ROLES } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('only the defined staff roles receive staff UI access', () => {
  for (const role of ADMIN_ROLES) assert.equal(isStaffOrAdmin(role), true);
  for (const role of [undefined, '', 'bettor', 'client', 'user', 'owner', 'administrator', '__proto__']) assert.equal(isStaffOrAdmin(role), false);
  assert.equal(isStaffOrAdmin(' Admin '), true);
});
test('missing or invalid market amounts stay unknown, zero remains zero', () => {
  for (const amount of [null, undefined, '', NaN, Infinity, -1, {}, true, 'invalid']) assert.equal(marketAmount(amount), '—');
  assert.equal(marketAmount(0), '0');
  assert.equal(marketAmount('1234.5'), '1,234.5');
});
