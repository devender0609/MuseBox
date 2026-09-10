# Cantoa v18.8.23 — My Voice v1 QA

## Added
- My Voice is tucked inside **More with this song**; no new main navigation item.
- Creator: 1 private voice profile. Studio: 3. Owner: test allowance 10.
- Record in-browser or upload an audio sample.
- Explicit self-voice consent is required server-side and client-side.
- Voice creation uses ElevenLabs Instant Voice Cloning (`POST /v1/voices/add`).
- Users can hear a generated spoken preview, create/download a short spoken MP3 clip, and delete a profile; deletion also requests provider deletion.
- Voice profile IDs are stored in authenticated Supabase user metadata, avoiding a database schema change.
- Creating/saving/deleting the voice does not consume Cantoa music-generation minutes; provider voice/TTS charges can still apply.

## Important product boundary
Current ElevenLabs Music does not expose an API parameter that makes a custom cloned voice the singer. ElevenLabs Professional Voice Cloning documentation also states that singing is not currently supported. Cantoa therefore labels My Voice v1 as a **spoken voice** feature for dedications/intros/messages and does not falsely claim cloned singing support.

## Provider permissions
The existing `ELEVENLABS_API_KEY` must have the provider permissions needed for Voices write/delete and Text to Speech in addition to the permissions already used by Cantoa. No new environment-variable name is introduced.

## Safety / privacy
- UI and API require the user to affirm that the sample is their own voice.
- Profiles are private/account-scoped in Cantoa.
- Deleting a profile requests deletion from ElevenLabs before removing it from Cantoa metadata.
- No public sharing of a voice profile is implemented.

## Focused tests
Run: `node --test tests/cantoa-v18-8-23.test.mjs`
The full Next.js production build remains the Vercel deployment gate when dependencies are not installed locally.
