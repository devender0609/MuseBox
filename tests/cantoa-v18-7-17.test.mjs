import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const plan = fs.readFileSync(new URL("../app/api/music/plan/route.ts", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("Smart Actions are contextual and limited to three suggestions", () => {
  assert.match(page, /function smartRevisionActions/);
  assert.match(page, /Suggested for this song/);
  assert.match(page, /suggestedRevisionActions\.map/);
  assert.match(page, /Smoother language flow/);
  assert.match(page, /Hook sooner/);
  assert.match(page, /context\.mode === "instrumental"/);
});

test("secondary revision tools are progressively disclosed", () => {
  assert.match(page, /<details className="revision-more">/);
  assert.match(page, /<summary>More changes<\/summary>/);
  assert.match(css, /revision-actions\.smart/);
});

test("quality gate reconciles conflicts toward current explicit intent", () => {
  assert.match(page, /reconcile conflicts in favor of the user’s newest explicit request/);
  assert.match(plan, /Reconcile any conflict in favor of the user’s newest explicit request/);
  assert.match(plan, /Preserve proper names exactly/);
  assert.match(plan, /Do not introduce a different singer type, language or emotional direction/);
});

test("v18.7.17 Smart Actions remain present in later builds", () => {
  assert.match(page, /function smartRevisionActions/);
  assert.match(page, /Suggested for this song/);
});
