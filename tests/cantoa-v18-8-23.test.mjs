import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/api/my-voice/route.ts", import.meta.url), "utf8");
const preview = readFileSync(new URL("../app/api/my-voice/preview/route.ts", import.meta.url), "utf8");
const features = readFileSync(new URL("../lib/features.ts", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("My Voice is a Creator/Studio feature and stays tucked under More with this song", () => {
  assert.match(features, /my_voice: \["Creator", "Studio", "Owner"\]/);
  assert.match(page, /<b>My Voice<\/b>/);
  assert.match(page, /private self-voice profile for spoken dedications and messages/i);
});

test("My Voice requires explicit self-voice consent", () => {
  assert.match(route, /Confirm that this is your own voice/);
  assert.match(route, /consent/);
  assert.match(page, /I confirm this is <b>my own voice<\/b>/);
});

test("provider integration uses documented ElevenLabs voice endpoints", () => {
  assert.match(route, /\/v1\/voices\/add/);
  assert.match(route, /files\[\]/);
  assert.match(route, /DELETE/);
  assert.match(preview, /\/v1\/text-to-speech\//);
  assert.match(preview, /eleven_multilingual_v2/);
});

test("My Voice does not falsely claim cloned singing support", () => {
  assert.match(page, /does not support choosing a cloned voice as the singer/i);
  assert.match(route, /supportedUse: "spoken_voice"/);
});

test("voice profiles are account scoped and deletable", () => {
  assert.match(route, /cantoa_my_voices/);
  assert.match(route, /updateUserById/);
  assert.match(page, /deleteMyVoice/);
});

test("voice UI has responsive styling", () => {
  assert.match(css, /\.my-voice-panel/);
  assert.match(css, /@media\(max-width:720px\).*my-voice-source/s);
});
