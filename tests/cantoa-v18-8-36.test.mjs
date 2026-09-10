import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('starter ideas render inside existing create launcher', () => {
  assert.match(page, /Not sure what to make\?/);
  assert.match(page, /STARTER_IDEAS\.map/);
  assert.match(page, /Use this idea/);
});

test('starter ideas fill core creation controls without generating', () => {
  assert.match(page, /const applyStarterIdea/);
  assert.match(page, /setPrompt\(idea\.prompt\)/);
  assert.match(page, /setStyle\(idea\.style\)/);
  assert.match(page, /setLanguage\(idea\.language\)/);
  assert.match(page, /setDuration\(idea\.duration\)/);
  assert.match(page, /setMode\(idea\.mode\)/);
  assert.doesNotMatch(page.match(/const applyStarterIdea[\s\S]*?\n  };/)?.[0] || '', /generate|createSong\(/i);
});

test('starter idea set covers useful intents', () => {
  for (const text of ['Birthday song','Romantic evening','Motivation boost','Family memory','Reel / video','Hindi–Punjabi mix']) assert.match(page, new RegExp(text.replace(/[–]/g,'[–-]')));
});

test('starter UI is responsive and dark-theme aware', () => {
  assert.match(css, /v18\.8\.36 — one-click starter ideas/);
  assert.match(css, /html\[data-theme="dark"\] \.starter-ideas/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /overflow-x:auto/);
});
