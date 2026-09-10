# Cantoa v18.7.4 QA Audit

## User-reported issues addressed
- Removed the remaining visible Source / Your idea / Change selector from Advanced as well as Create.
- Kept source capability without the UI duplication: URL and long-text detection remain automatic, and Add media now handles image, video, or audio contextually.
- Tightened the free-Moment banner/note spacing and shortened its wording.
- Added an explicit UX contract that a free creation is consumed only after provider-backed music succeeds; sign-in itself never reserves an entitlement.
- Added a one-time Explore entitlement repair migration for accounts that inherited the old one-song state at the v18.7 launch. The repair recalculates from cloud-saved songs created after the two-free-creation migration timestamp and intentionally favors the customer in ambiguous prelaunch cases.
- Rebalanced the inline membership section and included Explore, Creator, and Studio in the same compact visual group.
- Added a colorful per-song download summary with song title, mode and duration.
- Removed an accidental duplicate `Describe what you want to create` label found during the UI audit.

## Accuracy / redundancy audit
- No visible `source-picker` remains in the app markup.
- No stale $9.99/$24.99 or 50/150 membership amounts remain in current app/components/lib UI code.
- Current plan contract remains Creator 40 min and Studio 120 min with regional USD/INR pricing.
- Free generation remains account-gated, capped at two successful creations of up to 2 minutes each, with failed provider-backed generation refunded.
- Re-exports from an existing song remain separate from new music-generation allowance.
- Provider routing, Stripe exact-price validation, owner analytics, marketing landing pages and server-side rate limits were not relaxed by this UI patch.

## Verification
- Source/regression suite excluding the two environment-dependent rendered/runtime checks: **136/136 passed**.
- Focused v18.7.4 tests: **6/6 passed**.
- TypeScript transpile/syntax diagnostics on modified critical TS/TSX files: **0 errors**.
- Existing environment-dependent checks not counted:
  1. rendered-html test requires a completed `.next` production build.
  2. ui-components test requires installed React/Next dependencies.
- A clean `npm ci` was attempted to reproduce the full Vercel build locally, but dependency installation timed out in this sandbox; Vercel remains the definitive production type-check/build.

## Deployment note
**Run the current `supabase-setup.sql` once after deploying v18.7.4.** This release adds the one-time `v18.7.4_free_creation_signin_repair` migration. It is rerunnable and guarded by `cantoa_schema_migrations`.
