import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("v18.3.5 exposes bring-your-own lyrics in simple Create", () => {
  assert.match(pkg.version, /^0\.18\.(?:3\.(?:[5-9]|[1-9]\d+)|[4-9]\d*(?:\.\d+)?)$/);
  assert.match(page, /Use my lyrics/);
  assert.match(page, /Paste your lyrics/);
  assert.match(page, /Cantoa will preserve your words/);
});

test("user lyrics bypass automatic lyric planning and remain generation lyrics", () => {
  assert.match(page, /mode === "vocals" && !lyrics\.trim\(\)/);
  assert.match(page, /generatedLyrics = lyrics\.trim\(\);/);
  assert.match(page, /Using your lyrics as provided/);
});

test("quick Create keeps optional title and style", () => {
  assert.match(page, /Song title <i>optional<\/i>/);
  assert.match(page, /Style <i>optional<\/i>/);
});

test("language copy communicates examples plus many more", () => {
  assert.match(page, /and many more/);
  assert.match(page, /Hinglish/);
  assert.match(page, /Mexican Spanish/);
  assert.match(page, /Arabic \+ English/);
});
