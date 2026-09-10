import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.6 keeps Sing & Use inside the existing Download surface', () => {
  assert.match(pkg.version, /^0\.18\.8\.(?:[6-9]|[1-9][0-9]+)$/);
  for (const label of ['Lyrics · Sing Along', 'Karaoke package · Creator', 'Instrumental version · Creator']) {
    assert.ok(page.includes(label), `missing ${label}`);
  }
  assert.match(page, /setExportOpen\(\(v\) => !v\)/);
  assert.doesNotMatch(page, />Karaoke<\/button>[\s\S]{0,50}className="primary-actions"/);
});

test('v18.8.6 karaoke and instrumental reuse stem separation instead of pretending to remove vocals locally', () => {
  assert.match(page, /const requestStemArchive = async/);
  assert.match(page, /fetch\("\/api\/music\/stems"/);
  assert.match(page, /const makeBackingTrack = async/);
  assert.match(page, /vocal\|vocals\|voice/);
  assert.match(page, /requestStemArchive\("two_stems_v1"\)/);
  assert.match(page, /Stem separation quality depends on the source mix and provider output/);
});

test('v18.8.6 sing along is transparent about estimated timing', () => {
  assert.match(page, /Follow-along timing is estimated from song progress; exact word-level timing is not claimed/);
  assert.match(page, /onTimeUpdate=\{\(event\) => setPlaybackTime/);
  assert.match(page, /playbackTime \/ Math\.max\(1, song\.duration\)/);
});

test('v18.8.6+ exposes vocal utilities only when the loaded song is vocal-capable', () => {
  assert.match(page, /const songHasVocals = !!song/);
  assert.match(page, /\{songHasVocals && \(\s*<button onClick=\{\(\) => void exportKaraokePackage/);
  assert.match(page, /\{songHasVocals && \(\s*<button onClick=\{\(\) => void exportInstrumentalVersion/);
});
