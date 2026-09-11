# Cantoa Studio v18.8.48 — QA / Audit Record

Date: 2026-09-11

## Scope
This pass reviewed the v18.8.47 source package and concentrated on creation-state precedence, navigation/generation locking, pricing and Stripe region logic, Owner Console accounting, API-route references, authentication/authorization patterns, source ingestion, Group Song public surfaces, library persistence, native audio formats, provider routing, environment configuration, and current regression coverage.

## Confirmed and fixed in this pass

1. **Starter idea precedence:** starter cards previously set prompt plus hidden moment/style/emotion/language/mode defaults. Manual prompt edits could leave some starter provenance behind. v18.8.48 tracks the untouched starter prompt and which starter-derived controls the user explicitly overrides; once the main brief is edited, untouched starter defaults are cleared while deliberate style/language/output/duration choices are preserved.
2. **Mixed instrumental/vocal wording:** explicit vocal wording now wins for requests such as “instrumental intro with a male singer”; explicit “no vocals / instrumental only” wording remains the hard instrumental override.
3. **Programmatic prompt replacement:** voice transcription, long paste, derived-song workflows, Group Song loading, and revision flows clear stale starter provenance.
4. **Owner INR visibility:** USD and INR MRR are separate. Active paid memberships are shown by email, plan, recorded currency/price, regional price market, and minutes remaining. Configuration presence for regional Price IDs is shown without revealing secrets.
5. **Native audio export naming:** Memory Capsule, Creator Pack, Jingle Pack, instrumental, Karaoke, and cloud-library filenames preserve supported native extensions rather than forcing `.mp3`.
6. **Audio copy:** customer-facing text that falsely promised MP3 for all provider outputs was changed to accurate audio/native-format wording. Genuine MP3-specific My Voice/export implementation text remains unchanged.
7. **Environment documentation:** every production `process.env` variable referenced in app/lib/components is represented in `.env.example`; the unused Creator Payment Link example entry was removed.

## Re-verified invariants
- Explore remains 2 free songs, up to 2 minutes each.
- Creator remains 40 minutes; Studio remains 120 minutes.
- USD monthly prices remain 799 / 1999 cents; INR monthly prices remain 49900 / 129900 paise.
- Checkout selects INR only from the India request-country header and validates the configured Stripe Price currency, amount, and monthly recurrence before opening checkout.
- Owner analytics keeps INR MRR separate from USD provider-cost economics instead of converting currencies silently.
- General song generation remains capped at 300 seconds server-side.
- Creation workspace/navigation is disabled while generation/preview is active so the visible configuration cannot drift away from the in-flight job.
- Current source-switching keeps one primary source and clears stale hidden source state.
- Group Song public contribution/vote surfaces remain token-based; writes are best-effort throttled, and voter identity is stored in an HttpOnly server-set cookie rather than trusted from a client-supplied voter token.
- Literal API fetch references checked in the main creation surface map to existing route files.
- No hardcoded cloud `.mp3` storage path remains for saved songs.
- No TODO/FIXME/HACK marker was found in app/lib/components in this pass.

## Current automated validation
- `tests/cantoa-v18-8-48.test.mjs`: **13/13 passed**.
- TypeScript parser/transpile check: **121 TS/TSX files parsed, 0 syntax diagnostics** using the available global TypeScript compiler.
- Environment-reference audit: **0 referenced production environment variables missing from `.env.example`; 0 documented variables unused by current production source**.
- Broader historical archive was also run: **395 passed / 44 failed**. It is not the release gate because the archive contains many version-pinned expectations that intentionally conflict with the current version/current wording, plus dependency/render tests that require a complete installed Next/React tree. Historical failures were not reclassified as current defects merely because their obsolete string/version assertions fail.

## What could not be certified locally
A complete dependency-backed `next build` was not available in this container. `npm ci --offline` fails because at least one required package tarball is not cached, and the prior online install attempt timed out. Therefore this audit does **not** claim a successful production Next.js build. Vercel build output remains the integration/compiler gate after deployment.

Real Stripe, Supabase, browser permission behavior, and provider calls (ElevenLabs, Stability, Mureka) also cannot be certified by static/source tests alone and still require production smoke tests.

## Known limitations / not misrepresented as fixed
- Group Song public throttling uses an in-memory server limiter. It is useful abuse friction but is not a globally persistent distributed rate limit across every serverless instance. The HttpOnly vote cookie also raises the cost of casual vote manipulation but cannot make an unlisted public voting link mathematically abuse-proof.
- Website import performs HTTPS-only validation, public-DNS checks, redirect revalidation, content-type checks, and a 2 MB response cap. DNS is nevertheless resolved once for validation and again by the platform fetch, so this is strong application-level SSRF hardening, not a claim of network-layer pinning against every DNS-rebinding scenario.
- INR subscription currency identifies use of the INR regional price. The current membership schema does not store Stripe billing country, so Owner Console intentionally does not label this as verified physical country.

## Production smoke-test checklist after Vercel deploy
Run at least one real path for: Quick Create; starter → manual edit → Create; explicit vocal/instrumental conflict wording; Advanced; Website → vocals; Website → instrumental; Photo soundtrack; Video soundtrack; voice transcription; Library save/open/delete/download; Memory Capsule/Creator Pack/Karaoke export; Gift/share/reaction; Group Song contribution/vote; USD checkout; INR checkout (India-routed request); Manage Membership; Owner Console USD/INR Paid Members; and one primary-provider failure/fallback case if it can be safely induced.
