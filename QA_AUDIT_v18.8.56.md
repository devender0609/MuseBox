# Cantoa QA Audit — v18.8.56

## Scope

v18.8.56 is a focused corrective release built directly on v18.8.55. It does not change pricing, quotas, provider-routing policy, membership entitlements, database schema, or environment variables.

This pass addressed the remaining issues identified after the v18.8.55 read-only smoke/source audit:

1. Native input/textarea placeholders could be too dark in dark mode, including the main creation description box.
2. Cloud Library audio/lyrics use time-limited signed URLs; long-lived browser sessions could require a manual Library refresh before Open, Compare, Create From, or Blend would work again.
3. The Library Create From / Blend dialog needed full Escape-key, focus trapping, and focus restoration behavior.
4. Library signed-URL responses should never be browser-cached.

## Fixes

### Theme parity
- Added explicit placeholder colors for all native `input` and `textarea` elements in both light and dark themes.
- The rule covers the main Create description, title/style/language, Story/Website inputs, Saved People/Moments, pronunciation fields, My Voice, Library search, and Remix/Blend instruction fields.
- Existing entered-text colors and active/inactive tab styling were left unchanged.

### Cloud Library secure-link recovery
- Added `refreshSavedSongLinks()` to obtain new signed audio/lyrics URLs from `/api/library` when a stored secure link is expired or otherwise no longer fetchable.
- Open Song, version comparison, Create From, and Blend now use the refresh-aware audio loader.
- Stored lyrics also retry with a freshly signed URL before being treated as unavailable.
- Refreshed signed URLs are written back into current Library client state.
- `/api/library` GET now sends `Cache-Control: private, no-store` so one-hour signed URLs are not accidentally reused from a browser cache.

### Create From / Blend dialog accessibility
- Added Escape-to-close when the dialog is not busy.
- Added keyboard focus trapping within the modal.
- Initial focus moves to the modal close button.
- Focus returns to the control that opened the dialog when that control still exists.
- Added a focusable dialog root fallback.

## QA evidence

- Current release gate: **26/26 passed** (`tests/cantoa-v18-8-56.test.mjs`).
- TypeScript/TSX syntax-transpile check: **134 files checked, 0 syntax-error files** using TypeScript 5.8.3.
- Existing v18.8.55 invariants remain in the current gate, including:
  - double-click generation protection;
  - A/B partial-success handling;
  - generation navigation locking;
  - desktop/mobile studio grid consistency;
  - explicit light/dark states for Create/Advanced and Library Remix/Blend;
  - all 9 Library transformations;
  - Blend 2–4 song limits and bounded DNA prompt size;
  - stale Photo/Video source clearing before audio remix;
  - 2 free / 40 Creator / 120 Studio limits;
  - USD/INR pricing invariants;
  - atomic quota reservation/refund path;
  - Website SSRF/redirect/size/timeout protections;
  - Group Song token/rate-limit protections;
  - My Voice premium/rate-limit protections;
  - Stripe webhook idempotency/stale-claim recovery;
  - sensitive-page indexing protections;
  - client API-route coverage;
  - no TODO/FIXME/HACK/XXX markers;
  - stylesheet coverage for literal page classes.

## Deliberately unchanged

- Explore: 2 free songs, max 2 minutes each.
- Creator: 40 minutes/month.
- Studio: 120 minutes/month.
- Creator pricing: US$7.99 / ₹499.
- Studio pricing: US$19.99 / ₹1,299.
- Normal generation ceiling: 5 minutes.
- Provider-routing policy.
- Supabase schema.
- Environment variables.

## Remaining deployment verification

A dependency-backed local `next build` is not claimed from this audit package because its local dependency tree is not installed. Vercel reaching **Ready** remains the production dependency/compiler gate. Live ElevenLabs/Mureka/Stable Audio/Stripe/Supabase/browser-permission behavior still requires production smoke execution.
