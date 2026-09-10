# Cantoa v18.8.16 QA Audit

Focused patch for download/account-modal and stem-audio reliability issues reported on 2026-09-09.

## Fixes
- File downloads explicitly dismiss the account modal before download begins.
- `authorizeFeature` no longer force-opens the account modal on a missing/transient session; it reports sign-in requirement in-page instead.
- MP3 download now uses the finished song Blob directly through the same safe local download helper.
- PCM WAV export dismisses the account modal before entitlement validation.
- Karaoke, Instrumental, Six Stems, Lyrics and PCM export buttons are explicit `type="button"` controls.
- Stem source filename now matches the source Blob MIME type instead of always being named `song.mp3`.
- Sanitized stem ZIPs preserve the provider's exact decoded/audible audio bytes rather than re-tagging each stem before ZIP generation.
- Instrumental MP3 artwork is kept only if the tagged MP3 remains browser-decodable; otherwise the verified raw provider MP3 is used.
- Six-stem UI now explains that first-time separation can take longer than a normal download.

## Source regression checks
- v18.8.15 auth checks + v18.8.16 focused checks: 8/8 passed.

## Production build
A full local Next.js production build could not be completed because this package intentionally does not include `node_modules` and dependency installation exceeded the execution window. Vercel remains the final TypeScript/build verification.

## Retest
1. Close Account modal if open.
2. Download MP3 and PCM WAV; Account modal must remain closed.
3. On one known vocal song, request Instrumental, Karaoke, and Six Stems in random order.
4. Extract the stem ZIP and play every included audio file. Included stems should be actual audible provider files; silent/unused categories should be omitted and listed in the manifest.
5. Repeat on a revised vocal song.
