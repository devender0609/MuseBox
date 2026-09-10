import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const sql = await readFile(new URL('../supabase-setup.sql', import.meta.url), 'utf8');

test('v18.7.4 removes Source chooser from both Create and Advanced while retaining automatic source detection', () => {
  assert.doesNotMatch(page, /className="source-picker"/);
  assert.doesNotMatch(page, /sourceOpen/);
  assert.match(page, /Webpage detected automatically/);
  assert.match(page, /Long text detected automatically/);
  assert.match(page, /accept="image\/\*,audio\/\*,video\/mp4,video\/webm,video\/quicktime"/);
  assert.match(page, /Audio attached\. Describe the cover, remix or transformation you want/);
});

test('v18.7.4 states that free entitlement is consumed only after successful generation', () => {
  assert.match(page, /Uses 1 free creation only after the music is successfully generated/);
  assert.match(page, /Any 2 Moments · up to 2 minutes each · including Video \/ Reel/);
});

test('v18.7.4 includes one-time Explore entitlement repair based on post-launch saved songs', () => {
  assert.match(sql, /v18\.7\.4_free_creation_signin_repair/);
  assert.match(sql, /to_timestamp\(s\.created_at \/ 1000\.0\) >= launch_at/);
  assert.match(sql, /where m\.plan='Explore' and m\.status='active'/);
});

test('v18.7.4 balances membership summary with all three plans', () => {
  assert.match(page, /plan-cards compact/);
  assert.match(page, /Explore · Free/);
  assert.match(page, /Creator · \{pricing\.creator\.display\}/);
  assert.match(page, /Studio · \{pricing\.studio\.display\}/);
  assert.match(css, /\.plan-cards\.compact/);
});

test('v18.7.4 makes download panel per-song and visually distinctive', () => {
  assert.match(page, /export-song-summary/);
  assert.match(page, /\{song\.title\}/);
  assert.match(css, /\.export-song-art/);
  assert.match(css, /linear-gradient\(145deg,#7a4c8d,#c64f76 55%,#ee955c\)/);
});


test('v18.7.4 reports Explore allowance as free creations rather than generation minutes', () => {
  assert.match(page, /Explore · \${accountInfo\?\.freeSongsRemaining \?\? 2} free creation/);
});
