import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.16 download paths explicitly dismiss account modal', () => {
  assert.match(page, /const download = \(\) => \{[\s\S]*setAccountOpen\(false\)/);
  assert.match(page, /const downloadBlob = \(blob: Blob, filename: string\) => \{[\s\S]*setAccountOpen\(false\)/);
  assert.match(page, /const exportWav = async \(\) => \{[\s\S]*setAccountOpen\(false\)/);
});

test('v18.8.16 feature authorization no longer force-opens account modal', () => {
  const start = page.indexOf('const authorizeFeature');
  const end = page.indexOf('const completePrompt', start);
  const block = page.slice(start, end);
  assert.doesNotMatch(block, /setAccountOpen\(true\)/);
  assert.match(block, /Sign in to use this feature/);
});

test('v18.8.16 stem source filename matches source audio MIME', () => {
  assert.match(page, /const sourceType = sourceSong\.blob\.type/);
  assert.match(page, /const sourceExt = \/wav\/i\.test\(sourceType\)/);
  assert.match(page, /`song\.\$\{sourceExt\}`/);
});

test('v18.8.16 preserves provider stem bytes unchanged in output ZIP', () => {
  assert.match(page, /output\.file\(filename, rawBuffer\)/);
  assert.doesNotMatch(page.slice(page.indexOf('const sanitizeSixStemArchive'), page.indexOf('const getSixStemArchive')), /mp3WithCantoaArtwork/);
});

test('v18.8.16 package version', () => assert.equal(pkg.version, '0.18.8.16'));
