import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const page=fs.readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
test("Group Song ready state is an actionable share card",()=>{assert.match(page,/Your Group Song page is ready/);assert.match(page,/Copy private link/);assert.match(page,/Open group page/)});
test("Group Song card explains the three-step flow",()=>{assert.match(page,/Share the link/);assert.match(page,/Collect ideas/);assert.match(page,/Build the song/)});
test("Group Song card exposes live activity counts",()=>{assert.match(page,/groupContributionCount/);assert.match(page,/groupVoteCount/);assert.match(page,/Refresh activity/)});
test("Group Song card has responsive light and dark styles",()=>{assert.match(css,/\.group-share-card\{/);assert.match(css,/\.theme-dark \.group-share-card/);assert.match(css,/@media\(max-width:520px\)/)});
