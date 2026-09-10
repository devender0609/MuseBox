import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("app/api/owner/analytics/route.ts", "utf8");
const page = fs.readFileSync("app/owner/page.tsx", "utf8");

test("paid contribution is labeled as before unknown costs", () => {
  assert.match(page, /Paid contribution before unknown costs/);
  assert.match(page, /known-cost margin ceiling/);
  assert.doesNotMatch(page, /Known USD paid gross contribution/);
});

test("paid unpriced generations are counted separately", () => {
  assert.match(route, /paidUsdUnknownCostGenerations/);
  assert.match(page, /paidUsdUnknownCostGenerations/);
});

test("spend to MRR alert uses actual percentage and explains traffic mix", () => {
  assert.match(route, /Known provider spend is \$\{Math\.round\(knownSpendToUsdMrrRate \* 100\)\}%/);
  assert.match(route, /includes Explore and Owner\/Test traffic/);
});

test("30-day known spend to USD MRR metric is exposed", () => {
  assert.match(route, /knownSpendToUsdMrrRate/);
  assert.match(page, /Known spend \/ USD MRR/);
});
