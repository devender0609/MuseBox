# Cantoa Studio v18.4.1 — QA Audit

## Scope
UI/copy hierarchy refinement only. No provider, billing, entitlement, database, authentication, storage, sharing, or generation API behavior was intentionally changed from v18.4.0.

## Changes reviewed
- Shortened Create language guidance while preserving open-ended language/dialect/mix support.
- Kept optional Song title, Style and user lyrics in Create and Advanced.
- Moved Song Blueprint after Advanced essentials and made it collapsible.
- Grouped 60+ language presets, section-language planning and pronunciation tools under one collapsible Advanced panel.
- Renamed the Vocals/Instrumental group from `Voice` to `Output` to avoid collision with `Voice direction`.
- Reworded Style influence as a clear style-adherence question.
- Softened the optional A/B preview wording in Create while preserving Advanced comparison controls.
- Added light/dark theme-aware styling for the new disclosure panels.

## Regression results
- TypeScript TSX parser: 0 parse diagnostics for `app/page.tsx`.
- Source/regression suite: 108/108 passing.
- Provider router file: byte-identical to v18.4.0.
- Music API route: byte-identical to v18.4.0.
- Mureka soundtrack route: byte-identical to v18.4.0; `n:1` guard preserved.
- Stripe webhook: byte-identical to v18.4.0; Creator 50 / Studio 150 minute entitlements preserved.
- Supabase SQL: byte-identical to v18.4.0; no migration required.
- TODO/FIXME/HACK scan in app/lib/components: clean.
- Secret scan found only documented placeholder strings (`...`) in deployment instructions; no actual API secrets were found.

## Build-environment limitation
A fresh `npm ci` was attempted twice. The package install could not complete in this sandbox because a required npm tarball (`zod-validation-error-4.0.2.tgz`) was not available in the local cache and registry access did not complete before the environment timeout. Therefore a fresh local Next.js production build and rendered React/Vite tests could not be truthfully claimed for this release. The source-level suite and TSX syntax validation passed. Vercel deployment remains the definitive production compile check.
