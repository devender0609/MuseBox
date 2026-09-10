import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const webhook = await readFile(new URL('../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8');

test('v18.3.4 gives paid plans more transparent music-generation allowance', () => {
  assert.match(page, /pricing\.creator\.minutes/);
  assert.match(page, /pricing\.studio\.minutes/);
  assert.match(page, /re-exports from (?:existing|finished) songs/);
  assert.match(webhook, /plan === "Studio" \? 120 : plan === "Creator" \? 40 : 2/);
});

test('v18.3.4 exposes optional title and style in simple Create and full Advanced', () => {
  assert.match(page, /createMode === "quick"[\s\S]*?className="quick-essentials"/);
  assert.match(page, /Song title <i>optional<\/i>/);
  assert.match(page, /Style <i>optional<\/i>/);
  assert.match(page, /Song title <em>optional<\/em>/);
  assert.match(page, /Style <em>optional<\/em>/);
  assert.match(css, /\.quick-essentials/);
});

test('v18.3.4 language guidance advertises breadth without closing the list', () => {
  for (const language of ["English","Hindi","Punjabi","Tamil","Telugu","Bengali","Gujarati","Marathi","Urdu"]) assert.ok(page.includes(`"${language}"`));
  assert.ok(page.includes("Hinglish (Hindi + English)"));
  for (const language of ["Korean","Japanese","Mandarin Chinese"]) assert.ok(page.includes(`"${language}"`));
  assert.match(page, /and many more/);
  assert.match(page, /Any language, dialect or mix/);
});

test('v18.3.4 keeps My Sound available in Advanced', () => {
  assert.match(page, /Save My Sound/);
  assert.match(page, /Use My Sound/);
});
