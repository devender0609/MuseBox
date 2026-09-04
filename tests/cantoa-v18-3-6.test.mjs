import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const webhook = await readFile(new URL('../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8');

test('v18.3.6 membership cards explain generous no-charge outputs without inflating paid audio allowance', () => {
  assert.match(page, /pricing\.creator\.minutes/);
  assert.match(page, /pricing\.studio\.minutes/);
  assert.match(page, /Unlimited reasonable-use Reels, square videos, lyric videos, gift pages and re-exports from finished songs/);
  assert.match(page, /Failed provider generations are restored automatically/);
  assert.match(webhook, /plan === "Studio" \? 120 : plan === "Creator" \? 40 : 2/);
});

test('v18.3.6 forces readable dark membership card surfaces and text', () => {
  assert.match(css, /\.theme-dark \.membership-grid article\{/);
  assert.match(css, /color:#f7f2fa!important/);
  assert.match(css, /\.theme-dark \.membership-grid strong,/);
  assert.match(css, /\.theme-dark \.membership-grid \.recommended button/);
});
