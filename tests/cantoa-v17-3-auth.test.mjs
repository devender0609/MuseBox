import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
test("v17.3.1 forwards signed-in token to song planner", async () => {
  const page = await readFile(path.join(root, "app/page.tsx"), "utf8");
  const marker = 'const planResponse = await fetch("/api/music/plan"';
  const start = page.indexOf(marker);
  assert.ok(start >= 0);
  const block = page.slice(start, start + 500);
  assert.match(block, /Authorization:\s*`Bearer \${session\.access_token}`/);
});
