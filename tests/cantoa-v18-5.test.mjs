import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const providers = fs.readFileSync(new URL("../lib/music-providers.ts", import.meta.url), "utf8");
const music = fs.readFileSync(new URL("../app/api/music/route.ts", import.meta.url), "utf8");
const soundtrack = fs.readFileSync(new URL("../app/api/soundtrack/route.ts", import.meta.url), "utf8");
const analytics = fs.readFileSync(new URL("../app/api/owner/analytics/route.ts", import.meta.url), "utf8");
const routing = fs.readFileSync(new URL("../app/api/owner/routing-test/route.ts", import.meta.url), "utf8");
const ownerPage = fs.readFileSync(new URL("../app/owner/page.tsx", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const sql = fs.readFileSync(new URL("../supabase-setup.sql", import.meta.url), "utf8");
const costs = fs.readFileSync(new URL("../lib/provider-costs.ts", import.meta.url), "utf8");
const observability = fs.readFileSync(new URL("../lib/provider-observability.ts", import.meta.url), "utf8");

test("v18.5 adds owner-only analytics surface", () => {
  assert.match(page, /accountInfo\?\.isOwner/);
  assert.match(page, /href="\/owner"/);
  assert.match(analytics, /ownerUser\(request\)/);
  assert.match(routing, /ownerUser\(request\)/);
  assert.match(ownerPage, /Owner Console/);
});

test("v18.5 analytics storage is server-only and does not expose lyrics", () => {
  assert.match(sql, /create table if not exists public\.generation_events/);
  assert.match(sql, /alter table public\.generation_events enable row level security/);
  assert.match(observability, /request_summary: compactRequestSummary/);
  assert.match(observability, /slice\(0, 160\)/);
  assert.doesNotMatch(observability, /lyrics:/);
});

test("v18.5 records provider, fallback, cost and refund observability", () => {
  assert.match(music, /fallbackUsed: Boolean\(result\.fallbackUsed\)/);
  assert.match(music, /status: "success"/);
  assert.match(music, /status: "refunded"/);
  assert.match(music, /refundMinutes/);
  assert.match(soundtrack, /status:"success"/);
  assert.match(soundtrack, /status:"refunded"/);
});

test("v18.5 calibrated cost policy does not invent unknown Mureka song cost", () => {
  assert.match(costs, /0\.15/);
  assert.match(costs, /0\.26/);
  assert.match(costs, /requestType === "video_soundtrack"/);
  assert.match(costs, /amount: 0\.10/);
  assert.match(costs, /amount: null, basis: "Mureka song-generation cost not yet calibrated/);
});

test("v18.5 routing test is dry and does not call generation providers", () => {
  assert.match(routing, /charged: false/);
  assert.match(routing, /preferredProvider\(sample\)/);
  assert.doesNotMatch(routing, /generateWithRouter|generateElevenLabs|generateStability|generateMureka|fetch\("https:\/\/api\./);
});

test("v18.5 preserves core cost guardrails", () => {
  assert.match(soundtrack, /n:1/);
  assert.match(providers, /request\.instrumental && request\.intent === "background" && available\.stability/);
  assert.match(providers, /if \(available\.elevenlabs\) return "elevenlabs"/);
  assert.match(providers, /attemptedProviders/);
  assert.match(providers, /fallbackUsed: result\.provider !== first/);
});
