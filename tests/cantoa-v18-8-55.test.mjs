import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const page = read('app/page.tsx');
const css = read('app/globals.css');
const layout = read('app/layout.tsx');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

function routeExists(route) {
  const clean = route.split('?')[0].replace(/\$\{[^}]+\}/g, '[id]');
  const parts = clean.replace(/^\/api\//, '').split('/');
  const candidates = walk(path.join(root, 'app/api')).filter((p) => p.endsWith('route.ts'));
  return candidates.some((p) => {
    const rel = '/' + path.relative(path.join(root, 'app'), p).replace(/\\/g, '/').replace(/\/route\.ts$/, '');
    const pattern = '^' + rel.replace(/\[[^/]+\]/g, '[^/]+') + '$';
    return new RegExp(pattern).test(clean);
  });
}

test('v18.8.55 package and lockfile agree', () => {
  assert.equal(pkg.version, '0.18.8.55');
  assert.equal(lock.version, '0.18.8.55');
  assert.equal(lock.packages[''].version, '0.18.8.55');
  assert.match(pkg.scripts['test:current'], /cantoa-v18-8-55\.test\.mjs/);
});

test('root layout keeps analytics inside body and preserves viewport safe-area support', () => {
  assert.match(layout, /<body[^>]*>[\s\S]*\{children\}[\s\S]*<CantoaAnalytics \/>[\s\S]*<\/body>/);
  assert.doesNotMatch(layout, /<\/body>\s*<CantoaAnalytics/);
  assert.match(layout, /viewportFit:\s*"cover"/);
});

test('rapid double-clicks cannot launch duplicate billable creation jobs', () => {
  assert.match(page, /const creationJobLockRef = useRef\(false\)/);
  assert.match(page, /const generatePreviews = async \(\) => \{\s*if \(creationJobLockRef\.current\)/);
  assert.match(page, /const generateSong = async \(override\?: string\) => \{\s*if \(creationJobLockRef\.current\)/);
  assert.ok((page.match(/creationJobLockRef\.current = true/g) || []).length >= 2);
  assert.ok((page.match(/creationJobLockRef\.current = false/g) || []).length >= 2);
});

test('partial A/B preview success is retained and billed honestly', () => {
  assert.match(page, /const previewResults: Preview\[\] = \[\]/);
  assert.match(page, /if \(previewResults\.length > 0\)[\s\S]*setPreviews\(previewResults\)/);
  assert.match(page, /Only successful audio was charged/);
});

test('creation navigation stays locked while generation or preview is active', () => {
  assert.match(page, /disabled=\{generating \|\| previewing\}[\s\S]*<Plus \/> Create/);
  assert.match(page, /disabled=\{generating \|\| previewing\}[\s\S]*<Library \/> Library/);
  assert.match(page, /<fieldset className="create-view" disabled=\{generating \|\| previewing\}/);
  assert.match(page, /owner-nav-link \$\{generating \|\| previewing \? "busy-disabled"/);
});

test('desktop and phone creation surfaces use the same intended grid', () => {
  assert.match(css, /--cantoa-studio-width:\s*1080px/);
  assert.match(css, /\.moment-launcher,\s*\n\s*\.composer[\s\S]*max-width:\s*var\(--cantoa-studio-width\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.moment-launcher,\s*\n\s*\.composer \{ width: 100%; max-width: 100%; \}/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test('Create/Advanced and choice tabs have explicit readable light/dark states', () => {
  for (const selector of [
    '.theme-light .composer-tabs button', '.theme-light .composer-tabs button.active',
    '.theme-dark .composer-tabs button', '.theme-dark .composer-tabs button.active',
    '.theme-light .segmented button', '.theme-dark .segmented button',
    '.theme-light .cantoa-source-grid > button.active', '.theme-dark .cantoa-source-grid > button.active',
    '.theme-light .smart-create-directions button.active', '.theme-dark .smart-create-directions button.active'
  ]) assert.ok(css.includes(selector), `missing theme rule: ${selector}`);
});

test('new Library remix/blend UI has explicit light and dark contrast', () => {
  for (const selector of [
    '.theme-light .library-transform-modal', '.theme-dark .library-transform-modal',
    '.theme-light .library-transform-grid > button', '.theme-dark .library-transform-grid > button',
    '.theme-light .library-transform-grid > button.active', '.theme-dark .library-transform-grid > button.active',
    '.theme-light .library-transform-note textarea', '.theme-dark .library-transform-note textarea'
  ]) assert.ok(css.includes(selector), `missing theme rule: ${selector}`);
});

test('Library transforms cover all promised workflows and keep originals untouched', () => {
  for (const label of ['Another version','Change style','Keep lyrics · change music','Keep music feel · new lyrics','Extend','Replace a section','Make instrumental','Make vocal version','Blend songs']) {
    assert.ok(page.includes(label), `missing ${label}`);
  }
  assert.match(page, /original must remain unchanged/i);
  assert.match(page, /Your original stays untouched/i);
  assert.match(page, /fetch\("\/api\/music\/remix"/);
});

test('Blend supports 2–4 songs without inflating short-song duration or provider prompt size', () => {
  assert.match(page, /Choose at least two songs to blend/);
  assert.match(page, /if \(ids\.length >= 4\)/);
  assert.match(page, /String\(item\.prompt \|\| ""\)\.slice\(0, 900\)/);
  assert.match(page, /lyric\.slice\(0, 450\)/);
  assert.match(page, /setDuration\(Math\.min\(300, Math\.max\(30, anchor\.duration\)\)\)/);
});

test('source precedence protects audio remix from stale photo/video state', () => {
  assert.match(page, /setSourceMode\(true\);\s*\n\s*setSourceKind\("audio"\)/);
  assert.match(page, /setVisualScoreFile\(null\);\s*\n\s*setVideoSourceFile\(null\);\s*\n\s*setMemoryPhotos\(\[\]\)/);
  assert.match(page, /if \(intentPlan\.soundtrack && \(videoSourceFile \|\| visualScoreFile\)\)/);
  assert.match(page, /else if \(sourceMode && sourceFile\)/);
});

test('free and paid commercial limits remain 2 free / 40 Creator / 120 Studio', () => {
  const pricing = read('app/api/pricing/route.ts');
  const usage = read('lib/usage.ts');
  assert.match(pricing, /creator:[\s\S]*minutes:\s*40/);
  assert.match(pricing, /studio:[\s\S]*minutes:\s*120/);
  assert.match(pricing, /freeSongs:\s*2,\s*maxMinutesEach:\s*2/);
  assert.match(usage, /FREE_SONGS_USED/);
  assert.match(usage, /minutes > 2/);
  assert.match(usage, /reserve_generation_minutes/);
});

test('USD and INR plan prices remain correct', () => {
  const pricing = read('app/api/pricing/route.ts');
  assert.match(pricing, /₹499/);
  assert.match(pricing, /₹1,299/);
  assert.match(pricing, /US\$7\.99/);
  assert.match(pricing, /US\$19\.99/);
});

test('provider-backed generation uses rate limit, atomic reservation and refund path', () => {
  for (const file of ['app/api/music/route.ts','app/api/music/remix/route.ts','app/api/soundtrack/route.ts']) {
    const s = read(file);
    assert.match(s, /enforceRateLimit/);
    assert.match(s, /reserveMinutes/);
    assert.match(s, /refundMinutes/);
  }
});

test('website import retains SSRF, redirect, size and timeout hardening', () => {
  const source = read('app/api/source/route.ts');
  assert.match(source, /assertPublicHost/);
  assert.match(source, /privateIp/);
  assert.match(source, /AbortSignal\.timeout|AbortController|setTimeout/);
  assert.match(source, /2_000_000|2 \* 1024 \* 1024|2\*1024\*1024/);
  assert.match(source, /redirect/);
});

test('Group Song public surfaces are token-gated and throttled', () => {
  const contribute = read('app/api/contribute/[token]/route.ts');
  const vote = read('app/api/contribute/[token]/vote/route.ts');
  assert.match(contribute, /checkPublicRateLimit/);
  assert.match(vote, /checkPublicRateLimit/);
  assert.match(vote, /HttpOnly|httpOnly/);
  assert.match(page, /unlisted/i);
});

test('My Voice remains premium and provider calls are rate-limited', () => {
  const features = read('lib/features.ts');
  const voice = read('app/api/my-voice/route.ts');
  const preview = read('app/api/my-voice/preview/route.ts');
  assert.match(features, /my_voice:\s*\["Creator",\s*"Studio",\s*"Owner"\]/);
  assert.match(voice, /enforceRateLimit/);
  assert.match(preview, /enforceRateLimit/);
  assert.match(preview, /ensurePremiumAccess/);
});

test('Stripe webhook has idempotency claim and stale-processing recovery', () => {
  const webhook = read('app/api/stripe/webhook/route.ts');
  assert.match(webhook, /processing/);
  assert.match(webhook, /processed/);
  assert.match(webhook, /claim/i);
  assert.match(webhook, /stale/i);
});

test('sensitive pages are not indexed and analytics excludes them', () => {
  const robots = read('app/robots.ts');
  const analytics = read('components/cantoa-analytics.tsx');
  for (const prefix of ['/share/','/contribute/','/owner','/checkout-success']) {
    assert.ok(robots.includes(`"${prefix}"`) || robots.includes(`'${prefix}'`));
    assert.ok(analytics.includes(`"${prefix}"`) || analytics.includes(`'${prefix}'`));
  }
});

test('every literal client /api fetch resolves to a route in the package', () => {
  const files = walk(root).filter((p) => /\.(ts|tsx)$/.test(p) && !p.includes(`${path.sep}app${path.sep}api${path.sep}`));
  const routes = new Set();
  const rx = /fetch\(\s*[`"'](\/api\/[^`"']+)/g;
  for (const file of files) {
    const s = fs.readFileSync(file, 'utf8');
    for (const m of s.matchAll(rx)) routes.add(m[1]);
  }
  for (const route of routes) assert.ok(routeExists(route), `missing API route for ${route}`);
});

test('source tree contains no TODO/FIXME/HACK markers', () => {
  const files = walk(root).filter((p) => /\.(ts|tsx)$/.test(p) && !p.includes(`${path.sep}node_modules${path.sep}`));
  for (const file of files) assert.doesNotMatch(fs.readFileSync(file,'utf8'), /\b(?:TODO|FIXME|HACK|XXX)\b/, file);
});

test('current page class names all have stylesheet coverage', () => {
  const literalClasses = new Set();
  for (const m of page.matchAll(/className="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) if (c) literalClasses.add(c);
  for (const c of literalClasses) assert.ok(css.includes(`.${c}`), `missing CSS for .${c}`);
});
