import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("v18.7.8 separates final success from primary-route reliability", () => {
  const api = read("app/api/owner/analytics/route.ts");
  const page = read("app/owner/page.tsx");
  assert.match(api, /primaryCompletionRate/);
  assert.match(api, /fallbackRate/);
  assert.match(api, /p95LatencyMs/);
  assert.match(page, /Final generation success/);
  assert.match(page, /Primary-route completion/);
  assert.match(page, /Known provider spend/);
});

test("v18.7.8 keeps uncalibrated provider cost honest", () => {
  const page = read("app/owner/page.tsx");
  const api = read("app/api/owner/analytics/route.ts");
  assert.match(page, /Unknown/);
  assert.match(api, /unknown provider cost/);
  assert.match(api, /shown as unknown rather than \$0/);
});

test("v18.7.8 records fallback reason without a schema migration", () => {
  const providers = read("lib/music-providers.ts");
  const route = read("app/api/music/route.ts");
  assert.match(providers, /fallbackReason/);
  assert.match(route, /errorCode: result\.fallbackUsed/);
});

test("v18.7.8 improves long-running generation messaging", () => {
  const home = read("app/page.tsx");
  assert.match(home, /Still creating your song/);
  assert.match(home, /taking longer than usual/);
  assert.match(home, /Finalizing your song/);
});

test("v18.7.8 tightens indexing hygiene and canonical host", () => {
  const robots = read("app/robots.ts");
  const share = read("app/share/[token]/page.tsx");
  const checkout = read("app/checkout-success/page.tsx");
  const proxy = read("proxy.ts");
  assert.match(robots, /share\//);
  assert.match(share, /robots: \{ index: false, follow: false \}/);
  assert.match(checkout, /robots: \{ index: false, follow: false \}/);
  assert.match(proxy, /www\.cantoamusic\.com/);
  assert.match(proxy, /cantoamusic\.com/);
  assert.match(proxy, /308/);
});
