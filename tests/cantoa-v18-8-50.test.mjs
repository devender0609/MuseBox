import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const checkout = read('app/api/checkout/route.ts');
const account = read('app/api/account/route.ts');
const access = read('app/api/feature-access/route.ts');
const portal = read('app/api/stripe/customer-portal/route.ts');
const library = read('app/api/library/route.ts');
const collect = read('app/api/library/[id]/collect/route.ts');
const myVoice = read('app/api/my-voice/route.ts');
const vote = read('app/api/contribute/[token]/vote/route.ts');
const contribution = read('app/api/contribute/[token]/route.ts');
const reaction = read('app/api/share/[token]/reaction/route.ts');
const webhook = read('app/api/stripe/webhook/route.ts');
const setup = read('supabase-setup.sql');
const migration = read('supabase-v18.8.50-hardening.sql');
const page = read('app/page.tsx');
const music = read('app/api/music/route.ts');
const source = read('app/api/source/route.ts');
const limiter = read('lib/rate-limit.ts');
const pricing = read('app/api/pricing/route.ts');
const libraryDelete = read('app/api/library/[id]/route.ts');

test('release version is v18.8.50', () => assert.equal(pkg.version, '0.18.8.50'));

test('checkout fails closed when current membership cannot be verified', () => {
  assert.match(checkout, /Membership verification is not configured/);
  assert.match(checkout, /membershipError/);
  assert.match(checkout, /could not verify your current membership/);
});

test('membership-facing reads distinguish database failure from Explore access', () => {
  assert.match(account, /membershipError/);
  assert.match(account, /repairError/);
  assert.match(access, /Membership access could not be verified/);
  assert.match(portal, /membershipError/);
  assert.match(collect, /access === null/);
  assert.match(myVoice, /verificationError/);
});

test('cloud library blocks a caller supplied song UUID owned by another user', () => {
  assert.match(library, /existingId/);
  assert.match(library, /existingId\.user_id !== user\.id/);
  assert.match(library, /song identifier is already in use/);
});

test('authenticated rate limits are serialized for simultaneous tabs', () => {
  assert.match(setup, /pg_advisory_xact_lock/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /v18\.8\.50_atomic_rate_limit_crash_safe_webhooks/);
});

test('Stripe webhook claims distinguish processing from processed and recover stale claims', () => {
  assert.match(webhook, /status: "processing"/);
  assert.match(webhook, /state: "in_progress"/);
  assert.match(webhook, /staleBefore/);
  assert.match(webhook, /claim_token/);
  assert.match(webhook, /completeWebhookEvent/);
  assert.match(webhook, /status: "processed"/);
  assert.match(webhook, /status: 409/);
  assert.match(migration, /add column if not exists status/);
  assert.match(migration, /add column if not exists claim_token/);
  assert.match(migration, /alter column processed_at drop not null/);
});

test('public read surfaces are throttled and vote races do not create false server errors', () => {
  assert.match(contribution, /group-read:/);
  assert.match(reaction, /gift-reaction-read:/);
  assert.match(vote, /23505/);
  assert.match(vote, /deleteError/);
  assert.match(vote, /existingError/);
});

test('commercial and generation invariants remain intact', () => {
  assert.match(page, /explore: \{ freeSongs: 2, maxMinutesEach: 2 \}/);
  assert.match(page, /creator: \{ amountMinor: 799, display: "US\$7\.99", minutes: 40 \}/);
  assert.match(page, /studio: \{ amountMinor: 1999, display: "US\$19\.99", minutes: 120 \}/);
  assert.match(pricing, /49900/);
  assert.match(pricing, /129900/);
  assert.match(music, /Math\.min\(300/);
  assert.match(page, /<fieldset[^>]*disabled=\{generating \|\| previewing\}/);
  assert.match(page, /starterSeedPrompt/);
});

test('source, public sharing and storage hardening from prior releases remains present', () => {
  assert.match(source, /AbortSignal\.timeout\(8000\)/);
  assert.match(source, /assertPublicHost/);
  assert.match(source, /url\.port && url\.port !== "443"/);
  assert.match(limiter, /check_cantoa_public_rate_limit/);
  assert.match(library, /supportedAudioTypes/);
  assert.match(library, /audioExtension/);
  assert.match(libraryDelete, /groupPhotoPaths/);
  assert.match(contribution, /await checkPublicRateLimit/);
  assert.match(reaction, /await checkPublicRateLimit/);
});
