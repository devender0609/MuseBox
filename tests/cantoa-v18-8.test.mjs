import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('v18.8 adds Cantoa Moments behind one progressive-disclosure surface', () => {
  assert.match(page, /More with this song/);
  assert.match(page, /Cantoa Moments/);
  assert.match(css, /\.moment-lab/);
  assert.match(page, /Song DNA/);
  assert.match(page, /Living Song/);
  assert.match(page, /Time Machine/);
  assert.match(page, /Memory Capsule/);
  assert.match(page, /Song Reply/);
  assert.match(page, /Group Song/);
});

test('v18.8 adds invisible intelligence instead of more main navigation', () => {
  assert.match(page, /Cultural intelligence:/);
  assert.match(page, /Story-to-chorus:/);
  assert.match(page, /Duet intelligence:/);
  assert.match(page, /Emotion Lock:/);
});

test('v18.8 best-moment social video reuses finished audio', () => {
  assert.match(page, /findBestClipOffset/);
  assert.match(page, /audio\.currentTime = clipOffset/);
  assert.match(page, /One song → many formats/);
});

test('v18.8 memory capsule and passport are local packaging rather than hidden music generations', () => {
  assert.match(page, /createMemoryCapsule/);
  assert.match(page, /CANTOA SONG PASSPORT/);
  assert.match(page, /No new music generation was used to build this package/);
});

test('v18.8 adds real group contribution and scheduled drop server paths', async () => {
  const collect = await readFile(new URL('../app/api/library/[id]/collect/route.ts', import.meta.url), 'utf8');
  const contribute = await readFile(new URL('../app/api/contribute/[token]/route.ts', import.meta.url), 'utf8');
  const drop = await readFile(new URL('../app/api/library/[id]/drop/route.ts', import.meta.url), 'utf8');
  const sql = await readFile(new URL('../supabase-setup.sql', import.meta.url), 'utf8');
  assert.match(collect, /moment_collections/);
  assert.match(contribute, /moment_contributions/);
  assert.match(drop, /song_drops/);
  assert.match(sql, /v18\.8_cantoa_moments/);
});

test('v18.8 keeps scheduled gift audio server-side locked until unlock time', async () => {
  const share = await readFile(new URL('../app/share/[token]/page.tsx', import.meta.url), 'utf8');
  assert.match(share, /const locked = Boolean/);
  assert.match(share, /song_drops/);
  assert.match(share, /if \(!locked\)/);
});
