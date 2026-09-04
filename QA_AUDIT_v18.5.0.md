# Cantoa Studio v18.5.0 QA Audit

## Scope
Owner Analytics, Provider Diagnostics & Cost Controls built on the v18.4.1 UI/customer flow and v18.4.0 cost-aware provider routing.

## Added
- Owner-only `/owner` console, linked only for authenticated owner accounts.
- 30-day active-plan MRR estimate and calibrated provider-spend estimate.
- Provider success/failure/fallback/latency diagnostics.
- Recent generation log with request type, selected/preferred provider, fallback state, requested duration, reserved minutes, calibrated cost estimate, latency, status and compact prompt preview.
- Dry routing tests that do not call a music provider and do not consume membership minutes.
- Cost/reliability alerts for high spend-to-MRR ratio, elevated failure rate, elevated fallback rate and uncalibrated successful generations.
- `generation_events` Supabase table with RLS enabled and no client policies; writes/reads occur through server-side service-role code after authentication/owner authorization as appropriate.
- Best-effort observability: analytics insertion failures never fail a customer generation.

## Cost policy encoded
- ElevenLabs: approximately $0.15 per generated minute, based on Cantoa live test 2026-09-02.
- Stable Audio 3.0: approximately $0.26 per successful generation, based on 26-credit Cantoa live test 2026-09-02.
- Mureka video soundtrack: approximately $0.10 per successful generation, based on Cantoa live test 2026-09-02.
- Mureka song-generation cost: deliberately left unknown until separately calibrated; the dashboard does not invent a value.

## Preserved cost guardrails
- One normal provider path at a time; compatible fallback only after failure.
- Mureka `n=1` for current song/instrumental/soundtrack calls.
- Failed provider-backed generations restore reserved membership minutes.
- Ordinary instrumental selection does not automatically force Stability.
- Background/ambient/score-oriented instrumentals may prefer Stability.
- Existing-audio Reel, square-video, lyric-video, gift-page and download exports do not call a music-generation provider.
- Creator entitlement remains 50 music-generation minutes/month; Studio remains 150.

## Verification performed
- Source/regression suite: **114/114 passed** using `node --test tests/cantoa-v*.test.mjs`.
- Full test command: **114/116 passed**. The two non-runnable checks were environment-dependent, not source regressions:
  - `rendered-html.test.mjs` requires a completed `.next` production build.
  - `ui-components.test.mjs` requires installed React/Next dependencies.
- TypeScript/TSX syntax transpilation check: passed for all modified/new app, API and library files.
- CSS brace-balance check: passed (1184 opening / 1184 closing braces).
- Secret-like literal scan: 0 hits.
- TODO/FIXME/HACK/XXX scan across app/lib/tests: 0 hits.
- Package and lockfile versions aligned at 0.18.5.0.

## Build-environment limitation
A clean `npm ci` was attempted with the available cache/registry path but did not complete within the sandbox timeout, so a fresh local Next.js production build could not be truthfully claimed. No `node_modules` or `.next` artifacts are included in the release ZIP. Vercel should perform the definitive dependency install and production compile after deployment.

## Database migration
**Required for the owner analytics console.** Run the current `supabase-setup.sql` once after deployment. The v18.5 statements are rerunnable. Customer generation remains operational if analytics storage is temporarily unavailable, but `/owner` will report that setup is required until the migration is applied.
