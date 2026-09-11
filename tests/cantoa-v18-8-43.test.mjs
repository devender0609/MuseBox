import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('v18.8.43 prevents duplicate paid checkout and uses authenticated Stripe portal sessions', async () => {
  const checkout = await read('app/api/checkout/route.ts');
  const portal = await read('app/api/stripe/customer-portal/route.ts');
  assert.match(checkout, /already have a paid Cantoa membership/i);
  assert.match(checkout, /status: 409/);
  assert.match(portal, /authenticatedUser\(request\)/);
  assert.match(portal, /billingPortal\.sessions\.create/);
  assert.doesNotMatch(portal, /STRIPE_CUSTOMER_PORTAL_URL/);
});

test('v18.8.43 refills paid minutes only on real subscription cycle and stores renewal dates', async () => {
  const webhook = await read('app/api/stripe/webhook/route.ts');
  assert.match(webhook, /invoice\.billing_reason === "subscription_cycle"/);
  assert.match(webhook, /current_period_end: periodEndMs/);
  assert.match(webhook, /STRIPE_STUDIO_PRICE_USD/);
});

test('v18.8.43 keeps two-song Explore fallback semantics', async () => {
  const usage = await read('lib/usage.ts');
  const account = await read('app/api/account/route.ts');
  assert.doesNotMatch(usage, /free_song_claimed \? 0 : 1/);
  assert.doesNotMatch(account, /free_song_claimed \? 0 : 1/);
  assert.match(usage, /free_song_claimed \? 0 : 2/);
});

test('v18.8.43 owner console separates paid economics and recovered latency', async () => {
  const page = await read('app/owner/page.tsx');
  const api = await read('app/api/owner/analytics/route.ts');
  assert.match(page, /Paid generation spend/);
  assert.match(page, /Final user-facing success/);
  assert.match(page, /Primary-route latency/);
  assert.match(page, /Fallback-route latency/);
  assert.match(page, /Primary only/);
  assert.match(page, /Fallback only/);
  assert.match(api, /Latency has improved/);
  assert.match(api, /fallbackReasons/);
  assert.doesNotMatch(api, /Known provider spend is .*active-plan USD MRR/);
});

test('v18.8.43 reports gift reaction and cloud delete failures honestly', async () => {
  const gift = await read('app/share/[token]/gift-client.tsx');
  const page = await read('app/page.tsx');
  assert.match(gift, /Camera or microphone access was unavailable/);
  assert.match(gift, /unlisted Cantoa link/);
  assert.match(page, /Nothing was removed locally/);
});
