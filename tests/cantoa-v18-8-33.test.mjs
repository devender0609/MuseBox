import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api = fs.readFileSync(new URL('../app/api/owner/analytics/route.ts', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../app/owner/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('explore acquisition economics use unique generators', () => {
  assert.match(api, /exploreGeneratorEmails/);
  assert.match(api, /exploreAcquisitionCostPerGenerator/);
  assert.match(page, /Explore acquisition cost \/ generator/);
});

test('observed Explore to paid conversion is explicitly directional', () => {
  assert.match(api, /observedExploreToPaidConversions/);
  assert.match(api, /activePaidEmails/);
  assert.match(page, /Observed Explore → paid/);
  assert.match(page, /directional, not attribution/);
});

test('USD paid contribution calculation avoids mixing INR with USD provider spend', () => {
  assert.match(api, /membershipCurrencyByEmail/);
  assert.match(api, /paidUsdKnownSpend/);
  assert.match(api, /paidContributionBeforeUnknownCosts/);
  assert.match(page, /Paid contribution before unknown costs/);
});

test('unknown provider cost is surfaced as a spend floor not zero', () => {
  assert.match(api, /unknownCostImpact/);
  assert.match(page, /Known provider spend floor/);
  assert.match(page, /excluded from known spend rather than counted as \$0/);
});

test('provider cards show cost per priced success and pricing coverage', () => {
  assert.match(api, /pricedSuccessCoverage/);
  assert.match(api, /knownCostPerSuccess/);
  assert.match(page, /Known cost \/ priced success/);
  assert.match(page, /cost coverage/);
});

test('free tier economics warning is guarded to 30 day view', () => {
  assert.match(api, /periodDays === 30.*exploreKnownSpend/);
  assert.match(api, /Review free-tier economics before expanding free allowances/);
});

test('new decision cards include responsive dark mode styling', () => {
  assert.match(css, /owner-economics-decision/);
  assert.match(css, /owner-unknown-grid/);
  assert.match(css, /prefers-color-scheme:dark/);
});
