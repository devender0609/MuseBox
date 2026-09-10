import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const route = await readFile(new URL('../app/api/music/stems/route.ts', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('v18.8.8 uses provider two-stem instrumental for karaoke/backing audio', () => {
  assert.match(page, /requestStemArchive\("two_stems_v1"\)/);
  assert.match(page, /instrumental\|accompaniment\|music/i);
  assert.match(page, /provider returned a silent instrumental track/);
  assert.match(route, /two_stems_v1/);
  assert.match(route, /mp3_44100_128/);
});

test('v18.8.8 validates six-stem archives instead of downloading empty output', () => {
  assert.match(page, /validateStemArchive/);
  assert.match(page, /requestStemArchive\("six_stems_v1"\)/);
  assert.match(page, /provider returned silent stem audio/);
  assert.match(route, /archive\.byteLength < 2048/);
  assert.match(route, /0x50/);
  assert.match(route, /0x4b/);
});

test('v18.8.8 makes moment and sing-along panels readable in light and dark themes', () => {
  for (const selector of ['moment-lab','sing-along-panel']) {
    assert.ok(css.includes(`.theme-light .${selector}`));
    assert.ok(css.includes(`.theme-dark .${selector}`));
  }
  assert.match(css, /\.theme-dark \.sing-along-lines p\.active/);
  assert.match(css, /\.theme-dark \.export-grid button small/);
});
