import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.10 embeds karaoke audio so local HTML can play from ZIP temp extraction', () => {
  assert.match(page, /const embeddedAudio = await blobToDataUrl\(backingTrackSourceRef\.current \|\| backing\)/);
  assert.match(page, /src="\$\{embeddedAudio\}"/);
  assert.match(page, /Audio is embedded in this player/);
});

test('v18.8.10 omits silent six-stem files and adds manifest', () => {
  assert.match(page, /sanitizeSixStemArchive/);
  assert.match(page, /Silent\/unused(?:\/unreadable)? stem categories omitted/);
  assert.match(page, /Cantoa verifies that included tracks are decodable and contain audible signal before download/);
});

test('v18.8.10 adds Cantoa artwork metadata to WAV exports', () => {
  assert.match(page, /wavWithCantoaArtwork/);
  assert.match(page, /APIC/);
  assert.match(page, /Instrumental/);
});

test('package remains in the v18.8 release family', () => assert.match(pkg.version, /^0\.18\.8\./));
