import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const collect = await readFile(new URL('../app/api/library/[id]/collect/route.ts', import.meta.url), 'utf8');

test('v18.8.2 reuses an existing Group Song collection', () => {
  assert.match(collect, /if \(existing\?\.token\)/);
  assert.match(collect, /reused: true/);
});

test('v18.8.2 recovers from duplicate-key races without exposing database errors', () => {
  assert.match(collect, /insertError\.code === "23505"/);
  assert.match(collect, /racedExisting/);
  assert.doesNotMatch(collect, /error: insertError\.message/);
  assert.match(collect, /We could not open your Group Song right now/);
});

test('v18.8.2 hides raw contribution retrieval errors', () => {
  assert.doesNotMatch(collect, /error: itemsError\.message/);
  assert.match(collect, /We could not load the collected memories right now/);
});
