import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const analytics = read('components/cantoa-analytics.tsx');
const nextConfig = read('next.config.ts');
const robots = read('app/robots.ts');
const sitemap = read('app/sitemap.ts');
const page = read('app/page.tsx');
const checkoutSuccess = read('app/checkout-success/page.tsx');
const account = read('app/api/account/route.ts');
const providers = read('app/api/providers/route.ts');
const rateLimit = read('lib/rate-limit.ts');
const vote = read('app/api/contribute/[token]/vote/route.ts');
const contribution = read('app/api/contribute/[token]/route.ts');
const reaction = read('app/api/share/[token]/reaction/route.ts');
const sharePage = read('app/share/[token]/page.tsx');
const giftClient = read('app/share/[token]/gift-client.tsx');
const usage = read('lib/usage.ts');
const music = read('app/api/music/route.ts');
const soundtrack = read('app/api/soundtrack/route.ts');
const remix = read('app/api/music/remix/route.ts');
const marketing = read('lib/marketing-pages.ts');

test('release version is v18.8.51', () => assert.equal(pkg.version, '0.18.8.51'));

test('analytics excludes sensitive token/admin/payment pages and strips query/referrer paths', () => {
  for (const path of ['/share/', '/contribute/', '/owner', '/checkout-success']) assert.match(analytics, new RegExp(path.replaceAll('/', '\\/')));
  assert.match(analytics, /window\.location\.origin \+ window\.location\.pathname/);
  assert.match(analytics, /new URL\(document\.referrer\)\.origin/);
  assert.doesNotMatch(analytics, /page_location:\s*window\.location\.href/);
});

test('robots, canonical host redirect and security headers protect private surfaces', () => {
  assert.match(robots, /"\/contribute\/"/);
  assert.match(robots, /"\/owner"/);
  assert.match(robots, /"\/checkout-success"/);
  assert.match(nextConfig, /X-Content-Type-Options/);
  assert.match(nextConfig, /X-Frame-Options/);
  assert.match(nextConfig, /Referrer-Policy/);
  assert.match(nextConfig, /value: "origin"/);
  assert.match(nextConfig, /www\.cantoamusic\.com/);
  assert.match(nextConfig, /https:\/\/cantoamusic\.com\/:path\*/);
  assert.doesNotMatch(sitemap, /new Date\(\)/);
});

test('payment return verifies Cantoa subscription metadata and refreshes membership with bounded retries', () => {
  assert.match(checkoutSuccess, /session\.mode === "subscription"/);
  assert.match(checkoutSuccess, /cantoa_plan/);
  assert.match(checkoutSuccess, /client_reference_id/);
  assert.match(page, /Payment confirmed\. Updating your Cantoa membership/);
  assert.match(page, /const delays = \[0, 1200, 3000, 6000\]/);
  assert.match(page, /membership activation is still syncing/);
  assert.match(account, /Cache-Control": "private, no-store"/);
});

test('per-user My Sound state does not leak between accounts on a shared browser', () => {
  assert.match(page, /cantoa-my-sound:\$\{userId\}/);
  assert.match(page, /userId === "guest" \? localStorage\.getItem\("cantoa-my-sound"\)/);
  assert.doesNotMatch(page, /localStorage\.setItem\("cantoa-my-sound", JSON\.stringify\(profile\)\)/);
});

test('provider configuration diagnostics are owner-only', () => {
  assert.match(providers, /ownerUser\(request\)/);
  assert.match(providers, /Owner access required/);
});

test('public rate-limit storage does not persist raw unlisted tokens and anonymous identity is link-scoped', () => {
  assert.match(rateLimit, /actionKey = createHash/);
  assert.match(rateLimit, /requestFingerprintHash\(request, actionKey\)/);
  assert.match(rateLimit, /p_action: actionKey/);
  assert.match(reaction, /\$\{token\}\|cantoa-gift-v2/);
  assert.match(vote, /cantoa_group_voter_\$\{createHash/);
  assert.match(vote, /const cookiePath = `\/api\/contribute\/\$\{token\}`/);
  assert.match(vote, /sameSite: "strict"/);
});

test('unlisted public reads are no-store and vote-count database failures are not shown as zero', () => {
  assert.match(contribution, /votesError/);
  assert.match(contribution, /Cache-Control": "private, no-store"/);
  assert.match(reaction, /Cache-Control": "private, no-store"/);
});

test('shared-song database outages produce temporary-error behavior instead of false 404s', () => {
  assert.match(sharePage, /songError/);
  assert.match(sharePage, /SHARED_SONG_LOOKUP_UNAVAILABLE/);
  assert.match(sharePage, /dropError/);
  assert.match(giftClient, /URL\.revokeObjectURL\(reactionUrl\)/);
});

test('failed provider generations report whether quota restoration was actually confirmed', () => {
  assert.match(usage, /Do not blindly retry this non-idempotent RPC/);
  assert.match(usage, /return !error/);
  assert.match(music, /refundConfirmed/);
  assert.match(soundtrack, /refundConfirmed/);
  assert.match(remix, /refundConfirmed/);
  assert.match(music, /could not confirm the automatic minute restoration/);
});

test('privacy wording no longer calls an unlisted gift link private', () => {
  assert.match(marketing, /unlisted gift link/);
  assert.match(page, /Anyone with this unlisted link can contribute and see shared ideas/);
});
