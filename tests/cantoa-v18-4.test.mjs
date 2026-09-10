import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const providers = fs.readFileSync(new URL("../lib/music-providers.ts", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const musicRoute = fs.readFileSync(new URL("../app/api/music/route.ts", import.meta.url), "utf8");
const soundtrackRoute = fs.readFileSync(new URL("../app/api/soundtrack/route.ts", import.meta.url), "utf8");
const webhook = fs.readFileSync(new URL("../app/api/stripe/webhook/route.ts", import.meta.url), "utf8");

// Empirical cost-aware provider policy: ordinary instrumentals do not automatically force Stability.
test("v18.4 routes Stability only for background-oriented instrumentals when ElevenLabs is available", () => {
  assert.match(providers, /request\.instrumental && request\.intent === "background" && available\.stability/);
  assert.doesNotMatch(providers, /if \(request\.instrumental && available\.stability\) return "stability";[\s\S]*?if \(available\.elevenlabs\)/);
  const stabilityBackground = providers.indexOf('if (request.instrumental && request.intent === "background" && available.stability) return "stability";');
  const elevenDefault = providers.indexOf('if (available.elevenlabs) return "elevenlabs";');
  const stabilityFallback = providers.indexOf('if (request.instrumental && available.stability) return "stability";');
  assert.ok(stabilityBackground >= 0 && elevenDefault > stabilityBackground && stabilityFallback > elevenDefault);
});

test("v18.4 classifies ambient/cinematic/texture requests as background workload", () => {
  assert.match(page, /background\|ambient\|soundtrack\|score\|cinematic\|atmospher\|sound\\s\*design\|texture\|underscore\|meditat\|sleep\|relaxing/);
});

test("v18.4 preserves safe provider fallbacks and provider response headers", () => {
  assert.match(providers, /\["stability", "elevenlabs", "mureka"\]/);
  assert.match(musicRoute, /"X-Cantoa-Provider": result\.provider/);
  assert.match(soundtrackRoute, /"X-Cantoa-Provider":"mureka"/);
});

test("v18.4 keeps Mureka soundtrack n=1 cost guard", () => {
  assert.match(soundtrackRoute, /n:1/);
});

test("v18.4 keeps 50\/150 Stripe entitlements", () => {
  assert.match(webhook, /plan === "Studio" \? 120 : plan === "Creator" \? 40 : 2/);
});
