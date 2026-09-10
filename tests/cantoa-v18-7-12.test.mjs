import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const source = await readFile(new URL('../app/api/source/route.ts', import.meta.url), 'utf8');
const providers = await readFile(new URL('../lib/music-providers.ts', import.meta.url), 'utf8');
const checkout = await readFile(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const success = await readFile(new URL('../app/checkout-success/page.tsx', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.7.12 starts scratch creation neutral and keeps hidden quick defaults from overriding the prompt', () => {
  assert.match(page, /useState\("anything"\)/);
  assert.match(page, /useState\("Auto — follow my prompt"\)/);
  assert.match(page, /const scratchQuick = createMode === "quick" && momentId === "anything"/);
  assert.match(page, /createMode === "advanced" && direction/);
});

test('v18.7.12 recognizes natural sung-by voice wording', () => {
  assert.match(page, /sung\\s\+by/);
  assert.match(page, /vocalist/);
});

test('v18.7.12 protects webpage import with signed-in throttling', () => {
  assert.match(source, /enforceRateLimit\(request, "source", 20, 3600\)/);
  assert.match(page, /Authorization: `Bearer \$\{session\.access_token\}`/);
});

test('v18.7.12 does not bypass creative-policy rejection through a fallback provider', () => {
  assert.match(providers, /previousFailureReason\.startsWith\("provider_policy"\)/);
  assert.match(providers, /throw failure/);
});

test('v18.7.12 verifies Stripe checkout before showing membership success', () => {
  assert.match(checkout, /checkout-success\?session_id=\{CHECKOUT_SESSION_ID\}/);
  assert.match(success, /checkout\.sessions\.retrieve\(sessionId\)/);
  assert.match(success, /payment_status === "paid"/);
  assert.match(success, /checkout=unverified/);
});

test('v18.7.12 removes development-only metadata and pins Node major', () => {
  assert.doesNotMatch(layout, /codex-preview/);
  assert.equal(pkg.engines.node, '22.x');
});
