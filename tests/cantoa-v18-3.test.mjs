import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const music = await readFile(new URL('../app/api/music/route.ts', import.meta.url), 'utf8');
const providers = await readFile(new URL('../lib/music-providers.ts', import.meta.url), 'utf8');
const soundtrack = await readFile(new URL('../app/api/soundtrack/route.ts', import.meta.url), 'utf8');
const checkout = await readFile(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const sql = await readFile(new URL('../supabase-setup.sql', import.meta.url), 'utf8');

test('v18.3 simplifies default Create while preserving Advanced controls', () => {
  assert.match(page, /<details className="song-blueprint blueprint-details">/);
  assert.match(page, /createMode === "quick" && \(/);
  assert.match(page, /className="quick-essentials"/);
  assert.match(page, /mode === "vocals" && createMode === "advanced"/);
  assert.match(page, /createMode === "advanced" && <div>[\s\S]*?<label>Finish<\/label>/);
  assert.match(page, /createMode === "advanced" && <div className="direction-choice">/);
  assert.match(page, /Song language[\s\S]*?Any language, dialect or mix/);
});

test('v18.3 accepts photos or video without adding a new navigation surface', () => {
  assert.match(page, /accept="image\/\*,audio\/\*,video\/mp4,video\/webm,video\/quicktime"/);
  assert.match(page, /"Add media"/);
  assert.match(page, /Auto-score video/);
  assert.doesNotMatch(page, /<button[^>]*>\s*(Providers|Mureka|Stable Audio)\s*<\/button>/i);
});

test('v18.3 routes music automatically across configured providers', () => {
  assert.match(providers, /MusicProvider = "elevenlabs" \| "mureka" \| "stability"/);
  assert.match(providers, /generateWithRouter/);
  assert.match(providers, /MUREKA_API_KEY/);
  assert.match(providers, /STABILITY_API_KEY/);
  assert.match(music, /X-Cantoa-Provider/);
  assert.match(music, /providerIntent/);
});

test('v18.3 has a real Mureka video soundtrack endpoint with protected usage', () => {
  assert.match(soundtrack, /v1\/files\/upload/);
  assert.match(soundtrack, /v1\/soundtrack\/generate/);
  assert.match(soundtrack, /reserveMinutes/);
  assert.match(soundtrack, /enforceRateLimit/);
  assert.match(page, /fetch\("\/api\/soundtrack"/);
});

test('v18.3.2 keeps secure Stripe checkout while Razorpay is intentionally inactive', () => {
  assert.match(checkout, /STRIPE_CREATOR_PRICE_USD/);
  assert.match(checkout, /STRIPE_STUDIO_PRICE_USD/);
  assert.match(checkout, /STRIPE_CREATOR_PRICE_INR/);
  assert.match(checkout, /STRIPE_STUDIO_PRICE_INR/);
  assert.doesNotMatch(checkout, /RAZORPAY|razorpay/i);
  assert.doesNotMatch(sql, /razorpay_subscription_id/);
});
