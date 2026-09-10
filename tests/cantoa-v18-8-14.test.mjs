import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.14 accepts songs whose persisted id is optional', () => {
  assert.match(page, /id\?: string/);
  assert.match(page, /const songExportKey = \(value: Song\) =>/);
  assert.match(page, /value\.id \|\|/);
  assert.match(page, /const key = songExportKey\(song\)/);
  assert.match(page, /songId: key/);
});

test('v18.8.14 stale-song guards use the same stable export key', () => {
  const occurrences = page.match(/songExportKey\(song\) !== (?:sessionForSong\.songId|expectedSongId)/g) || [];
  assert.ok(occurrences.length >= 6, `expected multiple stable-key guards, got ${occurrences.length}`);
});

test('v18.8.14 package version', () => assert.equal(pkg.version, '0.18.8.14'));
