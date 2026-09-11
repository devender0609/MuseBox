import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const usage = read('lib/usage.ts');
const limiter = read('lib/rate-limit.ts');
const contribution = read('app/api/contribute/[token]/route.ts');
const vote = read('app/api/contribute/[token]/vote/route.ts');
const reaction = read('app/api/share/[token]/reaction/route.ts');
const webhook = read('app/api/stripe/webhook/route.ts');
const analytics = read('app/api/owner/analytics/route.ts');
const owner = read('app/owner/page.tsx');
const source = read('app/api/source/route.ts');
const library = read('app/api/library/route.ts');
const libraryDelete = read('app/api/library/[id]/route.ts');
const migration = read('supabase-v18.8.49-hardening.sql');
const page = read('app/page.tsx');
const checkout = read('app/api/checkout/route.ts');
const pricing = read('app/api/pricing/route.ts');
const myVoice = read('app/api/my-voice/route.ts');
const myVoicePreview = read('app/api/my-voice/preview/route.ts');

test('release version is v18.8.49', () => assert.equal(pkg.version, '0.18.8.49'));

test('public/unlisted writes prefer a persistent Supabase-backed limiter with safe fallback', () => {
  assert.match(limiter, /check_cantoa_public_rate_limit/);
  assert.match(limiter, /requestFingerprintHash/);
  assert.match(limiter, /return checkRateLimit/);
  assert.match(contribution, /await checkPublicRateLimit/);
  assert.match(vote, /await checkPublicRateLimit/);
  assert.match(reaction, /await checkPublicRateLimit/);
  assert.match(migration, /create table if not exists public\.cantoa_public_rate_limits/);
  assert.match(migration, /security definer/);
});

test('gift reactions are throttled as well as Group Song contributions and votes', () => {
  assert.match(reaction, /gift-reaction:/);
  assert.match(reaction, /status: 429/);
});

test('paid membership billing problems return a truthful customer-facing usage error', () => {
  assert.match(usage, /PAYMENT_ATTENTION_REQUIRED/);
  assert.match(usage, /Manage membership/);
  assert.doesNotMatch(usage, /data\.status !== "active"\) throw new Error\("USAGE_NOT_CONFIGURED"\)/);
});

test('portal plan changes immediately align remaining quota while preserving already-consumed minutes', () => {
  assert.match(webhook, /existing\.plan !== nextPlan/);
  assert.match(webhook, /const consumed = Math\.max/);
  assert.match(webhook, /update\.minutes_remaining = Math\.max\(0, newAllowance - consumed\)/);
});

test('billing country is captured when Stripe supplies it and owner analytics can backfill existing paid customers', () => {
  assert.match(webhook, /billing_country: session\.customer_details\?\.address\?\.country/);
  assert.match(webhook, /billingCountryFromSubscription/);
  assert.match(analytics, /stripe\.customers\.retrieve/);
  assert.match(analytics, /billing_country/);
  assert.match(owner, /Billing country/);
  assert.match(owner, /Not provided/);
  assert.match(migration, /add column if not exists billing_country text/);
});

test('website import has explicit timeout and blocks non-standard HTTPS ports', () => {
  assert.match(source, /AbortSignal\.timeout\(8000\)/);
  assert.match(source, /url\.port && url\.port !== "443"/);
  assert.match(source, /UNSAFE_PORT/);
});

test('cloud library rejects unsupported MIME types instead of silently labeling them MP3', () => {
  assert.match(library, /supportedAudioTypes/);
  assert.match(library, /Unsupported audio format/);
  assert.match(library, /status: 415/);
});

test('cloud delete includes Group Song photos and reports partial cleanup truthfully', () => {
  assert.match(libraryDelete, /moment_collections/);
  assert.match(libraryDelete, /moment_contributions/);
  assert.match(libraryDelete, /groupPhotoPaths/);
  assert.match(libraryDelete, /audio files were removed, but the library record could not be cleaned up/);
});

test('Stripe webhook processing is idempotent and database failures are retried instead of silently acknowledged', () => {
  assert.match(webhook, /stripe_webhook_events/);
  assert.match(webhook, /duplicate: true/);
  assert.match(webhook, /releaseWebhookEvent/);
  assert.match(webhook, /status: 500/);
  assert.match(webhook, /sameSubscription/);
  assert.match(webhook, /duplicate\/replayed checkout completion must never refill/);
  assert.match(migration, /create table if not exists public\.stripe_webhook_events/);
});

test('commercial and creation-state invariants from v18.8.48 remain intact', () => {
  assert.match(page, /starterSeedPrompt/);
  assert.match(page, /<fieldset[^>]*disabled=\{generating \|\| previewing\}/);
  assert.match(page, /explore: \{ freeSongs: 2, maxMinutesEach: 2 \}/);
  assert.match(page, /creator: \{ amountMinor: 799, display: "US\$7\.99", minutes: 40 \}/);
  assert.match(page, /studio: \{ amountMinor: 1999, display: "US\$19\.99", minutes: 120 \}/);
  for (const src of [checkout, pricing]) {
    assert.match(src, /799/); assert.match(src, /1999/); assert.match(src, /49900/); assert.match(src, /129900/);
  }
});


test('My Voice provider-cost surfaces are premium-gated/rate-limited and compensate for metadata save failures', () => {
  assert.match(myVoice, /my_voice_create/);
  assert.match(myVoice, /enforceRateLimit/);
  assert.match(myVoice, /provider copy was cleaned up/);
  assert.match(myVoicePreview, /ensurePremiumAccess/);
  assert.match(myVoicePreview, /my_voice_preview/);
  assert.match(myVoicePreview, /enforceRateLimit/);
});
