import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const account = fs.readFileSync(new URL('../components/cantoa-account.tsx', import.meta.url), 'utf8');

test('feature authorization waits for auth initialization instead of opening account', () => {
  assert.match(page, /if \(!sessionReady\) \{[\s\S]*Checking your Cantoa account/);
  assert.match(page, /if \(!session\) \{[\s\S]*setAccountOpen\(true\)/);
});

test('auth hook preserves session through transient null auth events', () => {
  assert.match(account, /if \(next\) setSession\(next\);/);
  assert.match(account, /else if \(event === "SIGNED_OUT"\) setSession\(null\);/);
});

test('stale oauth error parameters are cleaned from the app URL', () => {
  assert.match(page, /\["error", "error_code", "error_description"\]/);
  assert.match(page, /window\.history\.replaceState/);
});
