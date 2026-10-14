import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Applied production versions must remain in source control. Supabase Preview
// rejects a repository that drops or renames any version in remote history.
const appliedVersions = [
  '20260714092031', '20261003141624', '20261010131809',
  '20261013173256', '20261013173756', '20261014010000',
  '20261014092905', '20261014094635', '20261014112702',
  '20261014130823', '20261014131934', '20261014132320',
  '20261014184653',
];

test('every applied production migration version has exactly one local SQL file', () => {
  const directory = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
  const versions = readdirSync(directory).filter(file => file.endsWith('.sql'))
    .map(file => file.split('_', 1)[0]);
  for (const version of appliedVersions) {
    assert.equal(versions.filter(item => item === version).length, 1, version);
  }
  assert.equal(new Set(versions).size, versions.length, 'migration versions must be unique');
});
