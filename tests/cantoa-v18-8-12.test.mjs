import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.12 keeps instrumental separation in provider-native audio instead of unnecessary PCM conversion', () => {
  assert.match(page, /const sourceBlob = new Blob\(\[buffer\], \{ type: sourceType \}\)/);
  assert.match(page, /mp3WithCantoaArtwork\(sourceBlob/);
  assert.match(page, /blob\.type === "audio\/mpeg" \? "mp3" : "wav"/);
});

test('v18.8.12 refuses silent backing tracks before download', () => {
  assert.match(page, /rms < 0\.00008/);
  assert.match(page, /Cantoa stopped the download instead of giving you an empty file/);
});

test('v18.8.12 verifies individual stem audibility and falls back to two stems when detailed separation is unusable', () => {
  assert.match(page, /available\.length < 2/);
  assert.match(page, /two-stem fallback \(vocals \+ instrumental\)/);
  assert.match(page, /browser could not decode this provider file/);
});

test('v18.8.12 keeps PCM WAV clean and validates source audio before download', () => {
  assert.match(page, /const wav = pcmWav\(decoded\)/);
  assert.match(page, /The source audio decoded as silent/);
  assert.match(page, /player artwork is not standardized for WAV/);
});

test('package remains in the v18.8 release family', () => assert.match(pkg.version, /^0\.18\.8\./));
