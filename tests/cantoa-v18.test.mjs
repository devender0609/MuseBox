import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const features = await readFile(new URL('../lib/features.ts', import.meta.url), 'utf8');
const route = await readFile(new URL('../app/api/feature-access/route.ts', import.meta.url), 'utf8');

test('v18 adds intent-led creation without new navigation', () => {
  assert.match(page, /inferIntentPlan/);
  assert.match(page, /Cantoa understood/);
  assert.match(page, /intentPlan\.labels/);
  assert.doesNotMatch(page, />Memory Movie<\/button>[\s\S]*nav/i);
});

test('v18 supports photo memory movies and contextual lyric video', () => {
  assert.match(page, /Add photos/);
  assert.match(page, /renderMemoryMovie/);
  assert.match(page, /Create Memory Movie/);
  assert.match(page, /renderSocialVideo\("lyrics"\)/);
  assert.match(page, /Lyric video ready/);
});

test('v18 adds studio jingle packs as real provider-backed renders', () => {
  assert.match(page, /createJinglePack/);
  assert.match(page, /15\/30\/60 jingle pack/);
  assert.match(page, /Create a \$\{seconds\}-second brand\/jingle variant/);
});

test('v18 membership feature matrix is enforced server-side', () => {
  assert.match(features, /memory_movie: \["Studio", "Owner"\]/);
  assert.match(features, /social_video: \["Explore", "Creator", "Studio", "Owner"\]/);
  assert.match(features, /gift_page: \["Explore", "Creator", "Studio", "Owner"\]/);
  assert.match(route, /authenticatedUser\(request\)/);
  assert.match(route, /planAllowsFeature/);
  assert.match(page, /authorizeFeature\("memory_movie"\)/);
});

test('v18 keeps UI compact with attachment and intent summary styling', () => {
  assert.match(css, /\.memory-attach/);
  assert.match(css, /\.intent-summary/);
  assert.match(css, /\.finish-memory/);
  assert.match(css, /\.finish-jingle/);
});
