import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css=fs.readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
const page=fs.readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");

test("v18.2 explicitly overrides revision controls in light and dark",()=>{
  assert.match(css,/Cantoa v18\.2 — theme parity hardening/);
  assert.match(css,/\.theme-light \.revision-actions button[\s\S]*background:linear-gradient/);
  assert.match(css,/\.theme-dark \.revision-actions button[\s\S]*background:linear-gradient/);
  assert.match(css,/\.theme-light \.revision-studio[\s\S]*--qa-panel/);
});

test("v18.2 covers major result action families in both themes",()=>{
  for(const selector of ['v17-finish-actions button','export-grid button','social-grid button','revision-strength button','revision-request button']){
    assert.ok(css.includes(`.theme-light .${selector}`),`missing light ${selector}`);
    assert.ok(css.includes(`.theme-dark .${selector}`),`missing dark ${selector}`);
  }
});

test("v18.2 keeps modal and input surfaces theme aware",()=>{
  assert.match(css,/\.theme-light \.account-modal/);
  assert.match(css,/\.theme-dark \.account-modal/);
  assert.match(css,/\.theme-light \.revision-request input/);
  assert.match(css,/\.theme-dark \.revision-request input/);
});

test("v18.2 preserves video implementation unchanged",()=>{
  assert.match(page,/renderSocialVideo/);
  assert.match(page,/Create 15-sec Reel/);
  assert.match(page,/Create square video/);
});
