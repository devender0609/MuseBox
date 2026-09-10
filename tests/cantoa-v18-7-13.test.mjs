import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const analytics = await readFile(new URL('../app/api/owner/analytics/route.ts', import.meta.url), 'utf8');
const owner = await readFile(new URL('../app/owner/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.7.13 keeps hidden Advanced voice state out of Create mode', () => {
  assert.match(page, /const advancedMode = createMode === "advanced"/);
  assert.match(page, /const selectedVoice = advancedMode && voice\.trim\(\)/);
  assert.match(page, /promptVoice \|\| selectedVoice/);
});

test('v18.7.13 gates Advanced-only pronunciation, section language and exclusions', () => {
  assert.match(page, /advancedMode && sectionLanguagePlan/);
  assert.match(page, /advancedMode && \(pronunciation\.trim\(\) \|\| structuredPronunciation\)/);
  assert.match(page, /advancedMode && exclude/);
});

test('v18.7.13 prevents hidden Advanced finish quality from leaking into Create mode', () => {
  assert.match(page, /const production = advancedMode/);
  assert.match(page, /hidden Advanced preferences/);
});

test('v18.7.13 exposes per-provider current routing alongside 30-day history', () => {
  assert.match(analytics, /recent24hPrimaryRequests/);
  assert.match(analytics, /recent24hDirectCompletions/);
  assert.match(analytics, /recent24hFallbackOuts/);
  assert.match(owner, /Last 24h:/);
  assert.match(owner, /row\.recent24hDirectCompletions/);
});

test('v18.7.13 version floor is preserved', () => {
  const parts = pkg.version.split('.').map(Number);
  assert.ok(parts[0] > 0 || parts[1] > 18 || (parts[1] === 18 && (parts[2] > 7 || (parts[2] === 7 && parts[3] >= 13))));
  assert.equal(pkg.engines.node, '22.x');
});
