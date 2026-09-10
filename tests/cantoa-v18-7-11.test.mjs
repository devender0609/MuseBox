import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const transcribe = await readFile(new URL('../app/api/transcribe/route.ts', import.meta.url), 'utf8');
const robots = await readFile(new URL('../app/robots.ts', import.meta.url), 'utf8');
const ownerLayout = await readFile(new URL('../app/owner/layout.tsx', import.meta.url), 'utf8');
const checkout = await readFile(new URL('../app/checkout-success/page.tsx', import.meta.url), 'utf8');
const proxy = await readFile(new URL('../proxy.ts', import.meta.url), 'utf8');

// The microphone route requires an authenticated user. The browser request must carry the same bearer session.
test('v18.7.11 sends auth with speech-to-text requests', () => {
  assert.match(transcribe, /ensureGenerationAccess\(request,0\)/);
  assert.match(page, /fetch\("\/api\/transcribe"[\s\S]{0,220}Authorization: `Bearer \$\{session\.access_token\}`/);
});

test('v18.7.11 keeps noindex pages crawlable enough to observe their noindex directive', () => {
  assert.doesNotMatch(robots, /"\/owner"/);
  assert.doesNotMatch(robots, /"\/checkout-success"/);
  assert.match(robots, /"\/api\/"/);
  assert.match(ownerLayout, /robots: \{ index: false, follow: false/);
  assert.match(checkout, /robots: \{ index: false, follow: false \}/);
});

test('v18.7.11 canonical redirect remains in Next 16 proxy', () => {
  assert.match(proxy, /www\.cantoamusic\.com/);
  assert.match(proxy, /forwardedProto === "http"/);
  assert.match(proxy, /NextResponse\.redirect\(url, 308\)/);
});
