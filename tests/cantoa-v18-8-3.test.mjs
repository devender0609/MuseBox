import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');

test('v18.8.3 resets per-song Moment/export state when opening or generating another song', () => {
  assert.match(page, /const resetPerSongTools = \(\) =>/);
  for (const token of ['setBestClipOffset(null)', 'setGroupCollectUrl("")', 'setSecretDropAt("")', 'setEmotionLock(false)', 'setPublicShareUrl("")', 'setSocialVideoRendering(false)', 'setSocialVideoUrl("")', 'setMemoryMovieUrl("")']) {
    assert.ok(page.includes(token), token);
  }
  assert.match(page, /const openSaved = async[\s\S]{0,180}resetPerSongTools\(\)/);
});

test('v18.8.3 derives Song DNA and result actions from the saved song, not stale composer state', () => {
  assert.match(page, /function songDNAFrom\(song: Song\)/);
  assert.match(page, /const currentSongDNA = useMemo\(\(\) => song \? songDNAFrom\(song\)/);
  assert.match(page, /if \(song\) \{[\s\S]{0,500}momentId: inferMomentIdFromBrief\(song\.prompt\)[\s\S]{0,500}mode: song\.mode/);
  assert.match(page, /const resultIntentPlan = useMemo\(\(\) => song \? inferIntentPlan\(song\.prompt/);
});

test('v18.8.3 social exports are retryable and protected from a stuck recorder finalization', () => {
  assert.match(page, /Best Moment AI · create again/);
  assert.match(page, /You can run it again anytime/);
  assert.match(page, /Video finalization timed out\. Please try again\./);
  assert.match(page, /finally\{setSocialVideoRendering\(false\);setAction\(""\)\}/);
  assert.match(page, /Creating share format 1 of 3/);
});
