# Cantoa v18.7.2 QA audit

## Purpose
Strict-TypeScript production-build hotfix after Vercel exposed a second untyped dynamic-indexing path in owner regional-pricing analytics.

## Fix
- Added explicit `PaidPlan = "Creator" | "Studio"` typing.
- Added `paidPlanFrom(value: unknown)` parser before indexing regional price maps.
- Added typed `BillingCurrency` parser.
- Removed unsafe `CURRENT_INR[item.plan]` / `CURRENT_USD[item.plan]` indexing.
- Kept checkout amounts, entitlements, Stripe Price-ID validation, UI pricing, and Supabase schema unchanged from v18.7.1.

## Audit
- Searched app/lib/components for uppercase configuration maps indexed by dynamic values.
- Checkout route already narrows `plan` and `currency` explicitly.
- Owner analytics was the only remaining new v18.7 regional-pricing map with an untyped Supabase-derived index; fixed.
- Added a regression test preventing the unsafe owner-analytics pattern from returning.
- No new SQL migration versus v18.7.0/v18.7.1.

## Local verification limits
The complete Next production build cannot be reproduced in this sandbox because the dependency install repeatedly times out and leaves an incomplete `node_modules`. The pure source/regression suite is run separately and Vercel remains the definitive Next/TypeScript production-build check.
