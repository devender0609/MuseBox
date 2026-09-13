# QA Audit — Cantoa v18.9.1

Baseline: user-uploaded v18.9.0 package. This is not a repack of the prior generated archive.

## Newly reproduced issues
1. `--accent` was referenced by multiple controls but never defined in the app theme. CSS declarations using it could become invalid or lose intended accent styling.
2. `--card` remained undefined while legacy panels used `var(--card,#fff)`, leaving a dark-mode white-fallback risk.
3. Social destination icons needed an explicit theme foreground to avoid icon-specific low contrast.

## Corrections
- Added canonical theme aliases: `--accent: var(--a)` and `--card: var(--surface)`.
- Added explicit dark/light collaboration row surfaces and text.
- Added explicit social button/SVG theme colors.
- No changes to providers, pricing, quotas, Stripe, Supabase schema, generation routes, Library ownership, Remix/Blend semantics, or entitlement logic.

## Validation
- Current release test suite must pass before packaging.
- Source syntax/transpile checks are run separately where local tooling permits.
- Full dependency-backed `next build` remains a Vercel deployment gate if `node_modules` is not present locally.
