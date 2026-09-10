import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync(new URL('../app/page.tsx', import.meta.url),'utf8');
const collect=fs.readFileSync(new URL('../app/api/library/[id]/collect/route.ts', import.meta.url),'utf8');
const contribute=fs.readFileSync(new URL('../app/api/contribute/[token]/route.ts', import.meta.url),'utf8');
test('Creator+ gates collaboration and voice tools',()=>{
  assert.match(page,/requirePremiumTool\("Group Song 2\.0"\)/);
  assert.match(page,/requirePremiumTool\("Build from group ideas"\)/);
  assert.match(page,/requirePremiumTool\("My Voice"\)/);
  assert.match(page,/requirePremiumTool\("Saved people & moments"\)/);
});
test('version compare only surfaces for premium',()=>assert.match(page,/hasPremiumTools && versionFamily\.length > 1/));
test('group reads tolerate legacy empty collections',()=>{
  assert.match(collect,/Older Group Song installs may not yet have the 2\.0 columns/);
  assert.match(contribute,/select\("id,contributor,memory,created_at"\)/);
});
test('schema write failures are actionable',()=>assert.match(contribute,/Group Song 2\.0 setup needs the latest database update/));
