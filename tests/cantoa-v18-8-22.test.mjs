import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("saved people and moments are account/local persisted", () => {
  assert.match(page, /cantoa-people-moments:/);
  assert.match(page, /cantoa_people/);
  assert.match(page, /cantoa_moments/);
  assert.match(page, /auth\.updateUser/);
});
test("saved context is opt-in rather than silently injected", () => {
  assert.match(page, /Cantoa adds a saved detail to a song only when you choose Use/);
  assert.match(page, /usePersonMemory/);
  assert.match(page, /useMomentMemory/);
});
test("prompt can suggest matching saved people and moments", () => {
  assert.match(page, /suggestedPeople/);
  assert.match(page, /suggestedMoments/);
  assert.match(page, /Saved details match this idea/);
});
test("users can save and delete both memory types", () => {
  assert.match(page, /savePersonMemory/);
  assert.match(page, /saveMomentMemory/);
  assert.match(page, /deletePersonMemory/);
  assert.match(page, /deleteMomentMemory/);
});
test("memory editing is free and private by default", () => {
  assert.match(page, /Private by default/);
  assert.match(page, /uses no generation minutes/);
});
test("people and moments UI has responsive styling", () => {
  assert.match(css, /people-moments-panel/);
  assert.match(css, /theme-dark \.people-moments-panel/);
  assert.match(css, /@media\(max-width:720px\).*people-moments-form/s);
});
