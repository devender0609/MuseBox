import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("v18.3.3 recognizes natural video soundtrack phrasing", () => {
  assert.match(page, /music that follows/);
  assert.match(page, /video\|clip\|reel\|footage/);
  assert.match(page, /fetch\("\/api\/soundtrack"/);
});
