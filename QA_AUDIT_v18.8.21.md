# Cantoa v18.8.21 QA Audit

## Scope
Adds contextual finished-song Version Comparison inside Revision Studio. No new main navigation or Create-screen control.

## Behavior
- Comparison appears only when the current song has at least one linked revision.
- Shows Original plus the two most recent linked revisions (or up to three revisions if an original cannot be resolved locally).
- Uses a single comparison player and carries the current playback position when switching versions.
- Comparison does not call `/api/music` and does not consume generation minutes.
- `Keep this one` marks a preferred version locally for the linked version family; it does not generate or overwrite audio.
- Current song/library data model and cloud schema are unchanged.
- Light/dark and narrow-screen styles included.

## Focused regression tests
`node --test tests/cantoa-v18-8-21.test.mjs`

Result: 6 passed / 0 failed.

## Broader static test note
Running `node --test tests/*.test.mjs` in this unpacked deployment source is not a valid full-app pass because `node_modules` is absent. The run reached 284 tests with 273 passing and 11 failing due to missing imported packages/modules. This is an environment/dependency limitation, not represented as a production build result.

## Production gate
Vercel remains the final Next.js install, TypeScript, and production-build check.

## Database / environment
No SQL migration. No new environment variables.
