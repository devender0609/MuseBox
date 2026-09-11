# Cantoa v18.8.51 — Production polish / verification audit

Date: 2026-09-11

## Scope
This pass deliberately avoided new product features. It audited privacy, SEO/indexing, browser state isolation, payment-return behavior, public/unlisted surfaces, security headers, caching, provider diagnostics exposure, generation-failure compensation reporting, and accessibility polish on the current v18.8.50 baseline.

## Issues found and fixed

### 1. Sensitive URLs could reach Google Ads analytics
The root layout previously loaded the Google tag on every route, including unlisted `/share/<token>`, `/contribute/<token>`, owner and checkout-success pages. That could expose sensitive URL paths or checkout query values to a third-party analytics script.

Fix:
- Added `components/cantoa-analytics.tsx`.
- Google Ads is not loaded on `/share/*`, `/contribute/*`, `/owner*`, or `/checkout-success`.
- Analytics `page_location` is reduced to origin + pathname; query strings are not sent by the Cantoa config.
- Analytics referrer is reduced to origin only.
- Site-wide `Referrer-Policy` is now `origin` so unlisted token paths are not sent as referrers to external origins.

### 2. Robots coverage was incomplete
`robots.ts` blocked `/api/` and `/share/`, but not contribution, owner or checkout-success surfaces.

Fix:
- Added `/contribute/`, `/owner`, and `/checkout-success` to robots disallow rules.
- Existing page-level `noindex` metadata remains in place.

### 3. Security response headers were missing
Fix:
- Added `X-Content-Type-Options: nosniff`.
- Added `X-Frame-Options: DENY`.
- Added `Referrer-Policy: origin`.
- Added a conservative `Permissions-Policy` for camera/microphone and disabled geolocation.
- Disabled DNS prefetch.
- Added HSTS in production.
- Added canonical `www.cantoamusic.com` → `cantoamusic.com` redirect.

A strict CSP was intentionally **not** added in this pass because Cantoa currently relies on Google tags, browser media APIs and Supabase/browser connections; a guessed CSP could silently break production. CSP should be introduced only after a report-only inventory on the deployed site.

### 4. Sitemap `lastModified` changed on every request/build
The sitemap used `new Date()` for every URL, implying every marketing page had just changed.

Fix:
- Removed synthetic `lastModified` timestamps while preserving canonical marketing URLs, priorities and change frequencies.

### 5. Checkout return could briefly show stale Explore status
Stripe success verification happened on `/checkout-success`, but the home app did not explicitly reconcile eventual webhook delay after returning.

Fix:
- Checkout success now verifies this is a completed Cantoa subscription session with Creator/Studio metadata and a client reference.
- Success copy no longer claims activation is instantaneous.
- Returning with `?checkout=success` triggers bounded membership refreshes at 0, 1.2, 3 and 6 seconds.
- Cancelled and unverifiable returns get truthful messages.
- `/api/account` is explicitly `private, no-store` and the client requests it with `cache: "no-store"`.

### 6. “My Sound” preference could cross accounts on a shared browser
The creative preference profile used one global Local Storage key.

Fix:
- My Sound is now scoped to the signed-in user ID (or `guest`).
- The old global key is migrated only for guest use, not into an arbitrary signed-in account.

### 7. Provider configuration diagnostics were public
`/api/providers` disclosed which commercial providers were configured and had no product consumer.

Fix:
- Route is now owner-only and no-store.

### 8. Public rate-limit rows contained raw unlisted tokens
Although the device fingerprint was hashed, the action key included raw Group Song / Gift tokens.

Fix:
- Public rate-limit action identifiers are now SHA-256-derived keys.
- Device fingerprints are additionally scoped to the hashed action, reducing cross-link correlation.

### 9. Anonymous Group Song voter identity could correlate across different Group Songs
The same global voter cookie was reused for all Group Songs.

Fix:
- New per-link voter cookie names use a non-reversible token hash fragment.
- Cookies are path-scoped to that Group Song API path, HttpOnly, SameSite=Strict and Secure in production.
- Existing legacy voter cookie is accepted once for continuity and then cleared.

### 10. Gift reaction fingerprint could correlate across different gift links
Fix:
- Gift reaction fingerprint now includes the unlisted gift token before hashing, making the stored anonymous identity link-specific.

### 11. Group Song vote-count DB failure could silently display zero votes
The vote-count query ignored database errors.

Fix:
- Vote-count DB failures now fail the read instead of returning misleading zero counts.
- Successful Group Song and Gift reaction reads are explicitly `private, no-store`.

### 12. Shared Gift DB outages could look like an invalid/deleted link
The server page used `notFound()` whenever the song query returned no data, even if the query itself failed.

Fix:
- Database errors are separated from genuine missing tokens.
- Added a friendly shared-song error boundary with Retry.

### 13. Reaction-video object URL could survive component unmount
Fix:
- Reaction object URL is revoked when replaced and when the gift component unmounts.
- Reaction choices now expose `aria-pressed`.
- Group Song contribution tabs expose `aria-pressed`, status uses an ARIA live status, and contribution photo alt text is more descriptive.

### 14. Refund failures were reported as refunded without checking the RPC result
Failed provider generations called the refund RPC but did not verify its result, while observability could still record `refunded`.

Fix:
- `refundMinutes()` now returns whether the refund RPC was confirmed.
- Music, soundtrack and remix failures report `refundConfirmed` and use `failed` rather than `refunded` observability when restoration could not be confirmed.
- User-visible failure wording tells the user to check their balance before retrying if restoration could not be confirmed.
- The non-idempotent refund RPC is deliberately **not blindly retried** because a network timeout after a committed refund could otherwise over-credit the account.

### 15. Unlisted/private wording remained ambiguous in two user-facing places
Fix:
- Anniversary marketing copy now says “unlisted gift link”.
- Group Song creator copy now states that anyone with the unlisted link can contribute and see shared ideas, while the finished song is not shared until the creator chooses to share it.

## Validation performed
- v18.8.51 focused regression suite: **11/11 passed**.
- TS/TSX syntax-transpile pass: **123 files, 0 syntax-error files**.
- `next.config.ts` syntax-transpile pass: **0 syntax diagnostics**.
- TODO/FIXME/HACK scan of app/components/lib: **none found**.
- API authorization inventory rechecked across all 26 API routes.
- Existing commercial invariants retained: Explore 2 free songs up to 2 minutes each, Creator 40 minutes, Studio 120 minutes, $7.99/$19.99 and ₹499/₹1,299, 5-minute normal generation ceiling.
- No new SQL migration.
- No new required environment variable.

## What could not be verified in this environment
A full dependency-backed `next build` could not be executed because the container has no network DNS access and the npm cache is missing `zod-validation-error@4.0.2`. `npm ci --offline` therefore fails before installation. Vercel Ready remains the compiler/dependency integration gate.

The container also could not resolve `cantoamusic.com`, so live production DOM, redirects and response headers could not be independently fetched here. After deployment, verify the production headers/redirect and run the normal live Stripe/Supabase/provider smoke test.

## Known design limitation retained intentionally
Cantoa's Website importer validates DNS before each fetch and blocks private/local ranges, nonstandard ports, unsafe redirects, oversized bodies and slow responses. It still uses platform `fetch`, so this pass does not claim a network-layer guarantee against every theoretical DNS-rebinding condition. Replacing it with a DNS-pinned HTTPS transport should be treated as a separate security engineering change and tested carefully before production.
