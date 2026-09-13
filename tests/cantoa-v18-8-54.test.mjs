import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('release version is v18.8.54', () => {
  assert.equal(pkg.version, '0.18.8.54');
  assert.match(pkg.scripts['test:current'], /cantoa-v18-8-54\.test\.mjs/);
});

test('desktop create surfaces share one studio width', () => {
  assert.match(css, /--cantoa-studio-width:\s*1080px/);
  assert.match(css, /\.moment-launcher,\s*\n\s*\.composer\s*\{[\s\S]*max-width:\s*var\(--cantoa-studio-width\)/);
});

test('phone create surfaces remain full width and respect the existing mobile hardening', () => {
  assert.match(css, /@media \(max-width: 590px\)[\s\S]*\.composer[\s\S]*max-width:\s*100%/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.starter-ideas-grid[\s\S]*grid-template-columns:\s*1fr/);
});

test('library exposes create-from-song without replacing open/delete behavior', () => {
  assert.match(page, /className="library-create-from"/);
  assert.match(page, /openLibraryTransform\(item\)/);
  assert.match(page, /className="icon-delete"/);
  assert.match(page, /onClick=\{\(\) => openSaved\(item\)\}/);
});

test('single-song transform menu covers the promised workflows', () => {
  for (const label of [
    'Another version', 'Change style', 'Keep lyrics · change music',
    'Keep music feel · new lyrics', 'Extend', 'Replace a section',
    'Make instrumental', 'Make vocal version', 'Blend songs'
  ]) assert.ok(page.includes(label), `missing ${label}`);
});

test('transform workflows reuse the existing audio-remix path and preserve originals', () => {
  assert.match(page, /setSourceMode\(true\);\s*\n\s*setSourceKind\("audio"\)/);
  assert.match(page, /original must remain unchanged/i);
  assert.match(page, /Your original stays untouched/i);
  assert.match(page, /fetch\("\/api\/music\/remix"/);
});

test('Blend Songs supports 2 to 4 songs and keeps the selected anchor deterministic', () => {
  assert.match(page, /Choose at least two songs to blend/);
  assert.match(page, /if \(ids\.length >= 4\)/);
  assert.match(page, /blendSongIds\.map\(\(id\) => id === target\.id \? target : library\.find/);
  assert.match(page, /const anchor = selected\[0\]/);
  assert.match(page, /new composition rather than stitching recordings together/i);
});

test('blend uses one audio anchor plus other songs creative context instead of pretending to mix multiple waveforms', () => {
  assert.match(page, /Song \$\{index \+ 1\}:/);
  assert.match(page, /original brief:/);
  assert.match(page, /lyric excerpt:/);
  assert.match(page, /first song supplies the audio anchor/i);
});

test('prepared transforms receive meaningful saved version labels', () => {
  assert.match(page, /preparedVersionLabel/);
  assert.match(page, /versionLabel: parentId \? \(preparedVersionLabel \|\| "Revised version"\) : "Original"/);
  assert.match(page, /setPreparedVersionLabel\("Blend"\)/);
  assert.match(page, /instrumental: "Instrumental version"/);
  assert.match(page, /vocal: "Vocal version"/);
});

test('section replacement requires a specific user direction before continue', () => {
  assert.match(page, /libraryTransformKind === "section" && libraryTransformNote\.trim\(\)\.length < 4/);
});

test('create-from-song UI is responsive rather than desktop-only', () => {
  assert.match(css, /\.library-transform-modal/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.library-transform-grid\s*\{\s*grid-template-columns:\s*1fr 1fr/);
  assert.match(css, /@media \(max-width: 590px\)[\s\S]*\.library-transform-grid\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(css, /\.library-create-from\s*\{[\s\S]*width:\s*100%/);
});
