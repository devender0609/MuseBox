import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('app/page.tsx', 'utf8');
const plan = fs.readFileSync('app/api/music/plan/route.ts', 'utf8');

test('website source is bounded before music planning/generation', () => {
  assert.match(page, /const maxPromptChars = 3800/);
  assert.match(page, /availableForSource/);
  assert.match(page, /sourceExcerpt/);
});

test('planning failure can fall back to direct generation for recoverable plan errors', () => {
  assert.match(page, /\[400, 422, 500, 502, 503\]\.includes\(planResponse\.status\)/);
  assert.match(page, /creating the song directly instead/);
});

test('plan route distinguishes too-short from too-long prompt', () => {
  assert.match(plan, /prompt\.length < 8/);
  assert.match(plan, /prompt\.length > 4000/);
  assert.match(plan, /song brief is too long to pre-plan/i);
});
