import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const gift = fs.readFileSync(new URL('../app/share/[token]/gift-client.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('v18.8.37 adds guided story interview without generating automatically', () => {
  assert.match(page, /Tell Cantoa the story/);
  assert.match(page, /buildStoryInterviewBrief/);
  assert.match(page, /Nothing is generated until you press Create complete song/);
});

test('v18.8.37 adds turn-anything source launchers while reusing existing routes', () => {
  assert.match(page, /Turn something real into music/);
  // v18.8.38 streamlines redundant source cards into the existing composer controls.
  assert.match(page, /Website/);
  assert.match(page, /Photo or screenshot/);
  assert.match(page, /Video/);
  assert.match(page, /Speak your idea/);
  assert.match(page, /Add media/);
  assert.match(page, /fetch\("\/api\/transcribe"/);
  assert.match(page, /fetch\("\/api\/soundtrack"/);
  assert.match(page, /fetch\("\/api\/source"/);
});

test('v18.8.37 scores images and videos without changing normal song route', () => {
  assert.match(page, /videoSourceFile \|\| visualScoreFile/);
  assert.match(page, /Score this image/);
  assert.match(page, /Score this video/);
  assert.match(page, /response = await fetch\("\/api\/music"/);
});

test('v18.8.37 keeps screenshot limitation explicit rather than pretending OCR exists', () => {
  assert.match(page, /For a text-message screenshot, paste the text(?: in the main idea box)? for lyric-level understanding/);
});

test('v18.8.37 adds optional local reaction capture to gift page', () => {
  assert.match(gift, /Capture your reaction/);
  assert.match(gift, /getUserMedia\(\{ video: true, audio: true \}\)/);
  assert.match(gift, /30000/);
  assert.match(gift, /stays on this device unless you choose to share it/);
});

test('v18.8.37 adds responsive light-dark-safe styles', () => {
  assert.match(css, /v18\.8\.37/);
  assert.match(css, /cantoa-source-grid/);
  assert.match(css, /story-interview/);
  assert.match(css, /gift-reaction-capture/);
  assert.match(css, /data-theme="dark"/);
  assert.match(css, /@media\(max-width:620px\)/);
});
