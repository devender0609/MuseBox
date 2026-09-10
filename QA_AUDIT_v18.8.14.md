# Cantoa QA Audit — v18.8.14

## Build failure addressed
Vercel v18.8.13 compiled but TypeScript rejected `song.id` because `Song.id` is optional (`string | undefined`) while `SongExportSession.songId` is required to be a string.

## Fix
- Added one `songExportKey(song)` helper that always returns a string.
- Persisted/cloud songs use their real `song.id`.
- Temporary/local songs without an id use a deterministic fallback based on creation time, title and object URL.
- The export-session cache and every stale-result guard use this same key.
- This preserves the v18.8.13 random-order export architecture without weakening the `Song` type or using an unsafe non-null assertion.

## QA
- Focused source regression added for optional song ids and stable export-key guards.
- Source/regression run: 247 applicable tests passed. Two environment-dependent tests could not run here: rendered production HTML requires a compiled `.next` build, and UI component tests require installed React dependencies.
- A full local Next.js build cannot run in this container because dependencies are not installed; Vercel remains the production typecheck/build validation.

No SQL or environment-variable change is required.
