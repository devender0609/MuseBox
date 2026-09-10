import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const providers = await readFile(new URL('../lib/music-providers.ts', import.meta.url), 'utf8');
const ownerApi = await readFile(new URL('../app/api/owner/analytics/route.ts', import.meta.url), 'utf8');
const ownerPage = await readFile(new URL('../app/owner/page.tsx', import.meta.url), 'utf8');
const ownerLayout = await readFile(new URL('../app/owner/layout.tsx', import.meta.url), 'utf8');
const proxy = await readFile(new URL('../proxy.ts', import.meta.url), 'utf8');
const planRoute = await readFile(new URL('../app/api/music/plan/route.ts', import.meta.url), 'utf8');

test('v18.7.9 makes prompt vocal direction authoritative and defaults voice to Auto', () => {
  assert.match(page, /useState\("Auto — follow my prompt"\)/);
  assert.match(page, /inferPromptVoiceDirection\(effectiveUserBrief\)/);
  assert.match(page, /promptVoice \|\| selectedVoice/);
  assert.match(page, /prompt explicitly names a voice[\s\S]*prompt takes priority/);
});

test('v18.7.9 clears transient finalizing state after completed audio is ready', () => {
  assert.match(page, /setView\("song"\);[\s\S]{0,120}setMessage\(""\)/);
});

test('v18.7.9 gives actionable policy errors and hides raw provider JSON', () => {
  assert.match(page, /mood, genre, instruments, vocal character, tempo or energy/);
  assert.match(planRoute, /instead of asking to copy a specific artist, song or movie style/);
});

test('v18.7.9 classifies provider fallback reasons', () => {
  assert.match(providers, /quota_exceeded · primary API-key quota\/limit rejected the request/);
  assert.match(providers, /concurrency_limit/);
  assert.match(providers, /permission_denied/);
});

test('v18.7.9 reports last-24-hour recovery separately from 30-day routing history', () => {
  assert.match(ownerApi, /recent24hPrimaryCompletionRate/);
  assert.match(ownerApi, /The 30-day totals still include older provider-key failures/);
  assert.match(ownerPage, /Last 24h:/);
});

test('v18.7.9 enforces canonical host and noindexes owner console', () => {
  assert.match(proxy, /www\.cantoamusic\.com/);
  assert.match(proxy, /NextResponse\.redirect\(url, 308\)/);
  assert.match(ownerLayout, /index: false/);
});
