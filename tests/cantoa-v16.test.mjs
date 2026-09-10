import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("v16 provides Google sign-in and visible account controls", async () => {
  const account = await read("components/cantoa-account.tsx");
  const page = await read("app/page.tsx");
  assert.match(account, /signInWithOAuth/);
  assert.match(account, /provider: "google"/);
  assert.match(account, /Continue with Google/);
  assert.match(account, /Sign out/);
  assert.match(page, /className="top-profile"/);
  assert.match(page, /minutesRemaining/);
});

test("v16 protects owner access on the server", async () => {
  const owner = await read("lib/owner.ts");
  const usage = await read("lib/usage.ts");
  const accountRoute = await read("app/api/account/route.ts");
  assert.match(owner, /devender0309@gmail\.com/);
  assert.match(usage, /isCantoaOwner\(user\.email\)/);
  assert.match(accountRoute, /plan:\s*"Owner"/);
  assert.match(accountRoute, /minutesRemaining:\s*null/);
});

test("v16 gives Explore two minutes and warns before previews", async () => {
  const page = await read("app/page.tsx");
  const sql = await read("supabase-setup.sql");
  assert.match(page, /2 free music creations/);
  assert.match(page, /window\.confirm/);
  assert.match(page, /Preview canceled/);
  assert.match(sql, /default 2/);
});

test("v16 publishes only the generic support address", async () => {
  const account = await read("components/cantoa-account.tsx");
  const page = await read("app/page.tsx");
  assert.match(account, /support@cantoamusic\.com/);
  assert.doesNotMatch(account, /devender0309@gmail\.com/);
  assert.doesNotMatch(page, /devender0309@gmail\.com/);
});
