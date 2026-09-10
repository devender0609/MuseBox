import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const route = fs.readFileSync(new URL('../app/api/music/stems/route.ts', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.8.17 MP3 and local download helpers dismiss stale membership UI', () => {
  assert.match(page, /const download = \(\) => \{[\s\S]*setAccountOpen\(false\);[\s\S]*setMembershipOpen\(false\);/);
  assert.match(page, /const downloadBlob = \(blob: Blob, filename: string\) => \{[\s\S]*setAccountOpen\(false\);[\s\S]*setMembershipOpen\(false\);/);
});

test('v18.8.17 stem-powered exports authorize against server feature access', () => {
  const hits = page.match(/await authorizeFeature\("stems"\)/g) || [];
  assert.equal(hits.length, 3);
  assert.doesNotMatch(page.slice(page.indexOf('const exportStems'), page.indexOf('const reviseSong')), /requirePremiumTool\(/);
});

test('v18.8.17 stem input sniffs real container and normalizes MIME', () => {
  assert.match(page, /const isWav = ascii\.startsWith\("RIFF"\)/);
  assert.match(page, /const isMp3 = ascii\.startsWith\("ID3"\)/);
  assert.match(page, /sourceType = sourceExt === "wav" \? "audio\/wav"/);
});

test('v18.8.17 stem provider retries transient failures and returns actionable errors', () => {
  assert.match(route, /\[429, 500, 502, 503, 504\]\.includes\(response\.status\)/);
  assert.match(route, /setTimeout\(resolve, 1500\)/);
  assert.match(route, /rejected the stem-separation API key/);
  assert.match(route, /could not read this audio file/);
});

test('v18.8.17 package version', () => assert.equal(pkg.version, '0.18.8.17'));

test('v18.8.17 membership modal marks the actual current plan instead of hard-coding Explore', () => {
  assert.match(page, /disabled=\{accountInfo\?\.plan === "Explore"\}/);
  assert.match(page, /disabled=\{accountInfo\?\.plan === "Creator"\}/);
  assert.match(page, /disabled=\{accountInfo\?\.plan === "Studio"\}/);
});
