import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("devotional songs get a context-aware peaceful Smart Action", () => {
  assert.match(page, /const devotional =/);
  assert.match(page, /label: "More peaceful"/);
  assert.match(page, /more prayerful and spacious/);
});

test("output metadata recognizes devotional songs and uses natural vocal wording", () => {
  assert.match(page, /\? "devotional song"/);
  assert.match(page, /details\.push\("warm male vocals"\)/);
  assert.match(page, /a peaceful, prayerful atmosphere/);
  assert.match(page, /devotionalSubject/);
  assert.match(page, /uniqueDetails.length === 2/);
  assert.match(page, /replace\(\/\\bsang by a male\\b\/gi, "sung by a male vocalist"\)/);
});

test("v18.7.18 remains present in later builds", () => {
  const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const [, major, minor, patch] = pkg.version.split(".").map(Number);
  assert.ok(major > 18 || (major === 18 && (minor > 7 || (minor === 7 && patch >= 18))));
});
