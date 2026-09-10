import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("download flyout click-through guard blocks trusted user events briefly", () => {
  assert.match(page, /downloadClickGuardUntilRef\.current = Date\.now\(\) \+ 1100/);
  assert.match(page, /if \(!event\.isTrusted \|\| Date\.now\(\) >= downloadClickGuardUntilRef\.current\) return/);
  assert.match(page, /document\.addEventListener\('pointerdown', blockDownloadFlyoutClickThrough, true\)/);
  assert.match(page, /document\.addEventListener\('dblclick', blockDownloadFlyoutClickThrough, true\)/);
});

test("account and membership UI triggers respect the download guard", () => {
  assert.match(page, /const openAccountPanel = \(\) => \{[\s\S]*downloadClickGuardUntilRef\.current[\s\S]*setAccountOpen\(true\)/);
  assert.match(page, /const openMembershipPanel = \(\) => \{[\s\S]*downloadClickGuardUntilRef\.current[\s\S]*setMembershipOpen\(true\)/);
  assert.match(page, /className="top-profile"[\s\S]*onClick=\{openAccountPanel\}/);
  assert.match(page, /className="membership-trigger"[\s\S]*onClick=\{openMembershipPanel\}/);
});

test("MP3/blob, text and PCM WAV downloads arm the same guard", () => {
  const count = (page.match(/armDownloadClickGuard\(\)/g) || []).length;
  assert.ok(count >= 7, `expected broad guard coverage, saw ${count}`);
  assert.match(page, /const downloadBlob = \(blob: Blob, filename: string\) => \{\s*armDownloadClickGuard\(\)/);
  assert.match(page, /const wav = pcmWav\(decoded\);\s*armDownloadClickGuard\(\)/);
});
