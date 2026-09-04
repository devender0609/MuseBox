import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v17.9 version and no persistent developer-style gift success copy', () => {
  assert.ok(/^0\.(17\.(?:9|[1-9]\d)|1[89]\.)/.test(pkg.version) || pkg.version === '0.18.0');
  assert.ok(!page.includes('Private-by-default gift page created. The share link has been copied.'));
  assert.ok(page.includes('Gift page ready · link copied'));
  assert.ok(page.includes('cantoa-toast'));
});

test('social video is real, capability-gated, previewed, and downloadable', () => {
  assert.ok(page.includes('new MediaRecorder'));
  assert.ok(page.includes('canvas.captureStream(30)'));
  assert.ok(page.includes('socialVideoSupported'));
  assert.ok(page.includes('<video src={socialVideoUrl} controls playsInline preload="metadata" />'));
  assert.ok(page.includes('Download video'));
  assert.ok(page.includes('Real video + song audio · WebM'));
});

test('finish, download and result actions use polished restrained visual states', () => {
  assert.ok(page.includes('className="finish-pack"'));
  assert.ok(page.includes('className="finish-video"'));
  assert.ok(page.includes('className="finish-gift"'));
  assert.ok(css.includes('.v17-finish-actions .finish-pack'));
  assert.ok(css.includes('.primary-actions>button:nth-child(3)'));
  assert.ok(css.includes('.export-grid button:nth-child(4)'));
});

test('language choices and mixed-language quick blends are expanded without claiming provider support', () => {
  for (const language of ['Marathi','Malayalam','Kannada','Odia','Nepali','Persian (Farsi)','Hebrew','Tagalog / Filipino','Swahili']) assert.ok(page.includes(`"${language}"`));
  assert.ok(page.includes('LANGUAGE_BLEND_PRESETS'));
  assert.ok(page.includes('Hindi → English chorus'));
  assert.ok(page.includes('Final pronunciation and language rendering depend on the selected music provider.'));
});
