import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.13 has a per-song export session keyed by song id', () => {
  assert.match(page, /type SongExportSession =/);
  assert.match(page, /songId: string/);
  assert.match(page, /exportSessionRef = useRef<SongExportSession \| null>/);
  assert.match(page, /current\?\.songId === (?:song\.id|key)/);
});

test('v18.8.13 serializes provider stem jobs to prevent random-order races', () => {
  assert.match(page, /runStemProviderJob/);
  assert.match(page, /providerQueue/);
  assert.match(page, /await previous/);
});

test('v18.8.13 shares one two-stem archive across karaoke instrumental and six-stem fallback', () => {
  assert.match(page, /const getTwoStemArchive = async/);
  assert.match(page, /sessionForSong\.twoStemPromise/);
  assert.match(page, /const archive = await getTwoStemArchive\(\)/);
  assert.match(page, /const providerBlob = await getTwoStemArchive\(\)/);
});

test('v18.8.13 blocks stale-song downloads after async export completion', () => {
  assert.match(page, /(?:song\.id|songExportKey\(song\)) !== expectedSongId/);
  assert.match(page, /No stale file was downloaded/);
});

test('v18.8.13 does not append non-standard artwork to provider WAV backing tracks', () => {
  assert.match(page, /MP3 metadata\/artwork is broadly supported/);
  assert.match(page, /: sourceBlob;/);
});

test('package remains at or beyond v18.8.13', () => assert.match(pkg.version, /^0\.18\.8\.(?:1[3-9]|[2-9]\d+)$/));
