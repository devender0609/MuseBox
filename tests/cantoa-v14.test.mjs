import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");

test("technical Project JSON export is removed",()=>{
  assert.doesNotMatch(page,/Project JSON|exportProject|FileJson/);
});

test("every social destination opens separately and downloads the song",()=>{
  for(const destination of ["whatsapp","facebook","x","email","instagram","tiktok","youtube"]){
    assert.match(page,new RegExp(`shareDestination\\(\\"${destination}\\"\\)`));
  }
  assert.match(page,/window\.open\(targets\[destination\]/);
  assert.match(page,/window\.open[\s\S]{0,180}download\(\)/);
});

test("primary navigation, creation tabs and persistent themes remain available",()=>{
  assert.match(page,/<Plus\s*\/>\s*Create/);
  assert.match(page,/<Library\s*\/>\s*Library/);
  assert.match(page,/>Create<\/button>/);
  assert.match(page,/Advanced/);
  assert.match(page,/theme-light|theme-\$\{theme\}/);
  assert.match(css,/\.theme-dark/);
});

test("luminous bubble treatment is decorative and non-blocking",()=>{
  assert.match(css,/\.create-view:before/);
  assert.match(css,/pointer-events:none/);
  assert.match(css,/radial-gradient/);
});
