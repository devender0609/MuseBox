import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('current UI no longer exposes a redundant Source chooser', () => {
  assert.ok(!page.includes('sourceOpen'));
  assert.ok(!page.includes('className="source-picker"'));
  assert.ok(page.includes('Describe what you want to create'));
});

test('source material is detected contextually instead of through a Change menu', () => {
  assert.ok(page.includes('Webpage detected automatically'));
  assert.ok(page.includes('Long text detected automatically'));
  assert.ok(page.includes('Add media'));
});

test('light mode Moments use light adaptive surfaces', () => {
  assert.ok(css.includes('.theme-light .moment-launcher'));
  assert.ok(css.includes('.theme-light .moment-grid button'));
  assert.ok(css.includes('rgba(255,255,255,.88)'));
});
