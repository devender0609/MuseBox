import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const page=fs.readFileSync(new URL("../app/page.tsx", import.meta.url),"utf8");
const pkg=JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url),"utf8"));
test("canonical user brief drives downstream logic",()=>{
 assert.match(page,/function canonicalUserBrief/);
 assert.match(page,/prompt: effectiveUserBrief/);
 assert.match(page,/inferPromptVoiceDirection\(effectiveUserBrief\)/);
 assert.match(page,/inferNaturalLanguageMix\(effectiveUserBrief\)/);
});
test("long detailed prompts remain prompts",()=>{
 assert.match(page,/looksLikeCreationInstruction\(pasted\)/);
 assert.match(page,/Detailed song direction detected/);
 assert.match(page,/!looksLikeCreationInstruction\(sourceText\)/);
});
test("saved metadata uses effective brief",()=>{
 assert.match(page,/titleFrom\(effectiveUserBrief, generatedLyrics\)/);
 assert.match(page,/prompt: effectiveUserBrief/);
});
test("package remains v18.7.20 or later",()=>{ const [,major,minor,patch]=pkg.version.split(".").map(Number); assert.ok(major>18 || (major===18 && (minor>7 || (minor===7 && patch>=20)))); });
