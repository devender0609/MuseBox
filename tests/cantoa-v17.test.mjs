import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const shareRoute = readFileSync(new URL("../app/api/library/[id]/share/route.ts", import.meta.url), "utf8");
const sharePage = readFileSync(new URL("../app/share/[token]/page.tsx", import.meta.url), "utf8");
const sql = readFileSync(new URL("../supabase-setup.sql", import.meta.url), "utf8");

test("v17 moments remain while v17.2 simplifies creation to Create and Advanced", () => {
  assert.match(page, /What are you making today\?/);
  assert.doesNotMatch(page, /Guided Create/);
  assert.match(page, />Create<\/button>/);
  assert.match(page, />Advanced<\/button>/);
  for (const label of ["Birthday", "Wedding", "Business", "School", "Anything → music"]) assert.match(page, new RegExp(label));
});

test("v17.2 keeps multilingual creation controls without a separate guided form", () => {
  assert.match(page, /Hindi \+ English/);
  assert.match(page, /Punjabi \+ English/);
  assert.doesNotMatch(page, /Recipient or subject:/);
  assert.doesNotMatch(page, /Language section plan:/);
});

test("v17 has creator pack, creation record and expanded revisions", () => {
  assert.match(page, /exportCreatorPack/);
  assert.match(page, /cover-square\.svg/);
  assert.match(page, /Creation record/);
  for (const action of ["Clearer vocals", "More energy", "More emotional", "Shorter intro"]) assert.match(page, new RegExp(action));
});

test("v17 gift pages are explicit opt-in while audio storage stays private", () => {
  assert.match(shareRoute, /public_share:\s*true/);
  assert.match(shareRoute, /share_token/);
  assert.match(sharePage, /eq\("public_share", true\)/);
  assert.match(sql, /public_share boolean not null default false/);
  assert.match(sql, /private audio bucket remains private/);
});
