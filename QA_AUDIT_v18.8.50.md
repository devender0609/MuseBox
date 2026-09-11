# Cantoa Studio v18.8.50 — Release-Candidate Verification / Hardening Audit

## Scope
This pass used v18.8.49 as the baseline and focused on concurrency, billing/idempotency, entitlement truthfulness, cloud-library ownership, public/unlisted abuse paths, deletion cleanup, and release-test hygiene. No new product feature was intentionally added.

## Defects found and fixed
1. **Authenticated rate-limit race across simultaneous tabs/serverless requests.** The prior count-then-insert function was not serialized. It now uses a PostgreSQL advisory transaction lock per user/action.
2. **Checkout could fail open on membership-read failure.** A transient Supabase error could allow a paid member to proceed toward a second Stripe checkout. Checkout now fails closed when current membership cannot be verified.
3. **Membership read failures masquerading as normal access state.** Account, feature-access, customer portal, Group Song owner access, and My Voice now distinguish a database/configuration failure from an Explore/non-entitled user.
4. **Cross-user caller-supplied song UUID collision.** Because Library writes use the service role, a caller-supplied UUID is now checked before upsert. An ID already owned by another user is rejected with 409.
5. **Stripe webhook crash-window idempotency.** v18.8.49 used a claim row but did not distinguish processing from processed. v18.8.50 adds processing/processed state, a claim token, stale-claim recovery, explicit completion, and safe release on failure. A concurrent delivery while processing returns non-2xx so Stripe retries rather than treating an unfinished event as handled.
6. **Webhook early-return claim leak.** checkout.session.completed events without a Cantoa user reference now complete their claim before returning the warning response.
7. **Public read amplification.** Group Song activity reads and Gift reaction-count reads now use the persistent public rate limiter in addition to write throttles.
8. **Vote race/error handling.** Group Song vote reads/deletes now check database errors. A concurrent unique-insert race no longer produces a false 500 when the intended vote already exists.
9. **Library delete cleanup verification.** Deletion now aborts before removing audio if Group Song collection/photo metadata cannot be loaded, preventing silent orphan-photo cleanup gaps.
10. **Library/share/drop read failures.** Database failures are no longer mislabeled as “song not found.”
11. **Group Song contribution DB failures.** Database failures are now separated from a genuinely unavailable/closed unlisted link.
12. **Current-release test command.** `npm test` now targets the current consolidated release suite after the build. Historical tests remain available through `npm run test:historical` and are not treated as current release gates because many intentionally assert obsolete version-specific behavior.

## Preserved commercial/product invariants
- Explore: 2 free creations, max 2 minutes each.
- Creator: 40 monthly generation minutes.
- Studio: 120 monthly generation minutes.
- USD pricing: Creator $7.99, Studio $19.99.
- INR pricing: Creator ₹499, Studio ₹1,299.
- Maximum normal music generation request remains 300 seconds / 5 minutes.
- Generation-state lock and starter-description precedence remain present.
- Native MP3/WAV/M4A cloud storage handling remains present.
- Website source timeout/private-host/standard-HTTPS protections remain present.
- Persistent public throttling, Group Song unlisted model, and Group Song photo cleanup remain present.

## Verification performed
- `tests/cantoa-v18-8-50.test.mjs`: **9/9 passed**.
- TypeScript/TSX syntax-transpile sweep: **121 files, 0 syntax-error files**.
- API route inventory: **26 route handlers** reviewed/classified for authenticated, owner, token/unlisted, webhook-signature, or intentionally public access.
- Environment-variable source scan: all app-specific `process.env` variables are represented in `.env.example`; only runtime-provided `NODE_ENV` is intentionally absent.
- No TODO/FIXME/HACK markers found in app/lib/components/scripts.
- No hardcoded `.mp3` cloud storage-key regression found.

## Build limitation in this environment
A clean dependency-backed `npm ci` could not complete in the working container before timeout, so a full local `next build`/ESLint run was not certified here. The source syntax sweep and current release regression tests passed. Vercel's successful production build remains the definitive dependency/compiler integration gate.

## Production checks still required after deployment
These depend on live credentials/services and cannot be proven from static source alone: one real USD checkout and, when available, one INR checkout; Stripe customer portal; webhook renewal/plan-change/failure behavior; one real normal vocal generation; one instrumental/fallback path; one visual soundtrack; Group Song submit/vote; Gift reaction; Library save/download/delete; Website import; My Voice create/preview/delete; and Owner Console figures after those events.

## Database migration
Run `supabase-v18.8.50-hardening.sql` once after the base Supabase setup. It is cumulative for the v18.8.49 + v18.8.50 hardening layer and safe to rerun.
