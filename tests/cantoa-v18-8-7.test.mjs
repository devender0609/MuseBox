import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.7 separates karaoke and instrumental UI state', () => {
  assert.match(pkg.version, /^0\.18\.8\.(?:[7-9]|[1-9][0-9]+)$/);
  assert.match(page, /const \[karaokeBuilding, setKaraokeBuilding\]/);
  assert.match(page, /const \[instrumentalBuilding, setInstrumentalBuilding\]/);
  assert.match(page, /disabled=\{karaokeBuilding\}/);
  assert.match(page, /disabled=\{instrumentalBuilding\}/);
  assert.doesNotMatch(page, /disabled=\{!!action\}[\s\S]{0,180}Karaoke package/);
});

test('v18.8.7 deduplicates the shared backing-track job', () => {
  assert.match(page, /backingTrackPromiseRef/);
  assert.match(page, /sessionForSong\.backingPromise|backingTrackPromiseRef\.current/);
  assert.match(page, /setBackingTrackStatus\("building"\)/);
  assert.match(page, /setBackingTrackStatus\("ready"\)/);
});

test('v18.8.7 downloads generated files without navigating or opening a new target', () => {
  assert.match(page, /const downloadBlob = \(blob: Blob, filename: string\)/);
  assert.match(page, /document\.body\.appendChild\(a\)/);
  assert.match(page, /a\.download = filename/);
  assert.doesNotMatch(page, /a\.target\s*=\s*["']_blank["']/);
  assert.doesNotMatch(page, /window\.open\([^\n]*karaoke/i);
});

test('v18.8.7 reuses a ready backing track across karaoke and instrumental downloads', () => {
  assert.match(page, /if \(sessionForSong\.backingBlob\) return sessionForSong\.backingBlob|if \(backingTrackBlob\) return backingTrackBlob/);
  assert.match(page, /Download karaoke package · Creator/);
  assert.match(page, /Download instrumental version · Creator/);
  assert.match(page, /Shared backing track is already being prepared/);
});
