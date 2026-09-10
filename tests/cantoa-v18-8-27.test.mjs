import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const page=fs.readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
test("quick voice message works without clone",()=>{assert.match(page,/Quick voice message/);assert.match(page,/createSongWithRecordedVoiceMessage/);assert.match(page,/5–20 seconds is usually enough/)});
test("message textarea is visible in reusable section",()=>{assert.match(page,/Your spoken message/);assert.match(page,/Reusable My Voice/)});
test("moments sections have distinct visual treatments",()=>{assert.match(css,/section:nth-child\(1\)/);assert.match(css,/section:nth-child\(2\)/);assert.match(css,/section:nth-child\(3\)/);assert.match(css,/theme-dark \.moment-lab-grid/)});
