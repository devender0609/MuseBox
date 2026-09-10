import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.7.14 replaces first-five-words naming with quality-aware automatic naming', () => {
  assert.match(source, /function cleanCreativeBrief\(prompt: string\)/);
  assert.match(source, /function titleFromLyrics\(lyrics\?: string\)/);
  assert.match(source, /Patriotic Hip-Hop Anthem/);
  assert.match(source, /Evening Romance/);
  assert.match(source, /Birthday Celebration/);
  assert.doesNotMatch(source, /\.slice\(0, 5\)\s*\.join\(" "\);\s*return clean \|\| "Untitled song"/);
});

test('v18.7.14 cleans the visible output description without overwriting the saved creation brief', () => {
  assert.match(source, /function descriptionFrom\(prompt: string, generatedLyrics = ""\)/);
  assert.match(source, /className="song-prompt">\{descriptionFrom\(song\.prompt, song\.generatedLyrics\)\}/);
  assert.match(source, /prompt: effectiveUserBrief,\s*mode,\s*duration,/s);
});

test('v18.7.14 preserves an explicit user title over automatic naming', () => {
  assert.match(source, /const songTitle = title\.trim\(\) \|\| titleFrom\(effectiveUserBrief, generatedLyrics\);/);
});

test('v18.7.14 or later version is present', () => {
  const parts = pkg.version.split('.').map(Number);
  assert.ok(parts[0] === 0 && parts[1] === 18 && (parts[2] > 7 || (parts[2] === 7 && parts[3] >= 14)));
});
