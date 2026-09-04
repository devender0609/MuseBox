import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const musicRoute = readFileSync(
  new URL("../app/api/music/route.ts", import.meta.url),
  "utf8",
);
const planRoute = readFileSync(
  new URL("../app/api/music/plan/route.ts", import.meta.url),
  "utf8",
);
const libraryRoute = readFileSync(
  new URL("../app/api/library/route.ts", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("vocal generation preserves the plan lyrics used for the audio", () => {
  assert.match(page, /fetch\("\/api\/music\/plan"/);
  assert.match(page, /generatedLyrics = lyricsFromPlan\(compositionPlan\)/);
  assert.match(page, /song\?\.generatedLyrics\?\.trim\(\)/);
  assert.match(musicRoute, /composition_plan:\s*body\.compositionPlan/);
  assert.match(planRoute, /model_id:\s*"music_v2"/);
});

test("cloud library saves a private lyrics sidecar", () => {
  assert.match(page, /form\.append\("lyrics", saved\.generatedLyrics\)/);
  assert.match(libraryRoute, /-lyrics\.txt/);
  assert.match(libraryRoute, /lyrics_url/);
});

test("WAV export creates a PCM RIFF file instead of renaming MP3", () => {
  assert.match(page, /function pcmWav/);
  assert.match(page, /write\(0, "RIFF"\)/);
  assert.match(page, /type: "audio\/wav"/);
  assert.match(page, /onClick=\{exportWav\}/);
});

test("preview is explicitly optional and explains when to use it", () => {
  assert.match(page, /Optional · compare two directions/);
  assert.match(page, /Skip it when/);
  assert.match(page, /uses 1 minute/);
});

test("jewel-glass controls work in both themes", () => {
  assert.match(css, /v15 — jewel-glass controls/);
  assert.match(css, /backdrop-filter:blur/);
  assert.match(css, /\.theme-dark \.composer-tabs button\.active/);
});
