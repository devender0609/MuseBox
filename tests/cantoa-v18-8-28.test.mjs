import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const page=fs.readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
test("quick path uses standalone voice message label",()=>{assert.match(page,/Standalone voice message/);assert.doesNotMatch(page,/>Message only<\/button>/)});
test("clone consent is only in reusable section and names reusable profile",()=>{const idx=page.indexOf("Reusable My Voice"); const consent=page.indexOf("private reusable voice profile"); assert.ok(idx>=0 && consent>idx);});
test("quick recording has non-cloning permission guidance",()=>{assert.match(page,/By recording or uploading, you confirm you have permission to use this audio/)});
