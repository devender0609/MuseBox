# Cantoa v18.8.55 — Exhaustive Release QA Audit

Date: 2026-09-13
Baseline: deployed v18.8.54 source package
Purpose: non-destructive release hardening; no new product feature set, pricing, quota, provider policy, SQL, or environment variables.

## Release-gate result

- Current v18.8.55 regression suite: **22/22 passed**.
- TypeScript/TSX syntax-transpile sweep: **123 files, 0 syntax-error files**.
- API route inventory: **26 routes**.
- Client literal `/api/...` fetch audit: every literal route used by the client resolves to a route in the package.
- Environment audit: all application-specific `process.env` variables are documented in `.env.example`; `NODE_ENV` is runtime-provided. No unused documented app variables were found.
- Source hygiene: no TODO/FIXME/HACK/XXX markers found in app/components/lib.
- Main-page literal CSS class audit: stylesheet coverage present for every literal class used by `app/page.tsx`.
- No new SQL.
- No new environment variables.

## Proven defects fixed in this pass

### 1. Synchronous duplicate-generation protection
React's disabled state is asynchronous, so an extremely fast double click could enter a billable creation handler twice before the rerender disabled the button. A synchronous `creationJobLockRef` now gates both full generation and A/B preview generation before a second request can begin.

### 2. Partial A/B preview honesty
Previously, if preview A completed but preview B failed, the successful result could be hidden even though the successful half-minute had legitimately been used. Successful previews are now retained as they complete; partial failure clearly explains that only successful audio was charged.

### 3. Blend duration no longer inflates short songs
Blend previously forced the anchor duration to at least 120 seconds. A 30-second source could therefore become a 2-minute request without the user choosing that. Blend now preserves the anchor's duration within the supported 30–300 second range.

### 4. Blend prompt size bounded
Blending up to four Library songs could construct an unnecessarily large provider prompt from stored prompts/lyrics. Per-song creative brief and lyric excerpts are now capped before assembling Blend DNA, preserving useful context without uncontrolled prompt growth.

### 5. Root HTML structure corrected
`CantoaAnalytics` was rendered as a sibling of `<body>` under `<html>`. It is now inside `<body>`, removing invalid document structure/hydration risk.

### 6. Creation navigation lock made consistent
Create and Library were already guarded while creation was active, but the Owner Console navigation could still be used. Owner navigation now follows the same busy-state guard and accessibility state.

### 7. Group Song UI redundancy reduced
The first-use interface no longer simultaneously offers a generic Group Song action and a misleading `Create another Group Song` action. `Create another Group Song` appears only after a group collection exists.

### 8. Explicit light/dark theme parity for important controls
Final cascade-level rules now explicitly protect readable default, selected, hover/disabled/focus states for the principal interactive families in both light and dark modes, including:
- Create / Advanced tabs
- segmented mode controls
- source choices
- smart-direction choices
- Library Create-from / remix controls
- Blend song picker
- transform modal textarea/actions
- mobile versions of those controls

The Owner Console remains its intentionally separate console presentation; this pass targets theme parity in the main Cantoa studio UI.

## Preserved commercial and entitlement invariants

- Explore: 2 free songs, maximum 2 minutes each.
- Creator: 40 minutes/month.
- Studio: 120 minutes/month.
- Creator prices: USD $7.99 / INR ₹499.
- Studio prices: USD $19.99 / INR ₹1,299.
- Normal generation ceiling: 5 minutes.
- Provider-backed generation keeps rate limiting, atomic reservation, and refund handling.
- Premium My Voice enforcement remains server-side.
- Group Song public surfaces remain token-gated and throttled.
- Stripe webhook idempotency/stale-processing recovery remains present.
- Website import retains SSRF/redirect/timeout/response-size hardening.

## v18.8.54 remix/blend regression coverage retained

The release gate verifies all promised Library transformations remain represented and originals are not overwritten; Blend remains 2–4 Library songs; stale photo/video state is cleared before audio remix; and the new Library UI has explicit light/dark contrast.

## Historical test archive

The entire historical test directory was also executed for diagnostic coverage:

- Total: 516
- Passed: 453
- Failed: 63

These 63 are **not used as the current release gate**. The archive intentionally contains tests pinned to older version labels, old UI strings/behavior, and some component/build tests requiring dependencies that are not available in the incomplete local install. Historical failures should be investigated only when their assertion still describes a current v18.8.55 invariant.

## Full Next.js build limitation

A valid local `next build` could not be completed in this environment. The available `node_modules` tree was incomplete (`next` executable absent), and a clean `npm ci` attempt timed out. Therefore this audit does **not** claim a local production build pass or fail. A Vercel deployment reaching **Ready** remains the dependency/compiler integration gate.

## Production smoke test still required

Static/source QA cannot certify third-party live behavior. After deployment, exercise at least one real path for normal vocal generation, instrumental generation, Advanced, Website, Photo/Video soundtrack, Library save/download/delete, each important Create-from/Blend flow, Gift, Group Song, My Voice, Stripe Manage Membership, and Owner Console. Test desktop + phone and both light/dark themes.

## Recommended next-level QA

For stronger ongoing release assurance, add automated browser tests (Playwright) across Chromium/WebKit/Firefox and phone viewports, a role matrix for Explore/Creator/Studio/Owner, Stripe test-mode webhook lifecycle tests, Supabase RLS/security tests, provider smoke tests behind a controlled test account, and Lighthouse/accessibility checks. These should be repeatable gates rather than one-off manual inspection.
