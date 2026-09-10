import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const checkout = await readFile(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const env = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
const sql = await readFile(new URL('../supabase-setup.sql', import.meta.url), 'utf8');
const providers = await readFile(new URL('../lib/music-providers.ts', import.meta.url), 'utf8');

test('Stripe remains the only active subscription checkout with regional price IDs', () => {
  assert.match(checkout, /STRIPE_CREATOR_PRICE_USD/);
  assert.match(checkout, /STRIPE_STUDIO_PRICE_USD/);
  assert.match(checkout, /STRIPE_CREATOR_PRICE_INR/);
  assert.match(checkout, /STRIPE_STUDIO_PRICE_INR/);
  assert.match(checkout, /provider:\s*"stripe"/);
  assert.match(checkout, /x-vercel-ip-country/);
  assert.doesNotMatch(checkout, /razorpay|RAZORPAY/i);
  assert.doesNotMatch(page, /Razorpay|Paytm|PhonePe|UPI\/Razorpay/i);
});

test('v18.3.2 removes Razorpay configuration and route requirements', async () => {
  assert.doesNotMatch(env, /RAZORPAY_/);
  assert.doesNotMatch(sql, /razorpay_subscription_id/);
  await assert.rejects(access(new URL('../app/api/razorpay/webhook/route.ts', import.meta.url)));
});

test('v18.3.2 retains optional Mureka and Stability music providers', () => {
  assert.match(providers, /MUREKA_API_KEY/);
  assert.match(providers, /STABILITY_API_KEY/);
  assert.match(providers, /generateWithRouter/);
});
