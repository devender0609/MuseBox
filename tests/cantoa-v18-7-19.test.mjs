import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const plan = fs.readFileSync(new URL("../app/api/music/plan/route.ts", import.meta.url), "utf8");

test("v18.7.19 blocks internal planning instructions from output metadata", () => {
  assert.match(page, /INTERNAL_METADATA_INSTRUCTION/);
  assert.match(page, /transform \(\?:this\|the\|supplied\) material/);
  assert.match(page, /if \(!compact \|\| INTERNAL_METADATA_INSTRUCTION\.test\(compact\)\)/);
  assert.match(page, /descriptionFrom\(song\.prompt, song\.generatedLyrics\)/);
});

test("Hindi-Spanish is treated as multilingual for Smart Actions and metadata", () => {
  assert.match(page, /hindi\.\*spanish\|spanish\.\*hindi/);
  assert.match(page, /a natural Hindi-Spanish blend/);
  assert.match(page, /A bilingual Hindi-Spanish original/);
  assert.match(page, /"Hindi and Spanish"/);
  assert.match(plan, /hindi.*spanish/);
});

test("v18.7.19 or later is present", () => {
  const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const parts = pkg.version.split(".").map(Number);
  assert.ok(parts[0] === 0 && parts[1] === 18 && (parts[2] > 7 || (parts[2] === 7 && parts[3] >= 19)));
});
