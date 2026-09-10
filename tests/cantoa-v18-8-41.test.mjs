import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync('app/page.tsx','utf8');
const css=fs.readFileSync('app/globals.css','utf8');

test('Smart Create starts blank instead of forcing a demo prompt',()=>{
  assert.match(page,/const \[prompt, setPrompt\] = useState\(""\)/);
});

test('starter ideas are first-run help and disappear once user has an idea',()=>{
  assert.match(page,/!prompt\.trim\(\) && \(/);
  assert.match(page,/Try one idea\. You can change everything after\./);
});

test('old static genre-example row is removed to avoid duplicate idea surfaces',()=>{
  assert.doesNotMatch(page,/<div className="examples">/);
});

test('Cantoa understood summarizes current creative brief rather than future export guesses',()=>{
  assert.match(page,/smartCreateChips/);
  assert.match(page,/className="smart-create-summary"/);
  assert.doesNotMatch(page,/Cantoa understood<\/b>\}\{intentPlan\.labels/);
});

test('one-tap directions are playful and edit the brief without generating audio',()=>{
  assert.match(page,/applySmartCreateDirection/);
  assert.match(page,/♥ Heartfelt/);
  assert.match(page,/✦ Cinematic/);
  assert.match(page,/☀ Fun/);
  const block=page.match(/const applySmartCreateDirection[\s\S]*?\n  \};/)?.[0]||'';
  assert.doesNotMatch(block,/generate|fetch\(|minutesRemaining|freeSongsRemaining/);
});

test('real-source tools remain one-at-a-time and website guidance stays scoped',()=>{
  assert.match(page,/clearSourcePanelState\(activeSourcePanel\)/);
  assert.match(page,/activeSourcePanel === "website"/);
  assert.match(page,/Only the selected tool opens\./);
});

test('Smart Create has light/dark responsive styling',()=>{
  assert.match(css,/Smart Create 2\.0/);
  assert.match(css,/\.smart-create-summary/);
  assert.match(css,/data-theme="dark".*smart-create-summary/);
  assert.match(css,/@media\(max-width:680px\).*smart-create-summary/s);
});

test('core entitlement and watermark invariants remain intact',()=>{
  assert.match(page,/const showExportBranding = true/);
  assert.match(page,/selectedPlan === "Studio" \? 120 : 40/);
  assert.match(page,/freeSongsRemaining \?\? 2/);
});
