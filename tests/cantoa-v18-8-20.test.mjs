import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.20 keeps pronunciation editing inside Revision Studio', () => {
  assert.match(page, /Fix words & pronunciation/);
  assert.match(page, /openPronunciationFix/);
  assert.doesNotMatch(page, /type View = [^\n]*pronunciation/);
});

test('v18.8.20 supports line-level lyric editing and linked revision', () => {
  assert.match(page, /resultLyricLines\.map/);
  assert.match(page, /Use these edited lyrics exactly/);
  assert.match(page, /lyricsOverride/);
  assert.match(page, /Create revised version/);
});

test('v18.8.20 remembers pronunciations privately without new SQL schema', () => {
  assert.match(page, /cantoa-pronunciation-memory:/);
  assert.match(page, /cantoa_pronunciations/);
  assert.match(page, /auth\.updateUser/);
  assert.match(page, /Remembered pronunciation:/);
});

test('v18.8.20 only injects remembered pronunciations when matching text appears', () => {
  assert.match(page, /pronunciationSearchText\.includes\(entry\.target\.toLocaleLowerCase\(\)\)/);
});

test('v18.8.20 pronunciation editor has explicit light and dark styling', () => {
  assert.match(css, /\.theme-dark \.result-pronunciation-fix/);
  assert.match(css, /\.theme-light \.result-pronunciation-fix/);
});

test('v18.8.20 package version', () => {
  assert.equal(pkg.version, '0.18.8.20');
});
