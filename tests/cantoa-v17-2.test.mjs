import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
test("moments guide creation without an exposed guided mode",()=>{
  assert.match(page,/setCreateMode\("quick"\)/);
  assert.match(page,/selected\. Cantoa has prepared the song direction for you/);
  assert.doesNotMatch(page,/Guided Create|EASIEST|Tell Cantoa the human part/);
});
test("composer exposes only Create and Advanced",()=>{
  assert.match(page,/simple-create-tabs/);
  assert.match(css,/simple-create-tabs\{grid-template-columns:1fr 1fr!important/);
  assert.match(page,/>Create<\/button>/);
  assert.match(page,/>Advanced<\/button>/);
});
