import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api = fs.readFileSync(new URL('../app/api/owner/analytics/route.ts', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../app/owner/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const checkout = fs.readFileSync(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const pricing = fs.readFileSync(new URL('../app/api/pricing/route.ts', import.meta.url), 'utf8');
const webhook = fs.readFileSync(new URL('../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8');

test('40/120 paid generation allowances remain the actual production values', () => {
  assert.match(checkout, /Creator: \{ usd: 799, inr: 49900, minutes: 40 \}/);
  assert.match(checkout, /Studio: \{ usd: 1999, inr: 129900, minutes: 120 \}/);
  assert.match(pricing, /minutes: 40/);
  assert.match(pricing, /minutes: 120/);
  assert.match(webhook, /Studio" \? 120 : plan === "Creator" \? 40/);
});

test('owner analytics supports 24h, 7d and 30d windows', () => {
  assert.match(api, /\[1, 7, 30\]\.includes/);
  assert.match(page, /\[1,7,30\]\.map/);
});

test('owner and free traffic costs are separated from paid traffic', () => {
  assert.match(api, /Owner\/Test/);
  assert.match(api, /paidTrafficSpend/);
  assert.match(api, /nonPaidTrafficSpend/);
  assert.match(page, /Where provider spend is coming from/);
});

test('owner alerts distinguish current and historical issues', () => {
  assert.match(api, /state: "current" \| "historical" \| "info"/);
  assert.match(page, /Current issue/);
  assert.match(page, /Historical issue/);
});

test('generation log has operational filters', () => {
  assert.match(page, /All plans/);
  assert.match(page, /All providers/);
  assert.match(page, /All statuses/);
  assert.match(page, /filteredEvents/);
});

test('owner console additions have responsive and dark styling', () => {
  assert.match(css, /owner-economics-summary/);
  assert.match(css, /owner-log-filters/);
  assert.match(css, /prefers-color-scheme:dark/);
});
