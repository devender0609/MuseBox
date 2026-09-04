import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('v17.6 keeps voice input anchored as a secondary lower-left action', () => {
  assert.match(page, /className={`voice-idea/);
  assert.match(css, /\.idea-box \.voice-idea\{left:16px;bottom:10px/);
});

test('v17.6 gives creative selections the luminous glass state without styling every utility button', () => {
  assert.match(css, /\.composer-tabs button\.active,[\s\S]*\.moment-grid button\.active/);
  assert.match(css, /radial-gradient\(circle at 26% 18%/);
  assert.doesNotMatch(css, /\.primary-actions button\.active/);
});

test('v17.6 makes Surprise Me visibly report its chosen direction', () => {
  assert.match(page, /surpriseDirection/);
  assert.match(page, /Surprise me again/);
  assert.match(page, /aria-live="polite"/);
});

test('v17.6 compacts blueprint and balances the results workflow', () => {
  assert.match(page, /Optional fine-tuning/);
  assert.match(css, /\.blueprint-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(page, /className="result-workflow"/);
  assert.match(css, /\.result-grid\{grid-template-columns:minmax\(300px,410px\)/);
  assert.match(css, /\.result-workflow \.revision-actions\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(page, /<b>Finish & Share<\/b>/);
});
