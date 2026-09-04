import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root,p),"utf8");
const slugs = ["birthday-song","wedding-song","anniversary-song","song-for-someone","reel-music","business-jingle","hindi-song","hinglish-song"];

test("v18.6 ships eight distinct indexed landing pages", () => {
  for (const slug of slugs) {
    assert.equal(fs.existsSync(path.join(root,"app",slug,"page.tsx")), true, `${slug} missing`);
  }
  const config = read("lib/marketing-pages.ts");
  for (const slug of slugs) assert.match(config, new RegExp(`"${slug}"`));
  assert.match(read("app/sitemap.ts"), /MARKETING_SLUGS/);
  assert.match(read("app/robots.ts"), /sitemap\.xml/);
});

test("landing CTAs deep-link into a Cantoa moment and example prompt", () => {
  const component = read("components/marketing-landing.tsx");
  assert.match(component, /\?moment=/);
  assert.match(component, /&prompt=/);
  const home = read("app/page.tsx");
  assert.match(home, /params\.get\("moment"\)/);
  assert.match(home, /params\.get\("prompt"\)/);
  assert.match(home, /requestedPrompt\?\.trim\(\) \|\| item\.prompt/);
});

test("landing pages use unique metadata and canonical URLs", () => {
  for (const slug of slugs) {
    const source = read(`app/${slug}/page.tsx`);
    assert.match(source, /export const metadata/);
    assert.match(source, /alternates: \{ canonical:/);
    assert.match(source, /openGraph:/);
  }
});

test("marketing pages retain the free-song proposition and language breadth", () => {
  const component = read("components/marketing-landing.tsx");
  assert.match(component, /First complete song free/);
  assert.match(component, /English, Hindi, Hinglish, Spanish, Arabic, Mandarin/);
  assert.match(component, /Pronunciation quality may vary by music provider/);
});
