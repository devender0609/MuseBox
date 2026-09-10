# Cantoa v18.8.17 QA audit

## Bugs addressed

1. MP3/local downloads now dismiss both stale account and membership overlays before starting a local file download.
2. Stem-powered exports (Six Stems, Instrumental, Karaoke) now authorize through the server `stems` entitlement instead of relying only on transient client-side account state.
3. Stem source audio now sniffs its actual container signature (MP3/WAV/Ogg/MP4-family) and sends a matching filename/MIME type to the provider.
4. The stem provider route retries one transient 429/5xx response once and returns actionable errors for provider-plan/key/input/rate-limit failures instead of the generic failure only.
5. Membership modal now marks the actual current plan; Explore is no longer hard-coded as “Current plan”.

## Focused automated checks

`node --test tests/cantoa-v18-8-17.test.mjs`

Result: 6/6 passed.

## Production-build status

A full local `next build` could not be completed in this environment because dependency installation did not finish within the execution window. Vercel remains the final TypeScript/Next.js production build check.

## Database/environment

No SQL/schema change. No new environment variable.
