import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const sql = fs.readFileSync(new URL('../supabase-setup.sql', import.meta.url), 'utf8');
const gift = fs.readFileSync(new URL('../app/share/[token]/gift-client.tsx', import.meta.url), 'utf8');
const reaction = fs.readFileSync(new URL('../app/api/share/[token]/reaction/route.ts', import.meta.url), 'utf8');
const shareApi = fs.readFileSync(new URL('../app/api/library/[id]/share/route.ts', import.meta.url), 'utf8');

test('v17.8 adds structured pronunciation studio without new navigation', () => {
  assert.match(page, /Pronunciation Studio/);
  assert.match(page, /Teach Cantoa important pronunciations/);
  assert.match(page, /PronunciationEntry/);
  assert.match(page, /All vocals/);
  assert.match(css, /\.pronunciation-editor/);
});

test('v17.8 adds explicit section language controls to the generation brief', () => {
  assert.match(page, /Section language plan/);
  assert.match(page, /Verses:/);
  assert.match(page, /Choruses:/);
  assert.match(page, /Bridge\/outro:/);
  assert.match(page, /Section-by-section language plan/);
  assert.match(css, /\.section-language-grid/);
});

test('v17.8 renders real browser social videos and upgrades Creator Pack 2.0', () => {
  assert.match(page, /canvas\.captureStream\(30\)/);
  assert.match(page, /new MediaRecorder/);
  assert.match(page, /15-sec Reel video/);
  assert.match(page, /Square social video/);
  assert.match(page, /Creator Pack 2\.0/);
  assert.match(page, /reel-15s\.webm/);
  assert.match(page, /instagram-caption/);
});

test('v17.8 gift experience has reveal, sender attribution and privacy-preserving reactions', () => {
  assert.match(gift, /Open your song/);
  assert.match(gift, /Made for you by/);
  assert.match(gift, /Send a reaction/);
  assert.match(gift, /Make one for someone you love/);
  assert.match(shareApi, /gift_from/);
  assert.match(reaction, /createHash/);
  assert.match(reaction, /upsert/);
  assert.match(sql, /create table if not exists public\.gift_reactions/);
  assert.match(sql, /unique\(song_id,fingerprint\)/);
});

test('v17.8 remains on established v17.6 layout architecture', () => {
  assert.match(page, /className="moment-launcher"/);
  assert.match(page, /className="composer-tabs v17-tabs simple-create-tabs"/);
  assert.match(page, /className="song-blueprint blueprint-details"/);
  assert.match(page, /className="result-workflow"/);
  assert.doesNotMatch(page, /Social Video<\/button>\s*<\/nav>/);
});
