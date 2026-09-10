import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

test("production HTML does not render development-only preview metadata", async () => {
  const html=await readFile(new URL("../.next/server/app/index.html",import.meta.url),"utf8");
  assert.doesNotMatch(html, /name=["']codex-preview["']/i);
});
