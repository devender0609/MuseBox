import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("v18.8.5 freezes visible feature set while hiding derived machine context", () => {
  assert.match(pkg.version, /^0\.18\.8\.(?:[5-9]|[1-9][0-9]+)$/);
  assert.match(page, /const \[derivedContext, setDerivedContext\] = useState\(""\)/);
  assert.match(page, /Cantoa is preserving the useful identity in the background/);
  assert.match(page, /Create the next chapter of this song/);
  assert.match(page, /\$\{derivedContext \? `\$\{derivedContext\}\\n\\n` : ""\}\$\{completePrompt\}/);
});

test("v18.8.5 adds lightweight library search and filtering without a new nav mode", () => {
  assert.match(page, /Search your songs…/);
  assert.match(page, /All songs/);
  assert.match(page, /Instrumentals/);
  assert.match(page, /Revised versions/);
  assert.match(page, /filteredLibrary\.map/);
  assert.match(css, /\.library-tools/);
});

test("v18.8.5 clears derived context when starting a normal creation", () => {
  assert.match(page, /setDerivedContext\(""\);\n    setPrompt\(moment\.prompt\)/);
  assert.match(page, /setPublicShareUrl\(""\);\n    setDerivedContext\(""\);/);
});
