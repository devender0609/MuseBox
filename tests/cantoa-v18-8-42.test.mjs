import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.42 keeps inspiration discoverable after a starter choice without a permanent card wall', () => {
  assert.match(page, /Want a different direction\?/);
  assert.match(page, /Try another idea/);
  assert.match(page, /\(!prompt\.trim\(\) \|\| starterIdeasExpanded\)/);
});

test('v18.8.42 makes the one-story prompt polished and readable', () => {
  assert.match(page, /What happened or what matters\?/);
  assert.match(page, /story-question-help/);
  assert.match(css, /\.story-one-box \.story-question\{font-size:15px/);
  assert.match(css, /\.story-one-box textarea\{min-height:112px/);
});

test('v18.8.42 keeps source tools large and one-at-a-time', () => {
  assert.match(css, /\.cantoa-source-grid>button\{min-height:126px/);
  assert.match(page, /activeSourcePanel === "story"/);
  assert.match(page, /activeSourcePanel === "website"/);
  assert.match(page, /activeSourcePanel === "photo"/);
  assert.match(page, /activeSourcePanel === "video"/);
});

test('v18.8.42 reduces More with this song overload through progressive disclosure', () => {
  assert.match(page, /moment-lab-recommended/);
  assert.match(page, />Try next</);
  assert.match(page, /moment-lab-more-tools/);
  assert.match(page, /More tools/);
});

test('v18.8.42 reduces Finish and Share overload but keeps secondary exports reachable', () => {
  assert.match(page, /finish-primary-actions/);
  assert.match(page, /More export & sharing options/);
  assert.match(page, /finish-secondary-actions/);
  assert.match(page, /Square video/);
  assert.match(page, /Lyric video/);
  assert.match(page, /Memory Movie/);
  assert.match(page, /jingle pack/);
});

test('v18.8.42 preserves key commercial and watermark invariants', () => {
  assert.match(page, /selectedPlan === "Studio" \? 120 : 40/);
  assert.match(page, /freeSongsRemaining \?\? 2/);
  assert.match(page, /Cantoa/);
  assert.equal(pkg.version, '0.18.8.42');
});
