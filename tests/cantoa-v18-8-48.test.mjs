import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (p) => readFileSync(p, 'utf8');
const page = read('app/page.tsx');
const owner = read('app/owner/page.tsx');
const analytics = read('app/api/owner/analytics/route.ts');
const checkout = read('app/api/checkout/route.ts');
const pricing = read('app/api/pricing/route.ts');
const usage = read('lib/usage.ts');
const libraryRoute = read('app/api/library/route.ts');
const contributeRoute = read('app/api/contribute/[token]/route.ts');
const voteRoute = read('app/api/contribute/[token]/vote/route.ts');
const envExample = read('.env.example');
const pkg = JSON.parse(read('package.json'));

function filesUnder(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...filesUnder(p)); else out.push(p);
  }
  return out;
}

test('release version is v18.8.48', () => {
  assert.equal(pkg.version, '0.18.8.48');
});

test('starter cards become inspiration only after the user edits the main brief', () => {
  assert.match(page, /starterSeedPrompt/);
  assert.match(page, /setStarterSeedPrompt\(idea\.prompt\)/);
  assert.match(page, /if \(starterSeedPrompt && value !== starterSeedPrompt\)/);
  assert.match(page, /setMomentId\("anything"\)/);
  assert.match(page, /setStyle\("Auto — follow my prompt"\)/);
  assert.match(page, /setLanguage\("Auto — follow my prompt"\)/);
  assert.match(page, /starterOverridesRef/);
  assert.match(page, /if \(!overrides\.has\("mode"\)\) setMode\("vocals"\)/);
  assert.match(page, /if \(!overrides\.has\("duration"\)\) setDuration\(120\)/);
  assert.match(page, /markStarterOverride\("mode"\)/);
  assert.match(page, /markStarterOverride\("duration"\)/);
  assert.match(page, /explicitlyNoVocals/);
  assert.match(page, /asksInstrumental && !asksVocals/);
  assert.match(page, /else if \(asksVocals\) setMode\("vocals"\)/);
});

test('programmatic source/revision changes clear stale starter provenance', () => {
  const clears = page.match(/setStarterSeedPrompt\(null\)/g) || [];
  assert.ok(clears.length >= 10, `expected broad starter provenance cleanup, got ${clears.length}`);
  assert.match(page, /setStarterSeedPrompt\(null\);\n\s*setPrompt\(`Turn this spoken story/);
  assert.match(page, /setStarterSeedPrompt\(null\);\n\s*setPrompt\(\(current\) =>/);
});

test('creation navigation and workspace stay locked while generating or previewing', () => {
  assert.match(page, /<fieldset[^>]*disabled=\{generating \|\| previewing\}/);
  assert.match(page, /disabled=\{generating \|\| previewing\}/);
});

test('native audio extensions are preserved across cloud and packaged exports', () => {
  assert.match(page, /const songAudio = audioFileInfo\(song\.blob\)/);
  assert.match(page, /zip\.file\(`\$\{slug\}\.\$\{songAudio\.extension\}`/);
  assert.match(page, /const backingExt = audioFileInfo\(backing\)\.extension/);
  assert.match(page, /const extension = audioFileInfo\(blob\)\.extension/);
  assert.doesNotMatch(page, /zip\.file\(`\$\{slug\}\.mp3`, song\.blob\)/);
});



test('cloud library stores supported native audio formats instead of forcing mp3 filenames', () => {
  assert.match(libraryRoute, /audioType === "audio\/wav" \|\| audioType === "audio\/x-wav"/);
  assert.match(libraryRoute, /audioType === "audio\/mp4" \|\| audioType === "audio\/x-m4a"/);
  assert.match(libraryRoute, /storageKey = `\$\{user\.id\}\/\$\{id\}\.\$\{audioExtension\}`/);
  assert.doesNotMatch(libraryRoute, /storageKey = `\$\{user\.id\}\/\$\{id\}\.mp3`/);
});

test('Group Song public write surfaces remain token-gated, throttled and vote identity is server controlled', () => {
  assert.match(contributeRoute, /checkRateLimit/);
  assert.match(voteRoute, /checkRateLimit/);
  assert.match(voteRoute, /httpOnly:\s*true/);
  assert.doesNotMatch(voteRoute, /body\.voterToken/);
});
test('owner console separates USD and INR MRR and lists paying memberships', () => {
  assert.match(owner, /India \/ INR active-plan MRR/);
  assert.match(owner, /PAID MEMBERS/);
  assert.match(owner, /analytics\.paidMembers/);
  assert.match(owner, /INR identifies India regional pricing/);
  assert.match(analytics, /usdPaidMembers/);
  assert.match(analytics, /inrPaidMembers/);
  assert.match(analytics, /paidMembers/);
  assert.match(analytics, /creatorInrConfigured/);
  assert.match(analytics, /studioInrConfigured/);
});

test('regional recurring pricing keeps the approved USD and INR amounts', () => {
  for (const src of [checkout, pricing]) {
    assert.match(src, /799/);
    assert.match(src, /1999/);
    assert.match(src, /49900/);
    assert.match(src, /129900/);
  }
  assert.match(checkout, /STRIPE_CREATOR_PRICE_INR/);
  assert.match(checkout, /STRIPE_STUDIO_PRICE_INR/);
  assert.match(checkout, /unit_amount/);
  assert.match(checkout, /recurring/);
});

test('commercial usage invariants remain two Explore songs, 40 Creator minutes, 120 Studio minutes and two-minute free cap', () => {
  assert.match(page, /creator: \{ amountMinor: 799, display: "US\$7\.99", minutes: 40 \}/);
  assert.match(page, /studio: \{ amountMinor: 1999, display: "US\$19\.99", minutes: 120 \}/);
  assert.match(page, /explore: \{ freeSongs: 2, maxMinutesEach: 2 \}/);
  assert.match(usage, /if \(minutes > 2\) throw new Error\("FREE_SONG_TOO_LONG"\)/);
});

test('owner deployment environment is documented without exposing secrets', () => {
  assert.match(envExample, /^CANTOA_OWNER_EMAILS=/m);
  assert.doesNotMatch(envExample, /sk_live_|whsec_[A-Za-z0-9]{8,}/);
});

test('user-facing download copy does not falsely promise MP3 for provider-native audio', () => {
  assert.doesNotMatch(page, /free creations remain downloadable as MP3/i);
  assert.doesNotMatch(page, /Download the MP3 now/i);
  assert.doesNotMatch(page, /MP3 downloaded—attach it/i);
  assert.doesNotMatch(page, /A complete MP3 is generated/i);
  assert.match(page, /A complete audio file is generated/);
});

test('every literal client /api fetch target maps to an API route', () => {
  const apiFiles = filesUnder('app/api').filter((p) => /route\.(ts|tsx|js|jsx)$/.test(p));
  const patterns = new Set(apiFiles.map((p) => {
    let r = '/' + relative('app', p).replace(/\\/g, '/').replace(/\/route\.(ts|tsx|js|jsx)$/, '');
    return r.replace(/\[\.\.\.([^\]]+)\]/g, ':rest').replace(/\[([^\]]+)\]/g, ':param');
  }));
  const literals = [...page.matchAll(/fetch\(\s*["'`]((?:\/api\/)[^"'`$?]+)/g)].map((m) => m[1].replace(/\/$/, ''));
  const canMatch = (target) => [...patterns].some((pat) => {
    const re = new RegExp('^' + pat.split('/').map((x) => x === ':param' ? '[^/]+' : x === ':rest' ? '.+' : x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/') + '$');
    return re.test(target);
  });
  const missing = [...new Set(literals)].filter((t) => !canMatch(t));
  assert.deepEqual(missing, []);
});
