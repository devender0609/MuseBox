import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const stems = await readFile(new URL('../app/api/music/stems/route.ts', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('v18.8.9 preserves vocal utilities on legacy revised songs', () => {
  assert.match(page, /const songHasVocals = !!song && \(song\.mode === "vocals" \|\| Boolean\(song\.generatedLyrics\?\.trim\(\)\)\)/);
  assert.match(page, /setMode\(song\.mode === "instrumental" && song\.generatedLyrics\?\.trim\(\) \? "vocals" : song\.mode\)/);
  assert.match(page, /mode: saved\.mode === "instrumental" && generatedLyrics\.trim\(\) \? "vocals" : saved\.mode/);
});

test('v18.8.9 deduplicates six-stem and backing-track work', () => {
  assert.match(page, /sixStemArchiveRef\.current/);
  assert.match(page, /sixStemPromiseRef\.current/);
  assert.match(page, /backingTrackBlobRef\.current/);
});

test('v18.8.9 karaoke package includes an on-screen lyric player', () => {
  assert.match(page, /karaoke-player\.html/);
  assert.match(page, /lyrics\.lrc/);
  assert.match(page, /Use karaoke-player\.html for the guaranteed Cantoa visual and on-screen lyrics|Ordinary WAV players do not display synchronized lyrics|The WAV is audio-only by design/);
});

test('v18.8.9 separates stem quotas and bypasses owner QA quota', () => {
  assert.match(stems, /access\.plan !== "Owner"/);
  assert.match(stems, /`stems_\$\{requestedVariation\}`/);
});

test('v18.8.9 hardens dark and light utility contrast', () => {
  assert.match(css, /v18\.8\.9 — final contrast hardening/);
  assert.match(css, /\.theme-dark \.error \{ color:#ffb4c1!important; \}/);
});
