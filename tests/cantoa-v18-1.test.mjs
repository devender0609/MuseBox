import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const page=fs.readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
test("v18.1 video templates use full-screen safe canvases",()=>{
  assert.match(page,/canvas\.width = 1080/);
  assert.match(page,/canvas\.height = format === "square" \? 1080 : 1920/);
  assert.match(page,/showExportBranding/);
  assert.match(page,/Made with Cantoa/);
  assert.match(page,/drawArtwork/);
  assert.match(page,/drawWaveform/);
});
test("v18.1 memory movie uses 1080x1920 dedicated layout",()=>{
  assert.match(page,/canvas\.width=1080;canvas\.height=1920/);
  assert.match(page,/CANTOA MEMORY MOVIE/);
});
test("v18.1 language system remains open ended",()=>{
  assert.match(page,/Browse language presets · 60\+ options/);
  assert.match(page,/Hinglish/);
  assert.match(page,/Tamil → English chorus/);
  assert.match(page,/Arabic → English chorus/);
  assert.match(page,/Any language, dialect or mix/);
});
test("v18.1 contains explicit light-dark action contrast rules",()=>{
  assert.match(css,/Cantoa v18\.1/);
  assert.match(css,/\.theme-dark \.primary-actions/);
  assert.match(css,/\.theme-light \.primary-actions/);
  assert.match(css,/\.theme-dark \.export-panel/);
  assert.match(css,/\.language-details/);
});
