import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');

test('v18.8.46 website source can create without a separate typed prompt and URL paste becomes a song brief', async () => {
  const page = await read('app/page.tsx');
  assert.match(page, /const hasSourceInput = Boolean/);
  assert.match(page, /sourceKind === "link" && sourceUrl\.trim\(\)/);
  assert.match(page, /Create an original song inspired by this webpage/);
  assert.match(page, /if \(prompt\.trim\(\)\.length < 8 && !hasSourceInput\)/);
});

test('v18.8.46 server duration ceiling matches the 5-minute product limit', async () => {
  for (const file of ['app/api/music/route.ts','app/api/music/plan/route.ts','app/api/music/remix/route.ts','app/api/library/route.ts']) {
    const src = await read(file);
    assert.match(src, /Math\.min\(300,/);
    assert.doesNotMatch(src, /Math\.min\(600,/);
  }
});

test('v18.8.46 validates media types and sizes for source-backed generation', async () => {
  const remix = await read('app/api/music/remix/route.ts');
  const soundtrack = await read('app/api/soundtrack/route.ts');
  assert.match(remix, /file\.type\.startsWith\("audio\/"\)/);
  assert.match(remix, /50\*1024\*1024/);
  assert.match(soundtrack, /const isImage=file\.type\.startsWith\("image\/"\)/);
  assert.match(soundtrack, /Soundtrack scoring accepts an image or video file/);
});

test('v18.8.46 webpage redirects remain HTTPS and SSRF-checked', async () => {
  const source = await read('app/api/source/route.ts');
  assert.match(source, /async function fetchPublicPage/);
  assert.match(source, /await assertPublicHost\(current\.hostname\)/);
  assert.match(source, /redirect: "manual"/);
  assert.match(source, /next\.protocol !== "https:"/);
  assert.match(source, /TOO_MANY_REDIRECTS/);
});

test('v18.8.46 cloud delete does not report success after storage deletion failure', async () => {
  const route = await read('app/api/library/[id]/route.ts');
  assert.match(route, /const \{ error: storageError \} = await admin\.storage/);
  assert.match(route, /Nothing was deleted; please try again/);
});

test('v18.8.46 customer-facing docs use current 2-free-song and 40\/120-minute plans', async () => {
  const readme = await read('README.md');
  assert.match(readme, /Creator: 40 minutes\/month/);
  assert.match(readme, /Studio: 120 minutes\/month/);
  assert.doesNotMatch(readme, /Creator: 50 minutes\/month/);
  assert.doesNotMatch(readme, /Studio: 150 minutes\/month/);
});

test('v18.8.46 package version', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.version, '0.18.8.46');
});

test('v18.8.46 preserves native audio type for downloads, revisions, sharing and cloud metadata', async () => {
  const page = await read('app/page.tsx');
  const library = await read('app/api/library/route.ts');
  assert.match(page, /function audioFileInfo\(blob: Blob\)/);
  assert.match(page, /audioInfo\.extension/);
  assert.match(page, /type: audioInfo\.type/);
  assert.match(library, /contentType = file\.type === "audio\/wav"/);
});

test('v18.8.46 enforces Group Song owner tools on Creator or Studio server-side', async () => {
  const collect = await read('app/api/library/[id]/collect/route.ts');
  assert.match(collect, /groupSongAllowed/);
  assert.match(collect, /data\.plan === "Creator" \|\| data\.plan === "Studio"/);
  assert.match(collect, /Group Song requires Creator or Studio/);
});

test('v18.8.46 blocks IPv4-mapped private IPv6 webpage targets', async () => {
  const source = await read('app/api/source/route.ts');
  assert.match(source, /ip\.startsWith\("::ffff:"\).*privateIp\(ip\.slice\(7\)\)/s);
});

test('v18.8.46 improves tiny customer-facing controls and uses unlisted Group Song wording', async () => {
  const css = await read('app/globals.css');
  const page = await read('app/page.tsx');
  const contribute = await read('app/contribute/[token]/contribution-client.tsx');
  assert.match(css, /v18\.8\.46 readability pass/);
  assert.match(css, /my-voice-purpose button[\s\S]*font-size:10\.5px!important/);
  assert.match(page, /Copy unlisted link/);
  assert.match(contribute, /Anyone with this unlisted link/);
});

test('v18.8.46 primary source switching clears hidden conflicting source state', async () => {
  const page = await read('app/page.tsx');
  assert.match(page, /One primary source at a time/);
  assert.match(page, /setSourceFile\(null\);[\s\S]*setSourceMode\(false\);[\s\S]*setSourceText\(""\);[\s\S]*setMemoryPhotos\(\[\]\)/);
  assert.match(page, /Audio selected as the primary source\. Other selected media were ignored/);
  assert.match(page, /Video selected as the primary source\. Add photos later for a Memory Movie/);
});
