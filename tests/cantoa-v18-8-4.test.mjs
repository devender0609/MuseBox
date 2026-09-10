import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const accountUi = await readFile(new URL('../components/cantoa-account.tsx', import.meta.url), 'utf8');
const accountApi = await readFile(new URL('../app/api/account/route.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.4 account creation asks for identity and password confirmation', () => {
  assert.match(pkg.version, /^0\.18\.8\./);
  assert.match(accountUi, /Your name/);
  assert.match(accountUi, /Confirm password/);
  assert.match(accountUi, /password !== confirmPassword/);
  assert.match(accountUi, /full_name: signupName\.trim\(\)/);
});

test('v18.8.4 signup has explicit email confirmation and resend recovery', () => {
  assert.match(accountUi, /emailRedirectTo: window\.location\.origin/);
  assert.match(accountUi, /Account created\. We sent a confirmation link/);
  assert.match(accountUi, /auth\.resend\(\{/);
  assert.match(accountUi, /Resend confirmation email/);
  assert.match(accountUi, /An account already exists for this email\. Choose Sign in instead\./);
});

test('v18.8.4 authenticated users self-heal a missing membership row', () => {
  assert.match(accountApi, /signed in but no Cantoa account/);
  assert.match(accountApi, /\.from\("memberships"\)\.upsert/);
  assert.match(accountApi, /onConflict: "user_id", ignoreDuplicates: true/);
  assert.match(accountApi, /free_songs_remaining: 2/);
});

test('v18.8.4 keeps primary app surfaces and Cantoa Moments actions wired', () => {
  for (const label of ['Create', 'Library', 'Advanced', 'Song DNA', 'Living Song', 'Time Machine', 'Best Moment AI', 'Memory Capsule', 'Song Reply', 'Group Song', 'Daily Soundtrack', 'Secret Song Drop']) {
    assert.ok(page.includes(label), `missing ${label}`);
  }
  assert.match(page, /onClick=\{\(\) => prepareDerivedMoment\("dna"\)\}/);
  assert.match(page, /onClick=\{\(\) => prepareDerivedMoment\("next"\)\}/);
  assert.match(page, /onClick=\{\(\) => prepareDerivedMoment\("time"\)\}/);
  assert.match(page, /onClick=\{\(\) => void createGroupCollection\(\)\}/);
  assert.match(page, /onClick=\{\(\) => void scheduleSecretDrop\(\)\}/);
});
