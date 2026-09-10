# Cantoa v18.8.25 QA audit

Scope: My Voice usability refinement requested after live owner testing.

## Changes
- Removed the user-facing **Why this works** disclosure from the finished-song utility area.
- Redesigned **My Voice** around three explicit supported actions: Spoken intro, Spoken outro, and Voice message only.
- Added a clear spoken-message field, voice-profile selection, preview, standalone message download, and **Create song + intro/outro** action.
- Song + voice output is rendered locally in the browser as a new WAV; the original library song is not modified.
- Kept existing consent, private voice-profile creation, deletion, Creator/Studio limits, and ElevenLabs TTS routing.
- Added responsive light/dark styling for the new workflow.

## Focused regression
`node --test tests/cantoa-v18-8-25.test.mjs` → 6/6 passed.

## Deployment
No SQL migration. No new environment variable. Existing `ELEVENLABS_API_KEY` must retain Music Generation, Speech to Text, Text to Speech, and Voices permissions used by the current app.

Vercel remains the final full Next.js production build/typecheck gate because this source package does not contain the installed dependency tree.
