import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("removes My Voice provider-capability warning card", () => {
  assert.ok(!page.includes("Current ElevenLabs Music does not support choosing a cloned voice as the singer"));
  assert.ok(!page.includes("Your voice only."));
});

test("clarifies My Voice flow", () => {
  assert.ok(page.includes("Create your private voice profile, then type a spoken dedication, intro or message"));
  assert.ok(page.includes('placeholder="e.g. My Voice"'));
});

test("keeps spoken message input available after profile creation", () => {
  assert.ok(page.includes("Spoken message"));
  assert.ok(page.includes("Type a short dedication, intro or message"));
});
