import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const providers = fs.readFileSync(new URL("../lib/music-providers.ts", import.meta.url), "utf8");

test("v18.3.8 Stability integration remains available after v18.4 cost-aware routing", () => {
  assert.match(providers, /available\.stability/);
  assert.match(providers, /generateStability/);
});

test("v18.3.8 preserves ElevenLabs as a fallback after Stability", () => {
  assert.match(providers, /first === "stability"[\s\S]*?\["stability", "elevenlabs", "mureka"\]/);
});
