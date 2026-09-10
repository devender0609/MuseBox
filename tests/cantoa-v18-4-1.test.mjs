import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("v18.4.1 uses concise language guidance in Create", () => {
  assert.match(page, /Choose any language, dialect or mix—from English and Hindi to Hinglish, Spanish, Arabic, Mandarin and many more/);
  assert.doesNotMatch(page, /Choose a preset or type any language, dialect or mix—including regional variants/);
});

test("v18.4.1 keeps title style and user lyrics in Create", () => {
  assert.match(page, /Song title <i>optional<\/i>/);
  assert.match(page, /Style <i>optional<\/i>/);
  assert.match(page, /Use my lyrics/);
});

test("v18.4.1 keeps title style language and lyrics in Advanced without duplicate helper sprawl", () => {
  assert.match(page, /Song title <em>optional<\/em>/);
  assert.match(page, /Style <em>optional<\/em>/);
  assert.match(page, /Song language/);
  assert.match(page, /Your lyrics <em>optional<\/em>/);
  assert.match(page, /Any language, dialect or mix\. Type yours if it isn’t listed\./);
});

test("v18.4.1 makes Blueprint and multilingual controls progressive disclosure", () => {
  assert.match(page, /<details className="song-blueprint blueprint-details">/);
  assert.match(page, /<details className="advanced-language-panel">/);
  assert.match(page, /Multilingual & pronunciation controls/);
  assert.match(page, /Browse language presets · 60\+ options/);
});

test("v18.4.1 clarifies style strength and output labels", () => {
  assert.match(page, /How strongly should Cantoa follow this style\?/);
  assert.match(page, /<label>Output<\/label>/);
});

test("v18.4.1 makes quick A-B preview wording lighter", () => {
  assert.match(page, /Not sure\? Preview two directions/);
  assert.match(page, /Optional · compare two directions/);
});

test("v18.4.1 includes theme-aware hierarchy styling", () => {
  assert.match(css, /\.blueprint-details,/);
  assert.match(css, /\.advanced-language-panel/);
  assert.match(css, /\.theme-dark \.blueprint-details/);
  assert.match(css, /\.provider-language-note/);
});
