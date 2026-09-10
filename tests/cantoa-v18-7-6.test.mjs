import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const account = fs.readFileSync('components/cantoa-account.tsx', 'utf8');
const page = fs.readFileSync('app/page.tsx', 'utf8');
const api = fs.readFileSync('app/api/account/route.ts', 'utf8');

test('paid account shows monthly music generation usage', () => {
  assert.match(account, /Monthly usage/);
  assert.match(account, /music-generation minutes left/);
  assert.match(account, /40.*120|120.*40/s);
});

test('finished-song video exports are explicitly included', () => {
  assert.match(account, /Reels & video exports from finished songs/);
  assert.match(account, /do not/);
});

test('billing reset date comes from current period end', () => {
  assert.match(api, /current_period_end/);
  assert.match(account, /currentPeriodEnd/);
  assert.match(account, /Resets/);
});

test('top profile distinguishes music minutes', () => {
  assert.match(page, /music min left/);
});

test('manage membership flow remains present', () => {
  assert.match(account, /Manage Membership/);
  assert.match(account, /\/api\/stripe\/customer-portal/);
});
