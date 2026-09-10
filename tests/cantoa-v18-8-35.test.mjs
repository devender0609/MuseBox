import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const costs = fs.readFileSync(new URL('../lib/provider-costs.ts', import.meta.url), 'utf8');
const analytics = fs.readFileSync(new URL('../app/api/owner/analytics/route.ts', import.meta.url), 'utf8');

test('Mureka song cost is calibrated from observed billing', () => {
  assert.match(costs, /2\.90 \/ 18/);
  assert.match(costs, /MUREKA_OBSERVED_SONG_COST_USD/);
  assert.doesNotMatch(costs, /Mureka song-generation cost not yet calibrated/);
});

test('future Mureka song events receive a calibrated cost', () => {
  assert.match(costs, /provider === "mureka"/);
  assert.match(costs, /MUREKA_OBSERVED_SONG_COST_BASIS/);
});

test('historical successful unpriced Mureka songs are backfilled in analytics only', () => {
  assert.match(analytics, /in-memory analytics backfill only/);
  assert.match(analytics, /event\.provider === "mureka"/);
  assert.match(analytics, /event\.estimated_cost_usd == null/);
  assert.match(analytics, /event\.request_type !== "video_soundtrack"/);
});

test('owner cost policy exposes Mureka calibration', () => {
  assert.match(analytics, /\$2\.90 \/ 18 generations/);
  assert.match(analytics, /calibrated 2026-09-10/);
});
