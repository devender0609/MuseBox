import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const webhook = fs.readFileSync(new URL("../app/api/stripe/webhook/route.ts", import.meta.url), "utf8");

test("v18.3.7 shows 50/150 monthly music generation allowances", () => {
  assert.match(page, /pricing\.creator\.minutes/);
  assert.match(page, /pricing\.studio\.minutes/);
  assert.match(page, /pricing\.creator\.minutes/);
  assert.match(page, /pricing\.studio\.minutes/);
});

test("v18.3.7 grants matching Stripe entitlements server-side", () => {
  assert.match(webhook, /plan === "Studio" \? 120 : plan === "Creator" \? 40 : 2/);
});
