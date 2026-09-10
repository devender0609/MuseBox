# Cantoa v18.7.3 QA Audit

## Scope
- Removed redundant Source / Your idea card from normal Create; kept source switching in Advanced.
- Added first-run free-creation banner at Moments and clear Video / Reel eligibility wording.
- Added Moment-specific prompt guidance for Birthday, Wedding, Family, Graduation, Video/Reel, Business, School, Relax, For Someone and Anything → music.
- Changed free-plan wording from “songs” to “music creations” where relevant.
- Enabled Explore social-video and lyric-video exports from an already-created song.
- Free Explore video exports receive a subtle “Made with Cantoa” mark; Creator/Studio/Owner social-video exports are clean.
- Audio itself is not audibly watermarked.
- Preserved 2 free provider-backed creations per account, 2-minute cap each, sign-in requirement, rate limits, refund-on-failure, regional pricing and Stripe fail-closed validation.

## Verification
- Source/regression tests excluding the two environment-dependent rendered/runtime checks: **130/130 passed**.
- Focused v18.7/v18.7.3 tests: **17/17 passed**.
- TypeScript transpile/syntax diagnostics on modified critical TS/TSX files: **0 errors**.
- Existing environment-dependent checks not counted:
  1. rendered-html test requires a completed `.next` production build.
  2. ui-components test requires installed React/Next dependencies.
- No new Supabase migration required relative to v18.7.2.

## Deployment note
Vercel remains the definitive full Next.js production compile/type-check because this packaging workspace does not include local project dependencies.
