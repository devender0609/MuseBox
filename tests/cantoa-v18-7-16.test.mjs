import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const plan = fs.readFileSync(new URL("../app/api/music/plan/route.ts", import.meta.url), "utf8");

test("quick create infers common multilingual mixes without adding controls", () => {
  assert.match(page, /function inferNaturalLanguageMix/);
  assert.match(page, /Hindi and English/);
  assert.match(page, /Punjabi and English/);
  assert.match(page, /Arabic and English/);
  assert.match(page, /Natural multilingual handling:/);
});

test("song planning applies an invisible quality gate", () => {
  assert.match(plan, /function qualityPlanningPrompt/);
  assert.match(plan, /never sing these instructions/);
  assert.match(plan, /explicit voice, language, names, supplied lyrics, duration intent and requested mood as hard constraints/);
  assert.match(plan, /avoid accidental partial-word or partial-phrase repetition/);
  assert.match(plan, /code-switch naturally/);
  assert.match(plan, /prompt: qualityPlanningPrompt\(prompt\)/);
});

test("sharing becomes context aware without adding another share control", () => {
  assert.match(page, /function contextualShareText/);
  assert.match(page, /Made for a special moment/);
  assert.match(page, /contextualShareText\(song\.title, momentId, recipient, dedication\)/);
});

test("package preserves the v18.7.16 background-intelligence release or later", () => {
  const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const parts = pkg.version.split(".").map(Number);
  assert.ok(parts[0] > 0 || parts[1] > 18 || (parts[1] === 18 && (parts[2] > 7 || (parts[2] === 7 && parts[3] >= 16))));
});
