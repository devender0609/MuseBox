# Cantoa v18.8.41 — Smart Create 2.0 QA audit

## Scope
This release builds on the v18.8.40 navigation/state cleanup. It simplifies first-run creation and adds a compact intelligence layer without changing billing, entitlement, provider routing, storage, Group Song, My Voice, or export accounting.

## Changes
- New sessions now open with a blank creative brief instead of a prefilled demo song.
- Starter ideas are first-run assistance only: three show by default, More ideas reveals the rest, and the block disappears once the user has an idea.
- Removed the separate static genre/example row (Dance pop, Indie night drive, Cinematic score, Afrobeat), which duplicated the starter ideas and style field.
- Replaced the old visible IntentPlan export-label summary with a compact `Cantoa understood` summary of the current brief: moment/style, emotion, language/source, and vocal/instrumental mode (max four chips).
- Added three one-tap creative directions: Heartfelt, Cinematic, Fun. They change only creative parameters and do not call a provider or consume generation allowance.
- The selected direction is explicitly included in the provider-facing brief so the buttons are functional even for scratch-mode prompts.
- Source tools remain mutually exclusive and source-specific guidance remains scoped to the selected tool.
- Create-page copy is shorter and first-run guidance is now: pick a moment, add one detail, Cantoa handles the rest.
- Existing video watermark invariant remains always-on.

## Invariants intentionally unchanged
- Explore: 2 successful free music creations, up to 2 minutes each.
- Creator: 40 generation minutes.
- Studio: 120 generation minutes.
- Stripe/payment logic unchanged.
- Provider routing/cost calibration unchanged.
- Group Song / My Voice / Saved People & Moments entitlements unchanged.
- Download click-through guard unchanged.
- Generated Cantoa video branding remains always-on.

## Verification
- `tests/cantoa-v18-8-41.test.mjs`: 8/8 passed.
- v18.8.38–v18.8.41 focused current-behavior checks: v18.8.38, v18.8.39, v18.8.40 and v18.8.41 core assertions reviewed; historical tests that assert superseded UI/version text are not treated as current acceptance criteria.
- TypeScript `transpileModule` parser check: `app/page.tsx` passed with 0 syntax diagnostics.
- Full Next.js production build was not run locally because this packaged source does not include the installed dependency tree. Vercel remains the final production build/typecheck gate.

## Deployment
No SQL migration. No new environment variables.
