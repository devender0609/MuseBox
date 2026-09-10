# Cantoa v18.7.16 — Background Intelligence Pass

Scope was deliberately narrow: add more capability without adding permanent UI controls.

## Changes
- Added an invisible song-planning quality gate before ElevenLabs Music v2 planning. It reinforces explicit voice/language/name/lyrics/duration/mood constraints, blocks production instructions from becoming lyrics, asks for clean hooks, avoids accidental hook-boundary repetition, and requests clean endings.
- Added automatic multilingual/code-switch guidance for common Hindi-English/Hinglish, Punjabi-English, Arabic-English and Spanish-English prompts in Quick Create as well as Advanced. No new language UI was added.
- Sharing text is now contextual for gifts, personal moments, creator/video and business songs while reusing the existing share controls.
- Provider routing, fallback behavior, pricing, entitlements, indexing and existing visible creation/output controls were intentionally not changed.

## Verification
Run `node --test tests/*.test.mjs`. Tests that require a compiled `.next` tree or installed React dependencies remain environment-dependent and are not evidence of a Vercel production build until deployment completes.
