import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const features = await readFile(new URL('../lib/features.ts', import.meta.url), 'utf8');
const usage = await readFile(new URL('../lib/usage.ts', import.meta.url), 'utf8');

test('current Create keeps the universal description field without a redundant visible Source card', () => {
  assert.doesNotMatch(page, /className="source-picker"/);
  assert.match(page, /Describe what you want to create/);
  assert.doesNotMatch(page, /Describe your song\s*<\/label>/);
});

test('v18.7.3 makes the two-free-creation offer obvious at Moments', () => {
  assert.match(page, /Your first 2 music creations are free/);
  assert.match(page, /including Video \/ Reel/);
  assert.match(page, /Uses 1 free creation only after the music is successfully generated/);
  assert.match(page, /free-moment-banner/);
});

test('v18.7.3 gives each Moment a first-run prompt hint', () => {
  assert.match(page, /Who is the birthday song for\?/);
  assert.match(page, /Add your video, then describe the mood/);
  assert.match(page, /activeMoment\.placeholder/);
});

test('v18.7.3 includes social and lyric video exports for Explore and brands only free exports', () => {
  assert.match(features, /social_video: \["Explore", "Creator", "Studio", "Owner"\]/);
  assert.match(features, /lyric_video: \["Explore", "Creator", "Studio", "Owner"\]/);
  assert.match(page, /const showExportBranding =/);
  assert.match(page, /if\(showExportBranding\).*Made with Cantoa/);
  assert.doesNotMatch(page, /CANTOA · MOMENTS → MUSIC/);
});

test('v18.7.3 keeps free generation abuse controls and two-minute cap server-side', () => {
  assert.match(usage, /FREE_SONGS_USED/);
  assert.match(usage, /free music creations have been used/i);
  assert.match(usage, /free music creation can be up to 2 minutes/i);
});
