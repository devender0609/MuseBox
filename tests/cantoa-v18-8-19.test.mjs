import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const stems = fs.readFileSync(new URL('../app/api/music/stems/route.ts', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('download export panel blocks accidental double-click click-through', () => {
  assert.match(page, /className="export-panel" onDoubleClick=\{\(event\) => \{ event\.preventDefault\(\); event\.stopPropagation\(\); \}\}/);
});

test('premium download checks do not auto-open membership modal', () => {
  assert.match(page, /authorizeFeature\("wav_export", \{ openMembership: false \}\)/);
  assert.ok((page.match(/authorizeFeature\("stems", \{ openMembership: false \}\)/g) || []).length >= 3);
});

test('long export status text is contained inside cards', () => {
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /\.export-grid button > span \{ min-width: 0; width: 100%; overflow: hidden; \}/);
});

test('stem jobs are not subject to hidden monthly quota', () => {
  assert.doesNotMatch(stems, /30 \* 24 \* 3600/);
  assert.match(stems, /60, 60 \* 60/);
});

test('busy stem and PCM actions are disabled during processing', () => {
  assert.match(page, /onClick=\{exportStems\} disabled=\{sixStemStatus === "building"\}/);
  assert.match(page, /onClick=\{exportWav\} title="WAV export" disabled=\{action === "Creating WAV…"\}/);
});

test('package version', () => assert.equal(pkg.version, '0.18.8.19'));
