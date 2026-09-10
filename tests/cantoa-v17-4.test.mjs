import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const stems = await readFile(new URL('../app/api/music/stems/route.ts', import.meta.url), 'utf8');
const source = await readFile(new URL('../app/api/source/route.ts', import.meta.url), 'utf8');
const checkout = await readFile(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const usage = await readFile(new URL('../lib/usage.ts', import.meta.url), 'utf8');
const sql = await readFile(new URL('../supabase-setup.sql', import.meta.url), 'utf8');

test('light result Finish & Share panel is theme-aware', () => {
  assert.match(css, /\.theme-light \.v17-finish\s*\{/);
  assert.match(css, /\.theme-light \.v17-finish-actions button/);
});

test('cloud failures are honest and retryable', () => {
  assert.doesNotMatch(page, /cloud sync will retry later/i);
  assert.match(page, /Retry cloud save/);
  assert.match(page, /cloud save failed/i);
});

test('Explore keeps MP3 sharing and branded social exports while production tools remain premium', () => {
  assert.match(page, /WAV export/);
  assert.match(page, /Stem separation/);
  assert.match(page, /Creator Pack/);
  assert.match(page, /requirePremiumTool/);
  assert.match(page, /MP3 download, sharing/);
});

test('stems are protected on both client and server', () => {
  assert.match(stems, /ensurePremiumAccess/);
  assert.match(stems, /enforceRateLimit/);
  assert.match(page, /Authorization: `Bearer \$\{session\.access_token\}`/);
});

test('provider endpoints have server-side per-account throttling', () => {
  assert.match(usage, /check_cantoa_rate_limit/);
  assert.match(usage, /RATE_LIMITED/);
  assert.match(sql, /create table if not exists public\.cantoa_rate_limits/);
  assert.match(sql, /check_cantoa_rate_limit/);
});

test('webpage import blocks private DNS targets and caps response size', () => {
  assert.match(source, /lookup\(hostname/);
  assert.match(source, /privateIp/);
  assert.match(source, /maxBytes = 2_000_000/);
  assert.match(source, /redirect: "error"/);
});

test('checkout cannot be started anonymously', () => {
  assert.match(checkout, /authenticatedUser\(request\)/);
  assert.match(checkout, /Sign in before starting checkout/);
});

test('membership copy does not advertise unimplemented Studio features', () => {
  assert.doesNotMatch(page, /Priority processing/);
  assert.doesNotMatch(page, /Project and album organization/);
  assert.doesNotMatch(page, /Limited one-month rollover/);
  assert.match(page, /2 free music creations/);
});

test('new song does not accidentally become a revision of the prior song', () => {
  const newSongBlock = page.slice(page.indexOf('const newSong ='), page.indexOf('const download ='));
  assert.match(newSongBlock, /setSong\(null\)/);
  assert.match(newSongBlock, /setSourceMode\(false\)/);
  assert.match(newSongBlock, /setSourceFile\(null\)/);
});

test('local library records are scoped to the signed-in account going forward', () => {
  assert.match(page, /ownerId\?: string/);
  assert.match(page, /item\.ownerId === session\.user\.id/);
  assert.match(page, /Recover \{legacyLocalCount\} device-only/);
});

test('successful generation is shown even if IndexedDB save fails', () => {
  const posSetSong = page.indexOf('setSong({ ...savedSong, blob, url: objectUrl })');
  const posLocalPut = page.indexOf('await localPut(savedSong');
  assert.ok(posSetSong > -1 && posLocalPut > -1 && posSetSong < posLocalPut);
  assert.match(page, /Your song was created, but this browser could not save it/);
});

test('audio remix extracts the provider composition plan correctly', async () => {
  const remix = await readFile(new URL('../app/api/music/remix/route.ts', import.meta.url), 'utf8');
  assert.match(remix, /rawPlan\.composition_plan\|\|rawPlan/);
  assert.match(remix, /mp3_48000_192/);
});
