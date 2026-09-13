# Cantoa QA Audit — v18.9.0

## Scope
v18.9.0 is a focused feature release built directly on the v18.8.56 hardened baseline. The release adds Smart Remix Studio and Vibe Match while reusing the existing Library/audio remix route, quota reservation, provider routing and version-preservation behavior. It also fixes the dark-mode readability defects visible in the production screenshots for Secret Song Drop and Share Song.

## Feature-release changes
- Smart Remix Studio is the default Create-from-song experience.
- Smart Remix lets the user explicitly choose which source qualities remain recognizable: lyrics, style, voice character, energy and structure.
- If Keep lyrics is selected but the Library item has no stored lyrics, Cantoa stops before generation and reports the issue.
- Vibe Match creates a fresh composition using high-level mood/energy/production atmosphere as reference and explicitly instructs the provider not to copy melody, lyrics or the recording.
- Existing features are surfaced instead of duplicated: Best of A/B, Replace Section, Blend Songs, lyric video, Creator Pack, Group Song, and automatic 15-second social video.
- “Best Moment AI” is surfaced as “Social Cut Creator” to make the action clearer.

## Dark-mode corrections
- Removed legacy white direct-child islands inside Share Song by neutralizing the old `.share-panel > div` background for the social share panel only.
- Added explicit dark-mode surfaces/text/borders for social destination buttons.
- Secret Song Drop no longer falls back to `#fff`; it now uses the core studio theme tokens.
- Dark-mode date/time input uses `color-scheme: dark` so native controls remain visible.
- Light mode remains explicitly supported.

## Regression / acceptance gate
- `node --test tests/cantoa-v18-9-0.test.mjs`: **32/32 passed**.
- 26 API routes remain present and literal client `/api/...` calls resolve to packaged routes.
- Commercial rules remain unchanged: 2 free creations up to 2 minutes each; Creator 40 minutes; Studio 120 minutes; USD and INR pricing unchanged.
- Atomic quota reservation, refund paths, webhook idempotency, Group Song throttling, My Voice premium checks, Website SSRF controls, sensitive-page indexing protections, mobile safe-area layout, expired Library signed-link refresh and modal focus management remain covered by the current gate.
- Source scan found no TODO/FIXME/HACK/XXX markers in app/components/lib/hooks/db/worker.
- 127 TS/TSX source files are present in those application directories; a parser-oriented TypeScript pass found no syntax diagnostics. Full dependency-backed Next.js build was not run locally because the extracted package does not contain installed dependencies.

## Deployment impact
- No new SQL.
- No new environment variables.
- No pricing/quota change.
- No new provider route.
- No change to Stripe plan IDs or billing architecture.
- No existing Library song is overwritten by Smart Remix/Vibe Match.

## Required post-deploy smoke checks
1. Vercel deployment reaches **Ready**.
2. In dark mode, open Secret Song Drop and Share Song and confirm there are no white islands / low-contrast labels.
3. In light mode, confirm those same controls remain readable.
4. Open Library > Create from > Smart Remix; toggle preserve chips, continue, and confirm the original remains untouched.
5. Test Smart Remix with Keep lyrics on a song with lyrics and on a song without stored lyrics.
6. Test Match this vibe and confirm it prepares a new linked version rather than overwriting the source.
7. Run one standard Create and one Library remix to confirm normal generation/quota behavior is unchanged.
8. Repeat Smart Remix and Share Song once on a phone-width viewport.
