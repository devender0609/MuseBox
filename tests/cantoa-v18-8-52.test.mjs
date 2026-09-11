import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('app/page.tsx', 'utf8');
const collect = fs.readFileSync('app/api/library/[id]/collect/route.ts', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

test('release version is v18.8.52', () => {
  assert.equal(pkg.version, '0.18.8.52');
});

test('New song clears prior per-song creative state', () => {
  for (const expected of [
    'setRecipient("")', 'setPersonalDetails("")', 'setDedication("")',
    'setMode("vocals")', 'setDuration(120)', 'setStyle("Auto — follow my prompt")',
    'setLanguage("Auto — follow my prompt")', 'setVoice("Auto — follow my prompt")',
    'setExclude("")', 'setSectionLanguages({ verse: "", chorus: "", bridge: "" })',
    'starterOverridesRef.current.clear()', 'sourceAutoInstrumentalRef.current = false'
  ]) assert.match(page, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('derived and group-song flows clear stale primary media sources', () => {
  const derived = page.slice(page.indexOf('const prepareDerivedMoment'), page.indexOf('const copyGroupContributionRequest'));
  const group = page.slice(page.indexOf('const useCollectedMemories'), page.indexOf('const scheduleSecretDrop'));
  for (const block of [derived, group]) {
    assert.match(block, /setSourceFile\(null\)/);
    assert.match(block, /setVisualScoreFile\(null\)/);
    assert.match(block, /setVideoSourceFile\(null\)/);
    assert.match(block, /setMemoryPhotos\(\[\]\)/);
  }
});

test('audio revision clears stale video/photo state before enabling remix source', () => {
  const block = page.slice(page.indexOf('const reviseSong'), page.indexOf('const polish'));
  assert.ok(block.indexOf('setVideoSourceFile(null)') < block.indexOf('setSourceMode(true)'));
  assert.ok(block.indexOf('setVisualScoreFile(null)') < block.indexOf('setSourceMode(true)'));
});

test('video added from generic media picker uses the soundtrack path', () => {
  const marker = '} else if (video) {';
  const start = page.indexOf(marker, page.indexOf('memory-attach'));
  const block = page.slice(start, start + 1200);
  assert.match(block, /setMode\("instrumental"\)/);
  assert.match(block, /setMomentId\("creator"\)/);
  assert.match(block, /Create music for this video/);
});

test('visual media cannot consume misleading A/B preview minutes', () => {
  assert.match(page, /sourceKind === "audio" \|\| visualScoreFile \|\| videoSourceFile/);
  assert.match(page, /sourceKind !== "audio" && !visualScoreFile && !videoSourceFile/);
});

test('switching away from an auto-instrumental visual source clears only its automatic mode', () => {
  assert.match(page, /const sourceAutoInstrumentalRef = useRef\(false\)/);
  assert.match(page, /const clearAutoSourceMode = \(\) =>/);
  assert.match(page, /sourceAutoInstrumentalRef\.current = true; setMode\("instrumental"\)/);
  assert.match(page, /sourceAutoInstrumentalRef\.current = false; setMode\("vocals"\)/);
});

test('photo picker advertises only the supported formats shown to users', () => {
  assert.match(page, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(page, /accept="image\/jpeg,image\/png,image\/webp,audio\/\*,video\/mp4,video\/webm,video\/quicktime"/);
});

test('Group Song owner view does not silently turn vote query failures into zero votes', () => {
  assert.match(collect, /error: votesError/);
  assert.match(collect, /if \(votesError\) return NextResponse\.json/);
});

test('dead duplicate backing-track and photo-url states are removed', () => {
  assert.doesNotMatch(page, /const \[backingTrackBlob, setBackingTrackBlob\]/);
  assert.doesNotMatch(page, /const \[memoryPhotoUrls, setMemoryPhotoUrls\]/);
  assert.doesNotMatch(page, /const transcribeStoryFile =/);
});

test('hiding Add something clears auto-forced visual instrumental mode', () => {
  assert.match(page, /if \(turnAnythingOpen\) \{ clearSourcePanelState\(activeSourcePanel\); clearAutoSourceMode\(\); \}/);
});

test('soundtrack API accepts only the visual formats advertised by the UI', () => {
  const soundtrack = fs.readFileSync('app/api/soundtrack/route.ts', 'utf8');
  assert.match(soundtrack, /video\/mp4/);
  assert.match(soundtrack, /video\/webm/);
  assert.match(soundtrack, /video\/quicktime/);
  assert.match(soundtrack, /image\/jpeg/);
  assert.match(soundtrack, /image\/png/);
  assert.match(soundtrack, /image\/webp/);
});
