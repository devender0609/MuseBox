import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pricing = await readFile(new URL('../app/api/pricing/route.ts', import.meta.url), 'utf8');
const checkout = await readFile(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const webhook = await readFile(new URL('../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8');
const usage = await readFile(new URL('../lib/usage.ts', import.meta.url), 'utf8');
const sql = await readFile(new URL('../supabase-setup.sql', import.meta.url), 'utf8');
const account = await readFile(new URL('../components/cantoa-account.tsx', import.meta.url), 'utf8');
const ownerAnalytics = await readFile(new URL('../app/api/owner/analytics/route.ts', import.meta.url), 'utf8');

test('v18.7 localizes exact US and India membership pricing', () => {
  assert.match(pricing, /US\$7\.99/);
  assert.match(pricing, /US\$19\.99/);
  assert.match(pricing, /₹499/);
  assert.match(pricing, /₹1,299/);
  assert.match(pricing, /x-vercel-ip-country/);
  assert.match(pricing, /cf-ipcountry/);
  assert.match(page, /fetch\("\/api\/pricing"/);
});

test('v18.7 Stripe checkout uses exact regional recurring Price IDs and fails closed', () => {
  for (const key of ['STRIPE_CREATOR_PRICE_USD','STRIPE_STUDIO_PRICE_USD','STRIPE_CREATOR_PRICE_INR','STRIPE_STUDIO_PRICE_INR']) assert.match(checkout, new RegExp(key));
  assert.match(checkout, /mode: "subscription"/);
  assert.match(checkout, /line_items: \[\{ quantity: 1, price: priceId \}\]/);
  assert.match(checkout, /Fail closed rather than show one price and charge another/);
  assert.match(checkout, /stripe\.prices\.retrieve\(priceId\)/);
  assert.match(checkout, /configuredPrice\.unit_amount !== amount/);
  assert.match(checkout, /configuredPrice\.recurring\?\.interval !== "month"/);
  assert.doesNotMatch(checkout, /razorpay/i);
});

test('v18.7 grants 40 and 120 minutes server-side', () => {
  assert.match(webhook, /plan === "Studio" \? 120 : plan === "Creator" \? 40 : 2/);
  assert.match(pricing, /minutes: 40/);
  assert.match(pricing, /minutes: 120/);
});

test('v18.7 gives exactly two free music creations up to two minutes each', () => {
  assert.match(sql, /free_songs_remaining integer not null default 2/);
  assert.match(sql, /free_songs_remaining=greatest\(0,free_songs_remaining-1\)/);
  assert.match(sql, /if p_minutes>2 then raise exception 'FREE_SONG_TOO_LONG'/);
  assert.match(usage, /FREE_SONGS_USED/);
  assert.match(page, /2 free music creations/);
  assert.match(account, /first 2 music creations are free/i);
});

test('v18.7 refunds a failed Explore generation without creating extra entitlements', () => {
  assert.match(sql, /free_songs_remaining=least\(2,free_songs_remaining\+1\)/);
  assert.match(sql, /free_song_claimed=false/);
});

test('v18.7 keeps free previews and revisions behind paid membership', () => {
  assert.match(page, /free music creations are reserved for complete creations/i);
  assert.match(page, /Revisions create a new audio generation and are available with Creator or Studio/);
  assert.match(page, /accountInfo\?\.plan === "Explore"/);
});

test("v18.7.2 narrows owner regional pricing rows before indexing plan maps", () => {
  assert.match(ownerAnalytics, /type PaidPlan = "Creator" \| "Studio"/);
  assert.match(ownerAnalytics, /function paidPlanFrom\(value: unknown\): PaidPlan \| null/);
  assert.match(ownerAnalytics, /const plan = paidPlanFrom\(item\.plan\)/);
  assert.match(ownerAnalytics, /CURRENT_INR\[plan\]/);
  assert.match(ownerAnalytics, /CURRENT_USD\[plan\]/);
  assert.doesNotMatch(ownerAnalytics, /CURRENT_INR\[item\.plan\]/);
  assert.doesNotMatch(ownerAnalytics, /CURRENT_USD\[item\.plan\]/);
});
