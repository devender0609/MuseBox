import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');

test('v18.8.47 package version', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.version, '0.18.8.47');
});

test('v18.8.47 cloud storage keeps the native supported audio extension', async () => {
  const route = await read('app/api/library/route.ts');
  assert.match(route, /const audioExtension = audioType === "audio\/wav"/);
  assert.match(route, /audioType === "audio\/mp4" \|\| audioType === "audio\/x-m4a"/);
  assert.match(route, /const storageKey = `\$\{user\.id\}\/\$\{id\}\.\$\{audioExtension\}`/);
  assert.doesNotMatch(route, /const storageKey = `\$\{user\.id\}\/\$\{id\}\.mp3`/);
});

test('v18.8.47 lyric sidecars work with mp3 wav and m4a storage keys', async () => {
  for (const file of ['app/api/library/route.ts','app/api/library/[id]/route.ts','app/share/[token]/page.tsx']) {
    const src = await read(file);
    assert.match(src, /replace\(\/\\\.\[a-z0-9\]\+\$\/i, "-lyrics\.txt"\)/);
  }
});

test('v18.8.47 locks creation controls while generating or previewing', async () => {
  const page = await read('app/page.tsx');
  assert.match(page, /<fieldset className="create-view" disabled=\{generating \|\| previewing\}/);
  assert.match(page, /className=\{view === "library" \? "active" : ""\}[\s\S]{0,120}disabled=\{generating \|\| previewing\}/);
  assert.match(page, /<button onClick=\{newSong\} disabled=\{generating \|\| previewing\}>/);
});

test('v18.8.47 Group Song calls the share surface unlisted rather than private', async () => {
  const page = await read('app/page.tsx');
  assert.match(page, /unlisted Cantoa link/);
  assert.match(page, /Unlisted Group Song page ready and link copied/);
  assert.match(page, /Invite people with an unlisted link/);
  assert.doesNotMatch(page, /private Cantoa link/);
  assert.doesNotMatch(page, /Private Group Song page ready/);
  assert.doesNotMatch(page, /Start a private collection page/);
});

test('v18.8.47 throttles public Group Song contributions', async () => {
  const route = await read('app/api/contribute/[token]/route.ts');
  assert.match(route, /checkRateLimit/);
  assert.match(route, /group-contribution:/);
  assert.match(route, /status: 429/);
  assert.match(route, /Retry-After/);
});

test('v18.8.47 uses a server-controlled HttpOnly voter identity and throttles vote changes', async () => {
  const route = await read('app/api/contribute/[token]/vote/route.ts');
  const client = await read('app/contribute/[token]/contribution-client.tsx');
  assert.match(route, /request\.cookies\.get\(cookieName\)/);
  assert.match(route, /crypto\.randomUUID\(\)/);
  assert.match(route, /httpOnly: true/);
  assert.match(route, /group-vote:/);
  assert.doesNotMatch(client, /localStorage\.getItem\(key\)/);
  assert.doesNotMatch(client, /voterToken/);
  assert.match(client, /JSON\.stringify\(\{contributionId:id\}\)/);
});

test('v18.8.47 keeps the 5-minute server duration ceiling', async () => {
  for (const file of ['app/api/music/route.ts','app/api/music/plan/route.ts','app/api/music/remix/route.ts','app/api/library/route.ts']) {
    const src = await read(file);
    assert.match(src, /Math\.min\(300,/);
    assert.doesNotMatch(src, /Math\.min\(600,/);
  }
});

test('v18.8.47 keeps one-primary-source switching cleanup', async () => {
  const page = await read('app/page.tsx');
  assert.match(page, /One primary source at a time/);
  assert.match(page, /setSourceFile\(null\);[\s\S]*setSourceMode\(false\);[\s\S]*setSourceText\(""\);[\s\S]*setMemoryPhotos\(\[\]\)/);
});
