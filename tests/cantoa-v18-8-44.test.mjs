import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('v18.8.44 preserves v18.8.43 billing and entitlement safety fixes', async () => {
  const checkout = await read('app/api/checkout/route.ts');
  const portal = await read('app/api/stripe/customer-portal/route.ts');
  const webhook = await read('app/api/stripe/webhook/route.ts');
  const usage = await read('lib/usage.ts');
  assert.match(checkout, /already have a paid Cantoa membership/i);
  assert.match(portal, /billingPortal\.sessions\.create/);
  assert.match(webhook, /invoice\.billing_reason === "subscription_cycle"/);
  assert.match(usage, /free_song_claimed \? 0 : 2/);
});

test('v18.8.44 classifies fallback reasons into actionable categories', async () => {
  const api = await read('app/api/owner/analytics/route.ts');
  for (const label of ['Quota / API limit','Rate limit','Timeout','Network / transport','Provider 5xx / unavailable','Provider/content rejection','Invalid / unsupported request','Authentication / permission','Other provider error','Unknown / not logged']) {
    assert.match(api, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(api, /Unspecified provider failure/);
});

test('v18.8.44 clarifies Owner Console labels and fallback-heavy provider state', async () => {
  const page = await read('app/owner/page.tsx');
  assert.match(page, /Active accounts by plan/);
  assert.match(page, /Cost assumptions used in analytics/);
  assert.match(page, /Fallback-heavy/);
  assert.doesNotMatch(page, /Active membership records/);
  assert.doesNotMatch(page, /Current calibrated assumptions/);
});

test('v18.8.44 keeps routing diagnostics compact and reduces log minimum width', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /routing-tests\{display:grid;grid-template-columns:1fr 1fr/);
  assert.match(css, /owner-table\{width:100%;border-collapse:collapse;min-width:940px/);
  assert.match(css, /routing-tests\{grid-template-columns:1fr\}/);
});
