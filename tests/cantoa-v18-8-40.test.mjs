import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync('app/page.tsx','utf8');
const css=fs.readFileSync('app/globals.css','utf8');

test('website guidance is scoped to website panel and does not leak into global message',()=>{
  const select=page.match(/const selectSourcePanel = \(panel: SourcePanel\) => \{[\s\S]*?\n  \};/)?.[0]||'';
  assert.doesNotMatch(select,/setMessage\("Paste a public HTTPS webpage/);
  assert.doesNotMatch(select,/setPrompt\("Create an original song inspired by this webpage"\)/);
  assert.match(page,/Website → song/);
  assert.match(page,/Paste one public HTTPS link/);
});

test('source tools are single-select and closing clears their hidden state',()=>{
  assert.match(page,/clearSourcePanelState\(activeSourcePanel\)/);
  assert.match(page,/if \(panel === "photo"\) setVisualScoreFile\(null\)/);
  assert.match(page,/if \(panel === "video"\) setVideoSourceFile\(null\)/);
  assert.match(page,/if \(panel === "website"\) \{ setSourceKind\("idea"\); setSourceUrl\(""\); \}/);
});

test('story helper is one short prompt plus optional vibe chips',()=>{
  assert.match(page,/What happened or what matters\?/);
  assert.match(page,/Optional vibe/);
  assert.match(page,/Make it a song/);
  assert.doesNotMatch(page,/Who or what is it about\?/);
});

test('starter ideas use progressive disclosure instead of six cards by default',()=>{
  assert.match(page,/starterIdeasExpanded/);
  assert.match(page,/STARTER_IDEAS\.slice\(0, 3\)/);
  assert.match(page,/More ideas/);
});

test('new song fully resets source-mode and creative carryover',()=>{
  const block=page.match(/const newSong = \(\) => \{[\s\S]*?\n  \};/)?.[0]||'';
  for (const expected of ['setPrompt("")','setSourceUrl("")','setVisualScoreFile(null)','setVideoSourceFile(null)','setActiveSourcePanel(null)','setTurnAnythingOpen(false)']) assert.ok(block.includes(expected), expected);
});

test('image selected through real-to-music remains visible in composer attachment status',()=>{
  assert.match(page,/visualScoreFile \? `Image attached/);
});

test('normal status copy no longer renders as an error by default',()=>{
  assert.match(page,/"error" : "app-status"/);
  assert.match(css,/\.app-status/);
});

test('all rendered video exports remain Cantoa branded',()=>{
  assert.match(page,/const showExportBranding = true/);
  assert.match(page,/Made with Cantoa/);
  const gift=fs.readFileSync('app/share/[token]/gift-client.tsx','utf8');
  assert.match(gift,/ctx\.fillText\("Cantoa"/);
});
