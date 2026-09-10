import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v18.7.15 polishes repeated lyric-hook titles instead of leaking repeated opening words', () => {
  assert.match(source, /function polishLyricTitleCandidate\(value: string\)/);
  assert.match(source, /weakTrailingWords/);
  assert.match(source, /words\[start\].*words\[0\]/s);
  assert.match(source, /return polishLyricTitleCandidate\(clause\)/);
});

test('v18.7.15 output descriptions are compact editorial metadata rather than the whole prompt', () => {
  assert.match(source, /const subject = has\(/);
  assert.match(source, /patriotic hip-hop anthem/);
  assert.match(source, /powerful male vocals/);
  assert.match(source, /punchy drums/);
  assert.match(source, /deep bass/);
  assert.match(source, /slice\(0, 18\)/);
});

test('v18.7.15 remains a narrow metadata-quality release', () => {
  assert.ok(/^0\.18\.(?:7\.(?:1[5-9]|[2-9]\d+)|(?:8|9|[1-9]\d+)\.\d+)$/.test(pkg.version));
});
