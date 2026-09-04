import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('v17.7 adds reusable My Sound without adding navigation', () => {
  assert.match(page, /cantoa-my-sound/);
  assert.match(page, /Save My Sound/);
  assert.match(page, /Use My Sound/);
  assert.match(page, /My Sound applied to this song/);
  assert.match(css, /\.style-profile-actions/);
});

test('v17.7 adds natural-language make-it-better revisions with strength control', () => {
  assert.match(page, /RevisionStrength/);
  assert.match(page, /Change strength/);
  assert.match(page, /Tell Cantoa what to change/);
  assert.match(page, /Make this better/);
  assert.match(page, /Your original stays safe/);
  assert.match(css, /\.revision-custom/);
});

test('v17.7 can blend the best of both paid direction previews', () => {
  assert.match(page, /blendDirections/);
  assert.match(page, /Blend the best of both/);
  assert.match(page, /combine the faithful direction's clarity with the bold direction's strongest creative idea/);
  assert.match(css, /\.blend-directions/);
});

test('v17.7 preserves the established layout structure', () => {
  assert.match(page, /className="moment-launcher"/);
  assert.match(page, /className="composer-tabs v17-tabs simple-create-tabs"/);
  assert.match(page, /className="song-blueprint blueprint-details"/);
  assert.match(page, /className="result-workflow"/);
  assert.doesNotMatch(page, /My Sound<\/button>\s*<\/nav>/);
});
